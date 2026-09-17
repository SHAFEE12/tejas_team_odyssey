/**
 * projectBlueprints.js
 *
 * Centralized Curated Project Blueprints Dataset.
 *
 * NOTE: These blueprints represent curated engineering recommendations to help
 * students build evidence for skill gaps and target roles. They are not claimed
 * to be official company mandates.
 */

const PROJECT_BLUEPRINTS = [
  // ─── FULL STACK PROJECTS ─────────────────────────────────────
  {
    blueprintId: 'fullstack-job-tracker',
    title: 'Full Stack Job Application & Career Tracker',
    shortDescription:
      'A multi-user job application tracker with Kanban pipeline status, interview reminders, company metrics, and REST API integration.',
    description:
      'Build an end-to-end full stack productivity application allowing candidates to track application stages, organize interview notes, calculate response rates, and filter by tech stack.',
    category: 'Full Stack Development',
    type: 'FULL_STACK',
    difficulty: 'INTERMEDIATE',
    targetRoles: ['software-engineer', 'full-stack-developer', 'frontend-developer', 'backend-developer'],
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs'],
    optionalSkills: ['TailwindCSS', 'Docker', 'JWT Authentication', 'Git'],
    prerequisites: ['HTML5', 'CSS3', 'JavaScript'],
    estimatedEffort: '2 weeks',
    objectives: [
      'Design relational or document schemas modeling applications, stages, and contacts',
      'Implement JWT authentication with password hashing and protected API routes',
      'Build responsive interactive client with drag-and-drop or status board filtering',
    ],
    milestones: [
      {
        milestoneId: 'm1-architecture-setup',
        title: 'Project Architecture & Monorepo Setup',
        description: 'Initialize React frontend with Vite and Express backend with environment configs.',
        order: 1,
        completionCriteria: ['Configure client and server package.json', 'Set up Git repository and .gitignore'],
      },
      {
        milestoneId: 'm2-database-auth',
        title: 'Database Modeling & User Authentication',
        description: 'Design User and Application schemas; implement signup, login, and JWT middleware.',
        order: 2,
        completionCriteria: ['Password hashing with bcrypt', 'JWT token generation and verification middleware'],
      },
      {
        milestoneId: 'm3-backend-crud',
        title: 'Application CRUD REST API',
        description: 'Build REST endpoints for creating, updating, deleting, and filtering job applications.',
        order: 3,
        completionCriteria: ['Endpoints for GET, POST, PUT, DELETE /api/applications', 'Input validation and pagination'],
      },
      {
        milestoneId: 'm4-frontend-ui',
        title: 'Interactive Frontend Dashboard & Kanban Board',
        description: 'Build dashboard overview, pipeline columns, modal forms, and loading skeletons.',
        order: 4,
        completionCriteria: ['Form validation with toast notifications', 'Status filter pills and search bar'],
      },
      {
        milestoneId: 'm5-testing-deployment',
        title: 'Testing, Documentation & Live Deployment',
        description: 'Write README with architecture diagrams, deploy to cloud, and push to GitHub.',
        order: 5,
        completionCriteria: ['Deployment on Vercel/Render', 'Comprehensive README with setup instructions'],
      },
    ],
    completionCriteria: [
      'Functional frontend interacting seamlessly with backend API',
      'Secure user authentication and route guards',
      'Persistent database storage for applications and notes',
      'Published on GitHub with descriptive README and live demo link',
    ],
    evidenceExpected: 'Public GitHub repository link with clean commits and live deployed URL',
    resumeDescriptionTemplate: [
      'Architected a full-stack job application tracker utilizing React, Node.js, Express, and MongoDB with secure JWT auth.',
      'Designed RESTful API endpoints handling complex multi-field filtering, pagination, and persistent document storage.',
      'Implemented responsive client interface featuring interactive pipeline filtering and optimistic UI state updates.',
    ],
  },
  {
    blueprintId: 'fullstack-collaborative-workspace',
    title: 'Real-Time Team Task & Collaboration Workspace',
    shortDescription:
      'A real-time project management workspace with live task updates, team workspaces, activity logs, and role permissions.',
    description:
      'Develop a collaborative platform supporting workspace creation, member invitations, real-time status updates via WebSockets, and database persistence.',
    category: 'Full Stack Development',
    type: 'FULL_STACK',
    difficulty: 'ADVANCED',
    targetRoles: ['software-engineer', 'full-stack-developer', 'backend-developer'],
    requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'REST APIs'],
    optionalSkills: ['Docker', 'Redis', 'PostgreSQL', 'TailwindCSS'],
    prerequisites: ['React', 'Node.js', 'SQL'],
    estimatedEffort: '2-3 weeks',
    objectives: [
      'Implement multi-tenant workspace data models with role-based access control',
      'Integrate WebSocket or Socket.io events for live collaboration feeds',
      'Optimize database queries and indexing for team project dashboards',
    ],
    milestones: [
      {
        milestoneId: 'm1-workspace-schemas',
        title: 'Relational Database Schema Design',
        order: 1,
        description: 'Model users, organizations, workspaces, tasks, and audit logs in PostgreSQL/SQL.',
        completionCriteria: ['Normalized 3NF relational schema with foreign key constraints'],
      },
      {
        milestoneId: 'm2-api-rbac',
        title: 'Backend API & Role-Based Access Control',
        order: 2,
        description: 'Implement Admin, Member, and Viewer permissions on team resources.',
        completionCriteria: ['Middleware verifying workspace membership and roles before operations'],
      },
      {
        milestoneId: 'm3-realtime-events',
        title: 'Real-Time Event Integration',
        order: 3,
        description: 'Set up WebSocket server emitting task updates and user presence indicators.',
        completionCriteria: ['Live broadcast of task moves and comments to workspace channels'],
      },
      {
        milestoneId: 'm4-client-ui',
        title: 'Client State & TypeScript UI',
        order: 4,
        description: 'Build responsive client with TypeScript interfaces and clean state management.',
        completionCriteria: ['Strict TypeScript types across client and server API contracts'],
      },
      {
        milestoneId: 'm5-docker-deploy',
        title: 'Dockerization & CI/CD Deployment',
        order: 5,
        description: 'Containerize client, server, and database with docker-compose.',
        completionCriteria: ['Multi-container docker-compose setup and automated GitHub Actions workflow'],
      },
    ],
    completionCriteria: [
      'Multi-tenant workspace isolation with RBAC security',
      'Real-time event synchronization across active browser tabs',
      'Strict TypeScript typings and clean architectural separation',
      'Documented GitHub repository with architecture diagram',
    ],
    evidenceExpected: 'GitHub repository containing docker-compose.yml and live demo link',
    resumeDescriptionTemplate: [
      'Engineered a real-time collaborative workspace platform with TypeScript, React, Node.js, and PostgreSQL.',
      'Implemented role-based access control (RBAC) and WebSocket event streams for multi-user task updates.',
      'Containerized multi-service architecture using Docker and configured automated CI testing via GitHub Actions.',
    ],
  },
  {
    blueprintId: 'fullstack-ecommerce-admin',
    title: 'E-Commerce Platform with Catalog & Order Management',
    shortDescription:
      'E-Commerce storefront with category browsing, cart state management, checkout simulation, and admin inventory dashboard.',
    description:
      'Build a robust full-stack e-commerce application handling product catalogs, search filtering, cart persistence, transaction status, and an admin inventory management panel.',
    category: 'Full Stack Development',
    type: 'FULL_STACK',
    difficulty: 'INTERMEDIATE',
    targetRoles: ['full-stack-developer', 'frontend-developer', 'backend-developer'],
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'REST APIs'],
    optionalSkills: ['Redux', 'TailwindCSS', 'Docker'],
    prerequisites: ['JavaScript', 'React'],
    estimatedEffort: '2 weeks',
    objectives: [
      'Implement full shopping cart lifecycle with persistent local/session storage',
      'Build administrator CRUD routes for product inventory, pricing, and stock management',
      'Optimize product list querying with category filters and price range aggregations',
    ],
    milestones: [
      {
        milestoneId: 'm1-catalog-backend',
        title: 'Product Catalog API & Schema',
        order: 1,
        description: 'Create Product and Category models with pagination and search indexing.',
        completionCriteria: ['Endpoints for searching, filtering, and sorting catalog items'],
      },
      {
        milestoneId: 'm2-cart-state',
        title: 'Shopping Cart State & Redux/Context Store',
        order: 2,
        description: 'Build global cart store managing item quantities, pricing totals, and persistence.',
        completionCriteria: ['Cart accurately updates totals, shipping, and handles quantity edge cases'],
      },
      {
        milestoneId: 'm3-admin-dashboard',
        title: 'Admin Inventory & Order Management',
        order: 3,
        description: 'Protected admin panel for adding/updating products and viewing placed orders.',
        completionCriteria: ['Admin route guards verifying user permissions for product mutations'],
      },
      {
        milestoneId: 'm4-checkout-flow',
        title: 'Checkout Flow & Order Simulation',
        order: 4,
        description: 'Build multi-step checkout form with validation and order summary receipts.',
        completionCriteria: ['Order creation and stock decrementing on successful purchase'],
      },
    ],
    completionCriteria: [
      'Complete shopping experience from product exploration to simulated order placement',
      'Dedicated admin interface for managing inventory items',
      'Clean responsive layout across mobile and desktop breakpoints',
    ],
    evidenceExpected: 'Public GitHub repository with sample database seed script',
    resumeDescriptionTemplate: [
      'Developed a full-stack e-commerce platform using React, Node.js, Express, and MongoDB with global cart state.',
      'Created protected admin management dashboards for real-time inventory adjustments and order fulfillment tracking.',
      'Designed responsive UI with dynamic category filtering and optimized MongoDB search indexing.',
    ],
  },

  // ─── FRONTEND PROJECTS ────────────────────────────────────────
  {
    blueprintId: 'frontend-analytics-dashboard',
    title: 'Financial & Performance Analytics Dashboard',
    shortDescription:
      'A high-performance interactive metrics dashboard with dynamic chart visualizations, date filtering, and dark mode.',
    description:
      'Build a modern, accessible frontend analytics dashboard that consumes API data, renders interactive time-series charts, supports export to CSV, and persists user preferences.',
    category: 'Frontend Development',
    type: 'WEB',
    difficulty: 'INTERMEDIATE',
    targetRoles: ['frontend-developer', 'software-engineer', 'data-analyst'],
    requiredSkills: ['JavaScript', 'React', 'HTML5', 'CSS3', 'TailwindCSS'],
    optionalSkills: ['TypeScript', 'Next.js', 'Redux'],
    prerequisites: ['HTML5', 'CSS3', 'JavaScript'],
    estimatedEffort: '1-2 weeks',
    objectives: [
      'Implement complex multi-chart visualizations (Line, Bar, Doughnut, Area)',
      'Manage date range pickers, KPI calculation cards, and dynamic filter states',
      'Optimize re-renders using React.memo, useMemo, and useCallback',
    ],
    milestones: [
      {
        milestoneId: 'm1-dashboard-layout',
        title: 'Design System & Dashboard Shell',
        order: 1,
        description: 'Create responsive grid layout with collapsible sidebar and theme tokens.',
        completionCriteria: ['Fluid responsive layout supporting dark mode toggle'],
      },
      {
        milestoneId: 'm2-chart-components',
        title: 'Interactive Chart Visualizations',
        order: 2,
        description: 'Integrate chart libraries (Recharts or Chart.js) with custom tooltips and gradients.',
        completionCriteria: ['3+ distinct chart types dynamically updating on dataset changes'],
      },
      {
        milestoneId: 'm3-filters-metrics',
        title: 'Date Filtering & Summary Metric Tiles',
        order: 3,
        description: 'Build date range selectors, KPI metric cards, and percentage delta badges.',
        completionCriteria: ['Accurate calculation of period-over-period metric deltas'],
      },
      {
        milestoneId: 'm4-export-optimization',
        title: 'Data Export & Performance Optimization',
        order: 4,
        description: 'Add CSV export functionality and audit render performance with React DevTools.',
        completionCriteria: ['Client-side CSV generator and smooth 60fps chart animations'],
      },
    ],
    completionCriteria: [
      'Interactive chart controls and responsive metrics overview',
      'Optimized client rendering without unnecessary component re-renders',
      'Live deployment with accessible keyboard navigation',
    ],
    evidenceExpected: 'Live deployed dashboard with interactive demo data',
    resumeDescriptionTemplate: [
      'Built a responsive analytics dashboard using React, TailwindCSS, and Recharts visualizing multi-metric KPIs.',
      'Implemented customizable date range filters, dark mode theme switching, and client-side CSV reporting.',
      'Optimized component rendering performance utilizing React hooks (useMemo, useCallback) for smooth interaction.',
    ],
  },
  {
    blueprintId: 'frontend-accessible-component-library',
    title: 'Accessible UI Component Library & Design System',
    shortDescription:
      'A production-ready headless/styled UI component kit with keyboard navigation, ARIA attributes, and strict TypeScript types.',
    description:
      'Develop a reusable component library (Modals, Dropdowns, Tooltips, Tabs, Form Inputs) strictly following WAI-ARIA accessibility guidelines and packaged with documentation.',
    category: 'Frontend Development',
    type: 'WEB',
    difficulty: 'ADVANCED',
    targetRoles: ['frontend-developer', 'software-engineer'],
    requiredSkills: ['JavaScript', 'TypeScript', 'React', 'HTML5', 'CSS3', 'TailwindCSS'],
    optionalSkills: ['Storybook', 'Next.js'],
    prerequisites: ['React', 'TypeScript'],
    estimatedEffort: '1-2 weeks',
    objectives: [
      'Implement WAI-ARIA compliant keyboard focus traps, escape handling, and screen reader announcements',
      'Provide fully typed TypeScript component props and polymorphic ref forwarding',
      'Publish interactive component documentation and usage examples',
    ],
    milestones: [
      {
        milestoneId: 'm1-primitive-components',
        title: 'Form & Action Primitives',
        order: 1,
        description: 'Build Button, Input, Checkbox, and Select with validation states.',
        completionCriteria: ['Full keyboard accessibility and focus ring styling'],
      },
      {
        milestoneId: 'm2-complex-overlays',
        title: 'Modal, Dialog & Dropdown Overlays',
        order: 2,
        description: 'Implement focus trap, backdrop click dismissal, and escape key listener.',
        completionCriteria: ['Accessible modal dialog with focus restoration upon close'],
      },
      {
        milestoneId: 'm3-navigation-tabs',
        title: 'Tabs, Accordions & Tooltips',
        order: 3,
        description: 'Create roving tabindex navigation across tab lists and accordion panels.',
        completionCriteria: ['Arrow-key navigation adhering strictly to ARIA tab patterns'],
      },
      {
        milestoneId: 'm4-docs-packaging',
        title: 'Documentation & Demo Showcase',
        order: 4,
        description: 'Build interactive documentation showcase with copyable code snippets.',
        completionCriteria: ['Live showcase documentation site with TypeScript code blocks'],
      },
    ],
    completionCriteria: [
      '100% keyboard accessible components with 0 accessibility violations',
      'Strict TypeScript prop interfaces with generics where appropriate',
      'Interactive documentation showcase deployed online',
    ],
    evidenceExpected: 'GitHub repository with live interactive component playground',
    resumeDescriptionTemplate: [
      'Authored an accessible React/TypeScript component library strictly adhering to WAI-ARIA standards.',
      'Implemented focus management, keyboard navigation (roving tabindex), and screen-reader announcements.',
      'Engineered reusable polymorphic components with strict TypeScript types and comprehensive documentation.',
    ],
  },

  // ─── BACKEND PROJECTS ─────────────────────────────────────────
  {
    blueprintId: 'backend-auth-rbac-service',
    title: 'High-Security Authentication & RBAC Microservice',
    shortDescription:
      'A standalone auth service with JWT access/refresh tokens, role permissions, rate limiting, and password reset flows.',
    description:
      'Build an enterprise-grade backend authentication and authorization service featuring bcrypt hashing, short-lived JWTs with sliding refresh tokens, brute-force rate limiting, and email verification.',
    category: 'Backend & Systems',
    type: 'BACKEND',
    difficulty: 'INTERMEDIATE',
    targetRoles: ['backend-developer', 'software-engineer', 'cybersecurity-engineer'],
    requiredSkills: ['JavaScript', 'Node.js', 'Express.js', 'SQL', 'REST APIs'],
    optionalSkills: ['PostgreSQL', 'Redis', 'Docker', 'Linux'],
    prerequisites: ['Node.js', 'REST APIs'],
    estimatedEffort: '1-2 weeks',
    objectives: [
      'Implement dual-token authentication (JWT access token + secure httpOnly refresh token)',
      'Prevent credential stuffing and brute-force attacks using Redis-backed rate limiting',
      'Design role-based and permission-based authorization middleware',
    ],
    milestones: [
      {
        milestoneId: 'm1-token-architecture',
        title: 'Token Generation & Hashing Layer',
        order: 1,
        description: 'Configure bcrypt password hashing and asymmetric/symmetric JWT signing.',
        completionCriteria: ['Safe password hashing and token generation with expiration'],
      },
      {
        milestoneId: 'm2-refresh-rotation',
        title: 'Refresh Token Rotation & Revocation',
        order: 2,
        description: 'Store hashed refresh tokens with automatic reuse detection and revocation.',
        completionCriteria: ['Secure token refresh endpoint issuing new access token pairs'],
      },
      {
        milestoneId: 'm3-rate-limiting-security',
        title: 'Rate Limiting & Security Headers',
        order: 3,
        description: 'Add IP-based rate limiting, Helmet HTTP headers, and CORS security.',
        completionCriteria: ['Express rate-limiter blocking repeated failed attempts'],
      },
      {
        milestoneId: 'm4-postman-tests',
        title: 'Integration Tests & API Documentation',
        order: 4,
        description: 'Write automated integration tests and export comprehensive Postman collection.',
        completionCriteria: ['Automated test suite verifying successful and unauthorized request flows'],
      },
    ],
    completionCriteria: [
      'Stateless JWT authentication with secure refresh token rotation',
      'RBAC middleware restricting endpoints based on user permissions',
      'Integration test suite verifying auth flows and attack rejection',
    ],
    evidenceExpected: 'GitHub repository with Postman collection and integration test suite',
    resumeDescriptionTemplate: [
      'Developed an authentication microservice with Node.js, Express, and PostgreSQL featuring JWT token rotation.',
      'Implemented rate limiting, CORS protection, and secure httpOnly cookie session handling to prevent attacks.',
      'Created modular role-based authorization middleware and automated test suites verifying security compliance.',
    ],
  },
  {
    blueprintId: 'backend-distributed-caching-api',
    title: 'Scalable REST API with Redis In-Memory Caching',
    shortDescription:
      'High-throughput backend API utilizing Redis cache-aside patterns, database connection pooling, and stress testing.',
    description:
      'Engineer a performant backend data service that implements Redis caching for high-frequency queries, invalidates cache on mutations, manages PostgreSQL connection pools, and benchmarks response times.',
    category: 'Backend & Systems',
    type: 'BACKEND',
    difficulty: 'ADVANCED',
    targetRoles: ['backend-developer', 'software-engineer', 'devops-engineer'],
    requiredSkills: ['JavaScript', 'Node.js', 'Express.js', 'SQL', 'REST APIs'],
    optionalSkills: ['Redis', 'PostgreSQL', 'Docker', 'Linux'],
    prerequisites: ['Node.js', 'SQL'],
    estimatedEffort: '1-2 weeks',
    objectives: [
      'Implement the Cache-Aside pattern with TTL expiration and dynamic key generation',
      'Perform database connection pooling and query optimization using indexes',
      'Benchmark API latency before and after caching using load-testing tools (Autocannon/k6)',
    ],
    milestones: [
      {
        milestoneId: 'm1-relational-api',
        title: 'Relational Database API & Seeding',
        order: 1,
        description: 'Design database schema with 50,000+ mock records to benchmark realistic query loads.',
        completionCriteria: ['Database migration script and realistic mock data seed generator'],
      },
      {
        milestoneId: 'm2-redis-caching',
        title: 'Redis Caching & Invalidation Layer',
        order: 2,
        description: 'Wrap query endpoints with Redis caching middleware and write invalidation hooks.',
        completionCriteria: ['Cache hit/miss headers and automated cache clearing on entity updates'],
      },
      {
        milestoneId: 'm3-load-benchmarking',
        title: 'Load Testing & Performance Benchmarks',
        order: 3,
        description: 'Benchmark request throughput (req/sec) and p95 latency under high concurrency.',
        completionCriteria: ['Documented benchmark report comparing cold DB queries vs cached responses'],
      },
    ],
    completionCriteria: [
      'Working Cache-Aside caching layer with automated invalidation',
      'Documented latency reduction metrics in repository README',
      'Docker container setup running Node, Redis, and PostgreSQL',
    ],
    evidenceExpected: 'GitHub repository with benchmark graphs and docker-compose configuration',
    resumeDescriptionTemplate: [
      'Engineered a high-throughput backend API utilizing Node.js, PostgreSQL, and Redis in-memory caching.',
      'Implemented Cache-Aside pattern with automated TTL invalidation, reducing database load during peak queries.',
      'Conducted load testing with k6, benchmarking p95 response latencies across concurrent client connections.',
    ],
  },

  // ─── DATA & AI/ML PROJECTS ────────────────────────────────────
  {
    blueprintId: 'data-customer-churn-pipeline',
    title: 'Customer Churn Predictive Analytics & Pipeline',
    shortDescription:
      'End-to-end data pipeline processing customer demographics, exploratory feature analysis, and ML churn prediction.',
    description:
      'Build an end-to-end predictive analytics pipeline that ingests customer subscription data, performs statistical exploratory analysis, trains machine learning models to predict churn risk, and visualizes feature importance.',
    category: 'Data & Machine Learning',
    type: 'DATA',
    difficulty: 'INTERMEDIATE',
    targetRoles: ['data-scientist', 'data-analyst', 'ml-engineer', 'software-engineer'],
    requiredSkills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Machine Learning', 'Scikit-learn'],
    optionalSkills: ['Tableau', 'Git', 'Deep Learning'],
    prerequisites: ['Python', 'SQL'],
    estimatedEffort: '2 weeks',
    objectives: [
      'Clean tabular data, handle categorical encodings, and perform correlation analysis',
      'Train and evaluate multiple classification algorithms (Logistic Regression, Random Forest, XGBoost)',
      'Interpret model decision thresholds using precision-recall curves and feature importance',
    ],
    milestones: [
      {
        milestoneId: 'm1-eda-wrangling',
        title: 'Exploratory Data Analysis & Feature Cleaning',
        order: 1,
        description: 'Analyze distributions, handle outliers, and compute statistical correlations.',
        completionCriteria: ['Documented Jupyter notebook with visualizations of churn distribution'],
      },
      {
        milestoneId: 'm2-feature-engineering',
        title: 'Feature Engineering & Preprocessing Pipeline',
        order: 2,
        description: 'Construct Scikit-learn Pipeline with StandardScaler and OneHotEncoder.',
        completionCriteria: ['Reusable preprocessing pipeline preventing data leakage during cross-validation'],
      },
      {
        milestoneId: 'm3-model-training',
        title: 'Model Training, Tuning & Evaluation',
        order: 3,
        description: 'Train baseline models, tune hyperparameters with GridSearchCV, and evaluate ROC-AUC.',
        completionCriteria: ['Model comparison table with accuracy, precision, recall, and ROC-AUC metrics'],
      },
      {
        milestoneId: 'm4-insights-presentation',
        title: 'Executive Insights & Feature Importance',
        order: 4,
        description: 'Extract top churn indicators and formulate business recommendation summary.',
        completionCriteria: ['Executive summary report outlining high-risk customer segments'],
      },
    ],
    completionCriteria: [
      'Complete modular Jupyter notebook / Python scripts with clean code comments',
      'Documented model performance metrics and confusion matrix evaluation',
      'Actionable business recommendations derived from statistical findings',
    ],
    evidenceExpected: 'GitHub repository with Jupyter notebook and executive summary README',
    resumeDescriptionTemplate: [
      'Developed a customer churn prediction pipeline using Python, Pandas, and Scikit-learn on subscription data.',
      'Engineered preprocessing pipelines with cross-validation, training Random Forest and Gradient Boosting models.',
      'Identified key churn risk drivers through feature importance analysis, presenting actionable retention strategies.',
    ],
  },
  {
    blueprintId: 'ml-deep-learning-image-classifier',
    title: 'Deep Learning Visual Classification & Inference API',
    shortDescription:
      'Convolutional Neural Network (CNN) trained with PyTorch, packaged into a REST prediction microservice with Docker.',
    description:
      'Train a Convolutional Neural Network on an image dataset using PyTorch with data augmentation, evaluate accuracy and loss curves, and serve model inference via a lightweight FastAPI container.',
    category: 'Data & Machine Learning',
    type: 'MACHINE_LEARNING',
    difficulty: 'ADVANCED',
    targetRoles: ['data-scientist', 'ml-engineer'],
    requiredSkills: ['Python', 'Deep Learning', 'PyTorch', 'Machine Learning', 'Docker'],
    optionalSkills: ['TensorFlow', 'REST APIs', 'FastAPI', 'AWS'],
    prerequisites: ['Python', 'Machine Learning'],
    estimatedEffort: '2-3 weeks',
    objectives: [
      'Implement custom PyTorch Dataset, DataLoader, and data augmentation transformations',
      'Train a neural network with backpropagation, learning rate schedulers, and early stopping',
      'Wrap saved model weights in a lightweight REST inference API with Docker',
    ],
    milestones: [
      {
        milestoneId: 'm1-dataset-augmentation',
        title: 'Dataset Pipeline & Augmentation',
        order: 1,
        description: 'Build PyTorch DataLoader with random rotations, crops, and normalization.',
        completionCriteria: ['Data loading pipeline with training, validation, and test splits'],
      },
      {
        milestoneId: 'm2-cnn-training',
        title: 'Neural Network Architecture & Training Loop',
        order: 2,
        description: 'Write training and evaluation loops tracking loss and validation accuracy per epoch.',
        completionCriteria: ['Trained model achieving target validation accuracy with saved weights (.pth)'],
      },
      {
        milestoneId: 'm3-inference-api',
        title: 'FastAPI Prediction Endpoint & Container',
        order: 3,
        description: 'Build endpoint accepting image upload and returning top-3 predicted classes with confidence.',
        completionCriteria: ['FastAPI prediction endpoint running inside an isolated Docker container'],
      },
    ],
    completionCriteria: [
      'Trained PyTorch model with documented training loss / accuracy curves',
      'Containerized REST API serving live image classification predictions',
      'GitHub repository with instructions to run inference locally',
    ],
    evidenceExpected: 'GitHub repository with model weights instructions, FastAPI server, and Dockerfile',
    resumeDescriptionTemplate: [
      'Architected and trained a Convolutional Neural Network (CNN) in PyTorch for multi-class visual recognition.',
      'Implemented data augmentation pipelines, learning rate scheduling, and cross-entropy optimization.',
      'Deployed trained model weights into a containerized FastAPI microservice for low-latency image inference.',
    ],
  },

  // ─── DEVOPS & CLOUD PROJECTS ──────────────────────────────────
  {
    blueprintId: 'devops-multi-container-cicd',
    title: 'Automated Multi-Service CI/CD & Deployment Pipeline',
    shortDescription:
      'Dockerized multi-tier web application with automated GitHub Actions CI/CD, Nginx reverse proxy, and health checks.',
    description:
      'Create an automated DevOps workflow featuring multi-stage Docker builds for frontend and backend services, automated pull-request testing via GitHub Actions, and an Nginx reverse proxy configuration.',
    category: 'Cloud & DevOps',
    type: 'DEVOPS',
    difficulty: 'INTERMEDIATE',
    targetRoles: ['devops-engineer', 'software-engineer', 'backend-developer'],
    requiredSkills: ['Linux', 'Docker', 'Git', 'CI/CD'],
    optionalSkills: ['AWS', 'Nginx', 'Kubernetes', 'Python'],
    prerequisites: ['Linux', 'Git'],
    estimatedEffort: '1-2 weeks',
    objectives: [
      'Write optimized multi-stage Dockerfiles reducing production image footprints',
      'Configure GitHub Actions workflows to run unit tests and build checks on pull requests',
      'Set up Nginx reverse proxy routing client requests and serving static assets with caching',
    ],
    milestones: [
      {
        milestoneId: 'm1-dockerfile-optimization',
        title: 'Multi-Stage Dockerfile Engineering',
        order: 1,
        description: 'Create multi-stage builds for frontend React and backend Node services.',
        completionCriteria: ['Production Docker images under 150MB with non-root security execution'],
      },
      {
        milestoneId: 'm2-docker-compose-orchestration',
        title: 'Multi-Container Orchestration',
        order: 2,
        description: 'Orchestrate client, server, database, and Nginx with docker-compose.yml.',
        completionCriteria: ['Single-command setup (docker-compose up) booting entire environment with health checks'],
      },
      {
        milestoneId: 'm3-github-actions-pipeline',
        title: 'Continuous Integration Pipeline',
        order: 3,
        description: 'Write GitHub Actions workflow running linters, tests, and building Docker images on PRs.',
        completionCriteria: ['Automated green checks on pull requests verifying build integrity'],
      },
    ],
    completionCriteria: [
      'Automated GitHub Actions workflow executing on repository events',
      'Multi-container docker-compose setup with isolated network bridging',
      'Documented architecture diagram in repository README',
    ],
    evidenceExpected: 'GitHub repository with .github/workflows directory and docker-compose.yml',
    resumeDescriptionTemplate: [
      'Engineered an automated CI/CD pipeline using GitHub Actions and multi-stage Docker container builds.',
      'Configured multi-container orchestration with docker-compose and Nginx reverse proxy load balancing.',
      'Implemented automated pull-request validation suites ensuring 100% build integrity prior to deployment.',
    ],
  },

  // ─── CYBERSECURITY PROJECTS ───────────────────────────────────
  {
    blueprintId: 'cybersecurity-secure-file-vault',
    title: 'Zero-Knowledge Encrypted File Vault & Access Monitor',
    shortDescription:
      'Secure document storage system with client/server AES-256 encryption, access audit logging, and integrity checks.',
    description:
      'Build a secure file management application implementing AES-256 encryption for files at rest, HMAC integrity verification, immutable audit logging for file access events, and strict session timeouts.',
    category: 'Security & Infrastructure',
    type: 'CYBERSECURITY',
    difficulty: 'ADVANCED',
    targetRoles: ['cybersecurity-engineer', 'software-engineer', 'backend-developer'],
    requiredSkills: ['Linux', 'Python', 'SQL', 'Git'],
    optionalSkills: ['Docker', 'AWS', 'REST APIs'],
    prerequisites: ['Python', 'Linux'],
    estimatedEffort: '2 weeks',
    objectives: [
      'Implement cryptographic file encryption (AES-GCM) with secure key derivation (PBKDF2/Argon2)',
      'Design tamper-evident database audit logs recording all upload, access, and download events',
      'Sanitize all file uploads against path traversal, malicious extensions, and MIME spoofing',
    ],
    milestones: [
      {
        milestoneId: 'm1-crypto-engine',
        title: 'Cryptographic Engine & Key Derivation',
        order: 1,
        description: 'Implement encryption/decryption functions with salt and initialization vectors (IV).',
        completionCriteria: ['AES-256-GCM file encryption verified with test decryption routines'],
      },
      {
        milestoneId: 'm2-upload-sanitization',
        title: 'File Sanitization & Validation Layer',
        order: 2,
        description: 'Inspect magic bytes and sanitize filenames to prevent path traversal vulnerabilities.',
        completionCriteria: ['Validation layer rejecting disguised file types and directory traversal paths'],
      },
      {
        milestoneId: 'm3-audit-logging',
        title: 'Immutable Audit Trail & Monitoring',
        order: 3,
        description: 'Record timestamped user access events with IP hashes and action types.',
        completionCriteria: ['Audit table logging all file read/write operations with tamper detection'],
      },
    ],
    completionCriteria: [
      'End-to-end encrypted file storage with zero plaintext stored on disk',
      'Comprehensive security controls against common OWASP vulnerabilities',
      'Security architecture documentation in repository README',
    ],
    evidenceExpected: 'GitHub repository with security documentation and test suite verifying encryption',
    resumeDescriptionTemplate: [
      'Developed a secure file storage platform implementing AES-256-GCM encryption and PBKDF2 key derivation.',
      'Implemented input sanitization and magic-byte inspection protecting against file upload vulnerabilities.',
      'Created an immutable audit logging subsystem tracking access events and security compliance metrics.',
    ],
  },
];

module.exports = {
  PROJECT_BLUEPRINTS,
};
