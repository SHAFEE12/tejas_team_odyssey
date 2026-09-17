const dns = require('dns');

dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const authRoutes = require('./routes/auth.routes');
const skillProfileRoutes = require('./routes/skillProfile.routes');
const dsaRoutes = require('./routes/dsa.routes');
const githubRoutes = require('./routes/github.routes');
const careerScoreRoutes = require('./routes/careerScore.routes');
const resumeRoutes = require('./routes/resume.routes');
const skillGapRoutes = require('./routes/skillGap.routes');
const roadmapRoutes = require('./routes/roadmap.routes');
const projectRoutes      = require('./routes/project.routes');
const opportunityRoutes  = require('./routes/opportunity.routes');
const applicationRoutes  = require('./routes/application.routes');
const analyticsRoutes    = require('./routes/analytics.routes');
const reminderRoutes     = require('./routes/reminder.routes');
const copilotRoutes      = require('./routes/copilot.routes');
const careerIntelligenceRoutes = require('./routes/careerIntelligence.routes');
const executionRoutes    = require('./routes/execution.routes');
const commandCenterRoutes = require('./routes/commandCenter.routes');
const adaptiveCareerRoutes = require('./routes/adaptiveCareer.routes');
const careerOutcomeRoutes = require('./routes/careerOutcome.routes');

const app = express();

/* ─────────────────────────────────────────────
   Middleware & Security Headers
───────────────────────────────────────────── */

const clientOrigin = process.env.CLIENT_URL
  ? (process.env.CLIENT_URL.includes(',') ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : process.env.CLIENT_URL.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);

// Minimal production-grade security headers without external bloat
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SECURITY: Only avatars are statically served.
// Resumes are NEVER publicly served; they are private documents accessible only via authenticated /api/resume/download.
app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));

/* ─────────────────────────────────────────────
   Routes
───────────────────────────────────────────── */

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/skills',
  skillProfileRoutes
);

app.use(
  '/api/skill-profile',
  skillProfileRoutes
);

app.use(
  '/api/dsa',
  dsaRoutes
);

app.use(
  '/api/github',
  githubRoutes
);

app.use(
  '/api/career-score',
  careerScoreRoutes
);

app.use(
  '/api/resume',
  resumeRoutes
);

app.use(
  '/api/skill-gap',
  skillGapRoutes
);

app.use(
  '/api/roadmap',
  roadmapRoutes
);

app.use(
  '/api/projects',
  projectRoutes
);

app.use(
  '/api/opportunities',
  opportunityRoutes
);

app.use(
  '/api/applications',
  applicationRoutes
);

app.use(
  '/api/analytics',
  analyticsRoutes
);

app.use(
  '/api/reminders',
  reminderRoutes
);

app.use(
  '/api/copilot',
  copilotRoutes
);

app.use(
  '/api/career-intelligence',
  careerIntelligenceRoutes
);

app.use(
  '/api/execution',
  executionRoutes
);

app.use(
  '/api/command-center',
  commandCenterRoutes
);

app.use(
  '/api/adaptive-career',
  adaptiveCareerRoutes
);

app.use(
  '/api/career-outcome',
  careerOutcomeRoutes
);

const ecosystemRoutes = require('./routes/ecosystem.routes');
app.use(
  '/api/ecosystem',
  ecosystemRoutes
);

const academicianRoutes = require('./routes/academician.routes');
app.use(
  '/api/academician',
  academicianRoutes
);

const institutionRoutes = require('./routes/institution.routes');
app.use(
  '/api/institution',
  institutionRoutes
);

const industryRoutes = require('./routes/industry.routes');
app.use(
  '/api/industry',
  industryRoutes
);

const matchingRoutes = require('./routes/matching.routes');
app.use(
  '/api/matching',
  matchingRoutes
);

// ── SIH 26044 Canonical Platform Routes ─────────────────────────
const assessmentRoutes = require('./routes/assessment.routes');
app.use('/api/assessments', assessmentRoutes);

const academiaRoutes = require('./routes/academia.routes');
app.use('/api/academia', academiaRoutes);

const skillTaxonomyRoutes = require('./routes/skillTaxonomy.routes');
app.use('/api/skill-taxonomy', skillTaxonomyRoutes);

const industryDemandRoutes = require('./routes/industryDemand.routes');
app.use('/api/industry-demand', industryDemandRoutes);

const placementRoutes = require('./routes/placement.routes');
app.use('/api/placements', placementRoutes);

const evaluationRoutes = require('./routes/evaluation.routes');
app.use('/api/evaluations', evaluationRoutes);

const demoRoutes = require('./routes/demo.routes');
app.use('/api/demo', demoRoutes);

// Internship alias to opportunityRoutes for SIH endpoint compatibility
app.use('/api/internships', opportunityRoutes);

/* ─────────────────────────────────────────────
   Health Check & Safe Error Handling
───────────────────────────────────────────── */

app.get(
  '/api/health',
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'CareerOdyssey API is running',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  }
);

// 404 Fallback for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Production-safe global error handling middleware
app.use((err, _req, res, _next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || err.statusCode || 500;
  
  // Safe server logging without leaking sensitive payload data
  console.error(`[Error Handler] ${status} - ${err.message}`);

  res.status(status).json({
    success: false,
    message: isProd && status === 500
      ? 'An unexpected internal error occurred. Please try again later.'
      : err.message || 'Internal Server Error',
  });
});

/* ─────────────────────────────────────────────
   Start Server
───────────────────────────────────────────── */

const startServer = async () => {
  try {
    await connectDB();

    app.listen(
      PORT,
      () => {
        console.log(
          `CareerOdyssey server running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      'Failed to start server:',
      error.message
    );

    process.exit(1);
  }
};

startServer();