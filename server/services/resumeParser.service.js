const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Clean and normalize extracted document text
 */
function cleanExtractedText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // Standardize newline characters
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Standardize bullet points
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25B6\u25BA]/g, '\n• ')
    // Normalize smart quotes and dashes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    // Replace non-breaking spaces
    .replace(/\u00A0/g, ' ')
    // Remove null bytes and non-printable control characters (except newline/tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Condense excessive spaces per line
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    // Remove more than 2 consecutive blank lines
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join('\n');
}

/**
 * Extract embedded image buffer from a scanned or image-based PDF
 */
function extractImageFromPdf(pdfBuffer) {
  if (!Buffer.isBuffer(pdfBuffer)) return null;

  // Search for standard JPEG stream in PDF (FF D8 FF ... FF D9)
  const jpegStart = pdfBuffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
  if (jpegStart !== -1) {
    const jpegEnd = pdfBuffer.lastIndexOf(Buffer.from([0xff, 0xd9]));
    if (jpegEnd > jpegStart) {
      return pdfBuffer.slice(jpegStart, jpegEnd + 2);
    }
  }

  // Search for PNG stream in PDF (89 50 4E 47 ... IEND)
  const pngStart = pdfBuffer.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (pngStart !== -1) {
    const pngEnd = pdfBuffer.indexOf(Buffer.from('IEND'), pngStart);
    if (pngEnd > pngStart) {
      return pdfBuffer.slice(pngStart, pngEnd + 8);
    }
  }

  return null;
}

/**
 * Strip RTF formatting tags from rich text documents
 */
function stripRtf(rtfText) {
  if (!rtfText || typeof rtfText !== 'string') return '';
  return rtfText
    .replace(/\\par(?:\s+|$)/gi, '\n')
    .replace(/\\[a-zA-Z0-9-]+[ ]?/g, '')
    .replace(/[{}]/g, '')
    .replace(/[\r\n]+/g, '\n')
    .trim();
}

/**
 * Extract raw text and metadata from PDF, DOCX, Images, or Text file (accepts file path or Buffer)
 */
