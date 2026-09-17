const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const SkillProfile = require('../models/SkillProfile');
const { extractResumeText } = require('../services/resumeParser.service');
const { analyzeResumeDocument } = require('../services/resumeAnalyzer.service');
const {
  checkGeminiHealth,
  analyzeResumeWithGemini,
} = require('../services/geminiResumeAnalyzer.service');
const {
  deleteResumeFile,
  getResumeFilePath,
  saveResumeFile,
  getResumeStream,
} = require('../services/resumeStorage.service');

/**
 * Upload and analyze a resume file
 * POST /api/resume/upload
 */
const uploadResume = async (req, res) => {
  let savedFile = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded. Please upload a PDF, Word (DOCX/DOC), Image (PNG/JPG/WEBP), or Text (TXT/RTF) file (up to 10 MB).',
      });
    }

    const userId = req.user._id;
    const file = req.file;

    // Check if student already has a stored resume
    const existingResume = await Resume.findOne({ user: userId });
    if (existingResume) {
      // Clean up old file from storage
      await deleteResumeFile(existingResume.storageKey);
    }

    // Step 1: Save file to persistent storage abstraction (S3 or local disk)
    const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
    if (!fileBuffer) {
      return res.status(400).json({
        success: false,
        message: 'Unable to process uploaded resume file buffer.',
      });
    }

    savedFile = await saveResumeFile(fileBuffer, file.originalname, file.mimetype);

    // Step 2: Text extraction from buffer or file (native baseline)
    let extractedData;
    try {
      extractedData = await extractResumeText(fileBuffer, file.mimetype, path.extname(file.originalname));
    } catch (parseErr) {
      // Clean up uploaded file if parsing crashes
      if (savedFile) {
        await deleteResumeFile(savedFile.storageKey);
      }
      return res.status(422).json({
        success: false,
        message: parseErr.message || 'Failed to extract text from document.',
      });
    }

    // Step 3: Fetch student's current SkillProfile for career goal & skills comparison
    const skillProfile = await SkillProfile.findOne({ user: userId }).lean();

    // Step 4: Run comprehensive analysis with Google Gemini AI (with deterministic fallback)
    const analysis = await analyzeResumeWithGemini({
      fileBuffer,
      mimeType: file.mimetype,
      filename: file.originalname,
      extractedData,
      skillProfile,
    });

    // Step 5: Upsert Resume record in MongoDB
    const resumePayload = {
      user: userId,
      originalFileName: file.originalname,
      storedFileName: savedFile.filename,
      mimeType: file.mimetype,
      fileSize: file.size || fileBuffer.length,
      storageKey: savedFile.storageKey,
      status: analysis.status === 'needs_ocr' ? 'needs_ocr' : 'completed',
      extractedText: extractedData.text || '',
      analysis,
      uploadedAt: new Date(),
      analyzedAt: new Date(),
    };

    const resumeDoc = await Resume.findOneAndUpdate(
      { user: userId },
      resumePayload,
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully.',
      data: {
        _id: resumeDoc._id,
        originalFileName: resumeDoc.originalFileName,
        fileSize: resumeDoc.fileSize,
        mimeType: resumeDoc.mimeType,
        status: resumeDoc.status,
        extractedText: resumeDoc.extractedText,
        analysis: resumeDoc.analysis,
        uploadedAt: resumeDoc.uploadedAt,
        analyzedAt: resumeDoc.analyzedAt,
      },
    });
  } catch (error) {
    console.error('Error in uploadResume:', error.message);
    if (savedFile) {
      await deleteResumeFile(savedFile.storageKey);
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while processing resume upload. Please try again.',
    });
  }
};

/**
 * Get current authenticated student's resume
 * GET /api/resume
 */
const getStudentResume = async (req, res) => {
  try {
    const userId = req.user._id;
    let resume = await Resume.findOne({ user: userId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume uploaded yet.',
      });
    }

    // Auto-heal legacy zero-score or needs_ocr resumes using Gemini AI
    if (resume.status === 'needs_ocr' || !resume.analysis?.resumeScore || resume.analysis?.resumeScore === 0) {
      try {
        const streamInfo = await getResumeStream(resume.storageKey);
        if (streamInfo && streamInfo.stream) {
          const chunks = [];
          for await (const chunk of streamInfo.stream) {
            chunks.push(chunk);
          }
          const fileBuffer = Buffer.concat(chunks);
          const extractedData = await extractResumeText(fileBuffer, resume.mimeType, path.extname(resume.originalFileName));
          const skillProfile = await SkillProfile.findOne({ user: userId }).lean();
          const freshAnalysis = await analyzeResumeWithGemini({
            fileBuffer,
            mimeType: resume.mimeType,
            filename: resume.originalFileName,
            extractedData,
            skillProfile,
          });
          if (freshAnalysis && freshAnalysis.resumeScore > 0) {
            resume.analysis = freshAnalysis;
            resume.status = 'completed';
            if (extractedData?.text) {
              resume.extractedText = extractedData.text;
            }
            resume.analyzedAt = new Date();
            await resume.save();
          }
        }
      } catch (healErr) {
        console.warn('[Gemini Auto-Heal Notice]:', healErr.message);
      }
    }

    // Exclude raw filesystem paths and internal storage keys
    return res.status(200).json({
      success: true,
      data: {
        _id: resume._id,
        originalFileName: resume.originalFileName,
        fileSize: resume.fileSize,
        mimeType: resume.mimeType,
        status: resume.status,
        extractedText: resume.extractedText,
        analysis: resume.analysis,
        uploadedAt: resume.uploadedAt,
        analyzedAt: resume.analyzedAt,
      },
    });
  } catch (error) {
    console.error('Error in getStudentResume:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve resume data.',
    });
  }
};

