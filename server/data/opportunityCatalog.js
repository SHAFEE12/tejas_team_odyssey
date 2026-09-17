/**
 * opportunityCatalog.js — Catalog v1.0
 *
 * ============================================================
 * DEMO DATA DISCLAIMER
 * ============================================================
 * These are CURATED DEMO records for educational and portfolio
 * demonstration purposes ONLY.
 *
 * - These are NOT currently open real job listings.
 * - Company names used are illustrative stand-ins.
 * - Salaries/stipends are market-representative estimates only.
 * - Do NOT apply to these roles using this data.
 * ============================================================
 *
 * Source: Manually curated, version-controlled catalog.
 * To update: increment CATALOG_VERSION and add/modify entries.
 */

const CATALOG_VERSION = '1.0';

const OPPORTUNITY_CATALOG = [
  // ── SOFTWARE ENGINEERING ────────────────────────────────────

  {
    type: 'internship',
    domain: 'software-engineering',
    title: 'Software Engineering Intern',
    company: 'NovaByte Technologies',
    location: 'Bengaluru, India',
    remote: false,
    stipend: '₹25,000/month',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'Git'],
    preferredSkills: ['TypeScript', 'MongoDB', 'Docker'],
    description: 'Join our product engineering team to build scalable web applications. You will work on real features shipped to production.',
    responsibilities: [
      'Build and maintain React-based frontend components',
      'Develop RESTful APIs using Node.js and Express',
      'Write unit tests and participate in code reviews',
      'Collaborate with designers and product managers',
    ],
    qualifications: [
      'Currently pursuing B.Tech/B.E. in CS or related field',
      'Strong understanding of JavaScript fundamentals',
      'Familiarity with Git version control',
    ],
    duration: '3 months',
    openings: 3,
    tags: ['web', 'frontend', 'nodejs', 'react'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  {
    type: 'full-time',
    domain: 'backend',
    title: 'Backend Engineer',
    company: 'Stackly Systems',
    location: 'Hyderabad, India',
    remote: true,
    stipend: '₹8,00,000–₹12,00,000 LPA',
    requiredSkills: ['Node.js', 'MongoDB', 'REST API', 'Git'],
    preferredSkills: ['Redis', 'Docker', 'AWS', 'Microservices'],
    description: 'We are looking for a Backend Engineer to join our platform team. You will design and build APIs powering our SaaS product.',
    responsibilities: [
      'Design, develop, and maintain backend microservices',
      'Optimize database queries and ensure data integrity',
      'Implement authentication, authorization, and security best practices',
      'Mentor junior developers and participate in architecture decisions',
    ],
    qualifications: [
      '1–3 years of professional backend development experience',
      'Strong knowledge of Node.js and asynchronous programming',
      'Experience with NoSQL databases (MongoDB preferred)',
    ],
    duration: 'Permanent',
    openings: 2,
    tags: ['backend', 'api', 'nodejs', 'mongodb'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  {
    type: 'internship',
    domain: 'fullstack',
    title: 'Full Stack Developer Intern',
    company: 'Orbitlabs Inc.',
    location: 'Remote',
    remote: true,
    stipend: '₹20,000/month',
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'CSS'],
    preferredSkills: ['Redux', 'GraphQL', 'AWS'],
    description: 'A remote-first internship where you will contribute to our SaaS dashboard product, gaining hands-on full-stack experience.',
    responsibilities: [
      'Build full-stack features from design to deployment',
      'Integrate third-party APIs and services',
      'Write clean, documented, and tested code',
      'Participate in daily standups and sprint planning',
    ],
    qualifications: [
      'Solid understanding of React and Node.js',
      'Experience building REST APIs',
      'Ability to work independently in a remote environment',
    ],
    duration: '6 months',
    openings: 2,
    tags: ['fullstack', 'remote', 'react', 'nodejs'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  // ── DATA SCIENCE ────────────────────────────────────────────

  {
    type: 'internship',
    domain: 'data-science',
    title: 'Data Science Intern',
    company: 'Quantify Analytics',
    location: 'Pune, India',
    remote: false,
    stipend: '₹18,000/month',
    requiredSkills: ['Python', 'Pandas', 'NumPy', 'SQL'],
    preferredSkills: ['Scikit-learn', 'Tableau', 'Jupyter', 'Matplotlib'],
    description: 'Work with our data team to extract insights from large datasets and build predictive models for our retail analytics clients.',
    responsibilities: [
      'Clean, transform, and analyze structured and unstructured data',
      'Build and evaluate machine learning models',
      'Create dashboards and visualizations for stakeholders',
      'Document analysis processes and results',
    ],
    qualifications: [
      'Pursuing B.Tech/M.Sc. in CS, Statistics, or related field',
      'Proficient in Python for data analysis',
      'Understanding of basic statistical concepts',
    ],
    duration: '3 months',
    openings: 2,
    tags: ['data', 'python', 'ml', 'analytics'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  {
    type: 'full-time',
    domain: 'data-science',
    title: 'Data Analyst',
    company: 'InsightEdge Corp.',
    location: 'Bengaluru, India',
    remote: false,
    stipend: '₹6,00,000–₹9,00,000 LPA',
    requiredSkills: ['SQL', 'Python', 'Excel', 'Data Visualization'],
    preferredSkills: ['Power BI', 'Tableau', 'Pandas', 'R'],
    description: 'Join our business intelligence team to translate data into actionable insights that drive product and business decisions.',
    responsibilities: [
      'Develop and maintain reporting dashboards',
      'Write complex SQL queries for ad-hoc analysis',
      'Present findings to business stakeholders',
      'Identify trends, anomalies, and growth opportunities',
    ],
    qualifications: [
      'Degree in CS, Statistics, Economics, or related field',
      'Strong SQL skills with experience in large datasets',
      'Excellent communication and presentation skills',
    ],
    duration: 'Permanent',
    openings: 1,
    tags: ['data', 'sql', 'analytics', 'bi'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  // ── MACHINE LEARNING ────────────────────────────────────────

  {
    type: 'internship',
    domain: 'machine-learning',
    title: 'Machine Learning Intern',
    company: 'DeepRoot AI',
    location: 'Bengaluru, India',
    remote: true,
    stipend: '₹30,000/month',
    requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'NumPy'],
    preferredSkills: ['PyTorch', 'OpenCV', 'Scikit-learn', 'MLflow'],
    description: 'Research and develop ML models for computer vision applications. Work alongside PhD researchers and senior engineers.',
    responsibilities: [
      'Train and evaluate deep learning models',
      'Preprocess and augment training datasets',
      'Implement model serving pipelines',
      'Read and implement ideas from recent ML papers',
    ],
    qualifications: [
      'Strong foundation in linear algebra, probability, and calculus',
      'Hands-on experience with TensorFlow or PyTorch',
      'Familiarity with Convolutional Neural Networks',
    ],
    duration: '6 months',
    openings: 2,
    tags: ['ml', 'deep-learning', 'cv', 'python'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  // ── DEVOPS / CLOUD ──────────────────────────────────────────

  {
    type: 'internship',
    domain: 'devops',
    title: 'DevOps Intern',
    company: 'CloudNest Solutions',
    location: 'Chennai, India',
    remote: false,
    stipend: '₹15,000/month',
    requiredSkills: ['Linux', 'Docker', 'Git', 'Bash'],
    preferredSkills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'],
    description: 'Learn and contribute to our cloud infrastructure team. Gain hands-on experience with containerization and CI/CD pipelines.',
    responsibilities: [
      'Maintain and monitor containerized services on Kubernetes',
      'Build and optimize CI/CD pipelines using GitHub Actions',
      'Write Infrastructure as Code using Terraform',
      'Assist with incident response and system monitoring',
    ],
    qualifications: [
      'Familiarity with Linux command line',
      'Understanding of Docker and containerization concepts',
      'Interest in cloud platforms (AWS/GCP/Azure)',
    ],
    duration: '3 months',
    openings: 2,
    tags: ['devops', 'cloud', 'docker', 'kubernetes'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  {
    type: 'full-time',
    domain: 'cloud',
    title: 'Cloud Infrastructure Engineer',
    company: 'AetherScale',
    location: 'Noida, India',
    remote: true,
    stipend: '₹10,00,000–₹15,00,000 LPA',
    requiredSkills: ['AWS', 'Terraform', 'Docker', 'Kubernetes'],
    preferredSkills: ['Python', 'Ansible', 'Prometheus', 'Grafana'],
    description: 'Design, build, and maintain our cloud-native infrastructure serving millions of requests per day.',
    responsibilities: [
      'Architect and manage AWS infrastructure at scale',
      'Implement IaC using Terraform and CloudFormation',
      'Monitor system health and respond to production incidents',
      'Champion cloud security and cost optimization',
    ],
    qualifications: [
      '2+ years of cloud engineering experience',
      'AWS Certified Solutions Architect (preferred)',
      'Strong scripting skills (Python or Bash)',
    ],
    duration: 'Permanent',
    openings: 1,
    tags: ['cloud', 'aws', 'devops', 'infrastructure'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  // ── FRONTEND ────────────────────────────────────────────────

  {
    type: 'internship',
    domain: 'frontend',
    title: 'Frontend Developer Intern',
    company: 'Pixel Labs',
    location: 'Mumbai, India',
    remote: false,
    stipend: '₹18,000/month',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
    preferredSkills: ['TypeScript', 'TailwindCSS', 'Figma', 'Storybook'],
    description: 'Build beautiful, accessible UI components for our design system used across multiple products.',
    responsibilities: [
      'Implement responsive UI components using React',
      'Collaborate with designers using Figma',
      'Ensure accessibility (WCAG 2.1 compliance)',
      'Write unit tests for components using Jest and Testing Library',
    ],
    qualifications: [
      'Strong HTML/CSS fundamentals',
      'Proficiency in JavaScript (ES6+)',
      'Experience with React and component-based architecture',
    ],
    duration: '3 months',
    openings: 3,
    tags: ['frontend', 'react', 'ui', 'css'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  // ── CYBERSECURITY ───────────────────────────────────────────

  {
    type: 'internship',
    domain: 'cybersecurity',
    title: 'Security Engineering Intern',
    company: 'ShieldPoint Security',
    location: 'Delhi, India',
    remote: false,
    stipend: '₹20,000/month',
    requiredSkills: ['Networking', 'Linux', 'Python', 'Security Fundamentals'],
    preferredSkills: ['Kali Linux', 'Burp Suite', 'OWASP', 'SIEM tools'],
    description: 'Join our red team to perform security assessments, penetration testing, and vulnerability analysis on client systems.',
    responsibilities: [
      'Conduct vulnerability assessments and penetration tests',
      'Write detailed security reports with remediation guidance',
      'Monitor security alerts using SIEM platforms',
      'Research emerging threats and CVEs',
    ],
    qualifications: [
      'Understanding of networking protocols (TCP/IP, DNS, HTTP)',
      'Familiarity with Linux security tools',
      'Knowledge of OWASP Top 10',
    ],
    duration: '6 months',
    openings: 1,
    tags: ['security', 'pentesting', 'linux', 'networking'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  // ── PRODUCT MANAGEMENT ──────────────────────────────────────

  {
    type: 'internship',
    domain: 'product-management',
    title: 'Product Management Intern',
    company: 'LaunchPad Ventures',
    location: 'Bengaluru, India',
    remote: true,
    stipend: '₹20,000/month',
    requiredSkills: ['Product Thinking', 'Agile', 'Communication', 'SQL'],
    preferredSkills: ['Figma', 'JIRA', 'A/B Testing', 'Data Analysis'],
    description: 'Work directly with senior PMs to define product strategy, write PRDs, and drive cross-functional execution.',
    responsibilities: [
      'Conduct user research and competitive analysis',
      'Write detailed Product Requirements Documents (PRDs)',
      'Define success metrics and track product KPIs',
      'Collaborate with engineering and design teams on delivery',
    ],
    qualifications: [
      'Strong analytical and communication skills',
      'Ability to work with cross-functional teams',
      'Basic understanding of agile development processes',
    ],
    duration: '3 months',
    openings: 2,
    tags: ['pm', 'product', 'agile', 'startup'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  // ── MOBILE ──────────────────────────────────────────────────

  {
    type: 'internship',
    domain: 'mobile',
    title: 'Mobile App Developer Intern',
    company: 'AppWave Studio',
    location: 'Pune, India',
    remote: false,
    stipend: '₹22,000/month',
    requiredSkills: ['React Native', 'JavaScript', 'Git', 'REST API'],
    preferredSkills: ['Flutter', 'TypeScript', 'Firebase', 'Redux'],
    description: 'Build cross-platform mobile applications using React Native, shipping features to iOS and Android users worldwide.',
    responsibilities: [
      'Develop and maintain React Native applications',
      'Integrate RESTful APIs and Firebase services',
      'Optimize app performance and battery consumption',
      'Write tests using Jest and Detox',
    ],
    qualifications: [
      'Proficiency in JavaScript and React',
      'Experience with React Native or Flutter',
      'Understanding of mobile UI/UX patterns',
    ],
    duration: '3 months',
    openings: 2,
    tags: ['mobile', 'react-native', 'ios', 'android'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },

  // ── RESEARCH ────────────────────────────────────────────────

  {
    type: 'internship',
    domain: 'research',
    title: 'Research Intern — NLP',
    company: 'Linguify Research Labs',
    location: 'Remote',
    remote: true,
    stipend: '₹25,000/month',
    requiredSkills: ['Python', 'Machine Learning', 'NLP', 'PyTorch'],
    preferredSkills: ['Hugging Face', 'Transformers', 'BERT', 'LLMs'],
    description: 'Conduct research on natural language understanding tasks. Publish results and contribute to open-source NLP toolkits.',
    responsibilities: [
      'Implement and fine-tune transformer models',
      'Design and run experiments on NLP benchmarks',
      'Analyze and document research findings',
      'Co-author technical reports or papers',
    ],
    qualifications: [
      'Strong Python and PyTorch skills',
      'Familiarity with NLP fundamentals (tokenization, embeddings, transformers)',
      'Ability to read and interpret ML research papers',
    ],
    duration: '6 months',
    openings: 1,
    tags: ['nlp', 'research', 'transformers', 'python'],
    isDemo: true,
    catalogVersion: CATALOG_VERSION,
  },
];

module.exports = { OPPORTUNITY_CATALOG, CATALOG_VERSION };