async function extractResumeText(filePathOrBuffer, mimeType = '', optionalExt = '') {
  let fileBuffer;
  let fileExt = optionalExt.toLowerCase();

  if (Buffer.isBuffer(filePathOrBuffer)) {
    fileBuffer = filePathOrBuffer;
  } else if (typeof filePathOrBuffer === 'string') {
    if (!fs.existsSync(filePathOrBuffer)) {
      throw new Error('Resume file not found on server.');
    }
    fileExt = path.extname(filePathOrBuffer).toLowerCase();
    fileBuffer = fs.readFileSync(filePathOrBuffer);
  } else {
    throw new Error('Invalid input: expected file path or Buffer.');
  }

  let rawText = '';
  let pageCount = 1;
  let extractionMethod = 'text';

  if (fileExt === '.pdf' || mimeType === 'application/pdf') {
    try {
      if (typeof pdfParse === 'function') {
        // v1 compatibility
        const pdfData = await pdfParse(fileBuffer, { max: 20 });
        rawText = pdfData.text || '';
        pageCount = pdfData.numpages || 1;
      } else if (pdfParse?.PDFParse) {
        // v2 compatibility (pdf-parse ^2.0)
        const parser = new pdfParse.PDFParse({ data: fileBuffer });
        const textResult = await parser.getText();
        rawText = textResult.text || '';
        pageCount = textResult.total || 1;
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      } else if (typeof pdfParse?.default === 'function') {
        const pdfData = await pdfParse.default(fileBuffer, { max: 20 });
        rawText = pdfData.text || '';
        pageCount = pdfData.numpages || 1;
      } else {
        throw new Error('Unsupported pdf-parse module structure');
      }
      extractionMethod = 'pdf-parse';

      // Check if PDF has little or no text layer (scanned/image-only PDF like Enhancv or canvas export)
      const currentCleaned = cleanExtractedText(rawText);
      const currentWords = currentCleaned.trim() ? currentCleaned.trim().split(/\s+/).length : 0;

      if (currentWords < 20 || currentCleaned.length < 50) {
        const imgBuffer = extractImageFromPdf(fileBuffer);
        if (imgBuffer) {
          try {
            const Tesseract = require('tesseract.js');
            const ocrResult = await Tesseract.recognize(imgBuffer, 'eng');
            if (ocrResult?.data?.text && ocrResult.data.text.trim().length > 30) {
              rawText = ocrResult.data.text;
              extractionMethod = 'pdf-ocr-tesseract';
            }
          } catch (ocrErr) {
            console.warn('[PDF OCR Fallback] Failed to OCR embedded image:', ocrErr.message);
          }
        }
      }
    } catch (err) {
      console.error('PDF parsing error:', err.message);
      // Attempt OCR directly on embedded image as a resilient fallback
      try {
        const imgBuffer = extractImageFromPdf(fileBuffer);
        if (imgBuffer) {
          const Tesseract = require('tesseract.js');
          const ocrResult = await Tesseract.recognize(imgBuffer, 'eng');
          if (ocrResult?.data?.text && ocrResult.data.text.trim().length > 30) {
            rawText = ocrResult.data.text;
            extractionMethod = 'pdf-ocr-tesseract';
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      } catch (fallbackErr) {
        throw new Error(`Failed to parse PDF document: ${err.message}`);
      }
    }
  } else if (
    fileExt === '.png' ||
    fileExt === '.jpg' ||
    fileExt === '.jpeg' ||
    fileExt === '.webp' ||
    (mimeType && mimeType.startsWith('image/'))
  ) {
    try {
      const Tesseract = require('tesseract.js');
      const ocrResult = await Tesseract.recognize(fileBuffer, 'eng');
      rawText = ocrResult?.data?.text || '';
      pageCount = 1;
      extractionMethod = 'image-ocr-tesseract';
    } catch (ocrErr) {
      console.error('Image OCR error:', ocrErr.message);
      throw new Error(`Failed to extract text from image: ${ocrErr.message}`);
    }
  } else if (
    fileExt === '.txt' ||
    fileExt === '.rtf' ||
    mimeType === 'text/plain' ||
    mimeType === 'text/rtf' ||
    mimeType === 'application/rtf'
  ) {
    try {
      const rawString = fileBuffer.toString('utf-8');
      rawText = fileExt === '.rtf' || (mimeType && mimeType.includes('rtf')) ? stripRtf(rawString) : rawString;
      pageCount = 1;
      extractionMethod = fileExt === '.rtf' ? 'rtf-text' : 'plain-text';
    } catch (txtErr) {
      console.error('Text parsing error:', txtErr.message);
      throw new Error(`Failed to read text document: ${txtErr.message}`);
    }
  } else if (
    fileExt === '.docx' ||
    fileExt === '.doc' ||
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('msword')
  ) {
    try {
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = docxResult.value || '';
      pageCount = 1; // DOCX raw text doesn't expose fixed page boundaries
      extractionMethod = 'mammoth-docx';
    } catch (err) {
      console.error('DOCX parsing error:', err.message);
      throw new Error(`Failed to parse Word document: ${err.message}`);
    }
  } else {
    throw new Error('Unsupported document format for text extraction. Please upload PDF, Word, Image, or Text file.');
  }

  const cleanedText = cleanExtractedText(rawText);
  const wordCount = cleanedText.trim() ? cleanedText.trim().split(/\s+/).length : 0;
  const isScanned = cleanedText.trim().length < 50 || wordCount < 15;

  return {
    text: cleanedText,
    wordCount,
    pageCount,
    isScanned,
    extractionMethod,
  };
}

module.exports = {
  extractResumeText,
  cleanExtractedText,
};