/**
 * Re-analyze existing uploaded resume
 * POST /api/resume/:id/analyze (or POST /api/resume/analyze)
 */
const reanalyzeResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const resume = await Resume.findOne({ user: userId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No stored resume found to analyze.',
      });
    }

    let extractedData;
    const streamInfo = await getResumeStream(resume.storageKey);

    let fileBuffer = null;
    if (streamInfo && streamInfo.stream) {
      // Buffer stream to parse
      const chunks = [];
      for await (const chunk of streamInfo.stream) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
      extractedData = await extractResumeText(fileBuffer, resume.mimeType, path.extname(resume.originalFileName));
    } else if (resume.extractedText) {
      extractedData = {
        text: resume.extractedText,
        wordCount: resume.extractedText.split(/\s+/).length,
        pageCount: 1,
        isScanned: false,
        extractionMethod: 'cached-text',
      };
    } else {
      return res.status(404).json({
        success: false,
        message: 'Original document file is no longer available. Please upload again.',
      });
    }

    const skillProfile = await SkillProfile.findOne({ user: userId }).lean();
    const analysis = await analyzeResumeWithGemini({
      fileBuffer,
      mimeType: resume.mimeType,
      filename: resume.originalFileName,
      extractedData,
      skillProfile,
    });

    resume.analysis = analysis;
    resume.analyzedAt = new Date();
    resume.status = analysis.status === 'needs_ocr' ? 'needs_ocr' : 'completed';
    if (extractedData?.text) {
      resume.extractedText = extractedData.text;
    }
    await resume.save();

    return res.status(200).json({
      success: true,
      message: 'Resume re-analyzed successfully with Google Gemini AI.',
      data: {
        _id: resume._id,
        originalFileName: resume.originalFileName,
        fileSize: resume.fileSize,
        mimeType: resume.mimeType,
        status: resume.status,
        analysis: resume.analysis,
        uploadedAt: resume.uploadedAt,
        analyzedAt: resume.analyzedAt,
      },
    });
  } catch (error) {
    console.error('Error in reanalyzeResume:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to re-analyze resume. Please try again later.',
    });
  }
};

/**
 * Delete stored resume and analysis
 * DELETE /api/resume/:id (or DELETE /api/resume)
 */
const deleteResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const resume = await Resume.findOne({ user: userId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found to delete.',
      });
    }

    // Delete file from persistent storage
    await deleteResumeFile(resume.storageKey);

    // Delete record from MongoDB
    await Resume.deleteOne({ _id: resume._id });

    return res.status(200).json({
      success: true,
      message: 'Resume and analysis deleted successfully.',
    });
  } catch (error) {
    console.error('Error in deleteResume:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete resume.',
    });
  }
};

/**
 * Securely download student's original uploaded resume file
 * GET /api/resume/:id/download (or GET /api/resume/download)
 */
const downloadResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const resume = await Resume.findOne({ user: userId });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found.',
      });
    }

    const streamInfo = await getResumeStream(resume.storageKey);
    if (!streamInfo || !streamInfo.stream) {
      return res.status(404).json({
        success: false,
        message: 'Physical document file not found on server.',
      });
    }

    res.setHeader('Content-Type', resume.mimeType || streamInfo.mimeType || 'application/pdf');
    if (streamInfo.contentLength) {
      res.setHeader('Content-Length', streamInfo.contentLength);
    }

    if (req.query.inline === 'true') {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resume.originalFileName)}"`);
      res.removeHeader('X-Frame-Options');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resume.originalFileName)}"`);
    }

    return streamInfo.stream.pipe(res);
  } catch (error) {
    console.error('Error in downloadResume:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to download resume file.',
    });
  }
};

/**
 * Check Google Gemini AI resume analyzer engine status
 * GET /api/resume/analyzer-status
 */
const getAnalyzerStatus = async (req, res) => {
  try {
    const health = await checkGeminiHealth();
    return res.status(200).json({
      success: true,
      data: {
        online: health.online,
        provider: health.provider || 'gemini-ai',
        model: health.model || 'gemini-3.6-flash',
        activeEngine: health.activeEngine || 'gemini-ai',
        latencyMs: health.latencyMs || 0,
        fallbackAvailable: true,
        reason: health.reason || (health.online ? 'Google Gemini AI engine connected and active' : 'Gemini AI API unreachable'),
      },
    });
  } catch (error) {
    console.error('Error in getAnalyzerStatus:', error.message);
    return res.status(200).json({
      success: true,
      data: {
        online: false,
        provider: 'native-deterministic',
        model: null,
        activeEngine: 'native-deterministic',
        fallbackAvailable: true,
        reason: error.message,
      },
    });
  }
};

module.exports = {
  uploadResume,
  getStudentResume,
  reanalyzeResume,
  deleteResume,
  downloadResume,
  getAnalyzerStatus,
};
