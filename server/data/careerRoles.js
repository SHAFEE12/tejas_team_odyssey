/**
 * careerRoles.js
 *
 * Centralized, versioned CURATED BASELINE role requirement dataset.
 *
 * NOTE: These requirements represent curated engineering baselines for student
 * career benchmarking and are not presented as official industry mandates.
 */

const CAREER_ROLES = [
  {
    roleId: 'software-engineer',
    displayName: 'Software Engineer',
    category: 'Software Engineering',
    description: 'Core software engineering focusing on scalable architecture, data structures, algorithms, and full lifecycle development.',
    foundationalSkills: ['Data Structures & Algorithms', 'Git', 'Computer Science Fundamentals'],
    requiredSkills: [
      {
        name: 'Data Structures & Algorithms',
        category: 'Computer Science',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Essential for technical assessments, problem solving, and efficient system design.',
        recommendation: 'Practice arrays, trees, dynamic programming, and graphs on LeetCode/DSA tracker.',
      },
      {
        name: 'JavaScript',
        category: 'Programming Languages',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Primary language for modern web and full-stack software development.',
        recommendation: 'Master ES6+, asynchronous programming, closures, and modern event loop mechanics.',
      },
      {
        name: 'Python',
        category: 'Programming Languages',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Widely used for scripting, backend services, automation, and data processing.',
        recommendation: 'Build modular applications utilizing standard libraries, OOP concepts, and virtual environments.',
      },
      {
        name: 'SQL',
        category: 'Databases',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Required for relational data modeling, query optimization, and persistent storage.',
        recommendation: 'Write complex JOINs, subqueries, aggregations, and understand indexing strategies.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Standard version control for team collaboration, branching, and pull requests.',
        recommendation: 'Publish version-controlled repositories to GitHub with clean commit histories.',
      },
      {
        name: 'REST APIs',
        category: 'Backend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Core architecture for client-server communication and microservices integration.',
        recommendation: 'Design and implement stateless endpoints with proper HTTP methods, status codes, and auth.',
      },
    ],
    preferredSkills: [
      {
        name: 'Docker',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Containerization standard for consistent local development and deployment.',
        recommendation: 'Containerize an existing web application using Dockerfile and docker-compose.',
      },
      {
        name: 'Linux',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Standard deployment and server operating system environment.',
        recommendation: 'Familiarize with bash command-line utilities, file permissions, and process monitoring.',
      },
      {
        name: 'TypeScript',
        category: 'Programming Languages',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Type-safe programming increasingly standard in enterprise codebases.',
        recommendation: 'Convert a JavaScript application or build a TypeScript project with strict typing.',
      },
      {
        name: 'CI/CD',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Automated testing and continuous delivery workflows.',
        recommendation: 'Set up GitHub Actions to run automated tests and build checks on pull requests.',
      },
    ],
  },
  {
    roleId: 'frontend-developer',
    displayName: 'Frontend Developer',
    category: 'Web Development',
    description: 'Specializes in user interfaces, client-side state management, accessibility, and interactive web experiences.',
    foundationalSkills: ['HTML5', 'CSS3', 'JavaScript'],
    requiredSkills: [
      {
        name: 'JavaScript',
        category: 'Programming Languages',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'The fundamental programming language of the modern web browser.',
        recommendation: 'Deep dive into DOM manipulation, event delegation, Promises, and async/await.',
      },
      {
        name: 'React',
        category: 'Frontend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Industry-standard component-based library for scalable interactive user interfaces.',
        recommendation: 'Build applications utilizing custom hooks, context state management, and optimized rendering.',
      },
      {
        name: 'HTML5',
        category: 'Frontend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Semantic markup structure essential for accessibility, SEO, and web standards.',
        recommendation: 'Implement semantic HTML elements, ARIA attributes, and accessible forms.',
      },
      {
        name: 'CSS3',
        category: 'Frontend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Styling, responsive design, animations, and modern layout systems.',
        recommendation: 'Master Flexbox, CSS Grid, media queries, and fluid typography.',
      },
      {
        name: 'TailwindCSS',
        category: 'Frontend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Popular utility-first CSS framework for rapid and consistent UI development.',
        recommendation: 'Build responsive design system components with Tailwind utility classes.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Version control for source code tracking and team collaboration.',
        recommendation: 'Manage code revisions and feature branches on GitHub.',
      },
    ],
    preferredSkills: [
      {
        name: 'TypeScript',
        category: 'Programming Languages',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Enhances frontend codebase maintainability with static types.',
        recommendation: 'Type React props, state hooks, and API responses using TypeScript interfaces.',
      },
      {
        name: 'Next.js',
        category: 'Frontend',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Production React framework for server-side rendering, routing, and optimization.',
        recommendation: 'Build a full-featured SSR or SSG web app with Next.js App Router.',
      },
      {
        name: 'Redux',
        category: 'Frontend',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Predictable global state container for large-scale applications.',
        recommendation: 'Understand Redux Toolkit (RTK) slices, store setup, and async thunks.',
      },
      {
        name: 'REST APIs',
        category: 'Backend',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Consuming and integrating backend services seamlessly.',
        recommendation: 'Handle loading states, error boundaries, and optimistic UI updates during API calls.',
      },
    ],
  },
  {
    roleId: 'backend-developer',
    displayName: 'Backend Developer',
    category: 'Backend & Systems',
    description: 'Designs server architectures, REST/GraphQL APIs, database schemas, authentication systems, and microservices.',
    foundationalSkills: ['Node.js', 'SQL', 'REST APIs', 'Git'],
    requiredSkills: [
      {
        name: 'Node.js',
        category: 'Backend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Asynchronous event-driven runtime powering modern backend architectures.',
        recommendation: 'Build REST APIs with Node.js handling concurrency, streams, and file I/O.',
      },
      {
        name: 'Express.js',
        category: 'Backend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'De facto standard web framework for Node.js API development.',
        recommendation: 'Structure clean MVC controllers, route modularization, and custom error middleware.',
      },
      {
        name: 'SQL',
        category: 'Databases',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Standard for relational database query operations and data modeling.',
        recommendation: 'Design normalized schemas, foreign keys, transactions, and performant indexes in PostgreSQL/MySQL.',
      },
      {
        name: 'MongoDB',
        category: 'Databases',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Leading document-based NoSQL database for unstructured and dynamic data storage.',
        recommendation: 'Define Mongoose models, aggregation pipelines, and schema validation.',
      },
      {
        name: 'REST APIs',
        category: 'Backend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Standard interface for client-server and inter-service data exchange.',
        recommendation: 'Implement secure JWT authentication, rate-limiting, and validation schemas.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Source code management and version control.',
        recommendation: 'Maintain clean commit workflows and branch management.',
      },
    ],
    preferredSkills: [
      {
        name: 'Docker',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Containerization for consistent server environments and microservice deployment.',
        recommendation: 'Write Dockerfiles for backend services and configure multi-container setups.',
      },
      {
        name: 'Redis',
        category: 'Databases',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'In-memory data store for caching, session management, and rate limiting.',
        recommendation: 'Implement API response caching and session stores with Redis.',
      },
      {
        name: 'PostgreSQL',
        category: 'Databases',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Advanced open-source relational database with powerful JSON and indexing support.',
        recommendation: 'Connect Node backend to PostgreSQL with connection pooling.',
      },
      {
        name: 'Python',
        category: 'Programming Languages',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Versatile language for backend services with frameworks like FastAPI/Django.',
        recommendation: 'Build a lightweight API service using Python FastAPI.',
      },
    ],
  },
  {
    roleId: 'full-stack-developer',
    displayName: 'Full Stack Developer',
    category: 'Full Stack Development',
    description: 'Bridges frontend client interfaces with backend services, database design, and cloud deployments.',
    foundationalSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB'],
    requiredSkills: [
      {
        name: 'JavaScript',
        category: 'Programming Languages',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Universal language across both frontend and backend application layers.',
        recommendation: 'Master full-stack JavaScript paradigms, asynchronous patterns, and modules.',
      },
      {
        name: 'React',
        category: 'Frontend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Client-side component architecture, interactive state management, and rendering.',
        recommendation: 'Develop dynamic UIs with responsive components, hooks, and clean state patterns.',
      },
      {
        name: 'Node.js',
        category: 'Backend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Server-side runtime environment for API routing and data services.',
        recommendation: 'Build performant server backends communicating with databases and external APIs.',
      },
      {
        name: 'Express.js',
        category: 'Backend',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Standard Node.js routing and middleware framework.',
        recommendation: 'Create modular REST controllers with authentication guards and validation.',
      },
      {
        name: 'MongoDB',
        category: 'Databases',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Flexible NoSQL document store commonly used in MERN/MEVN stacks.',
        recommendation: 'Model entity schemas and queries using Mongoose ODM.',
      },
      {
        name: 'SQL',
        category: 'Databases',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Relational data querying and transactional data integrity.',
        recommendation: 'Understand relational schemas, foreign key relationships, and query joins.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Version control for full-stack codebases.',
        recommendation: 'Publish full-stack repositories with complete documentation.',
      },
    ],
    preferredSkills: [
      {
        name: 'TypeScript',
        category: 'Programming Languages',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'End-to-end type safety between frontend models and backend API contracts.',
        recommendation: 'Share TypeScript types/interfaces across client and server.',
      },
      {
        name: 'TailwindCSS',
        category: 'Frontend',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Rapid styling for cohesive full-stack web applications.',
        recommendation: 'Style complete responsive dashboard interfaces with Tailwind utility classes.',
      },
      {
        name: 'Docker',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Multi-container orchestration for client, server, and database.',
        recommendation: 'Run full-stack applications with docker-compose.',
      },
      {
        name: 'REST APIs',
        category: 'Backend',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Well-structured contract between client UI and server resources.',
        recommendation: 'Document endpoints with clear request/response JSON schemas.',
      },
    ],
  },
  {
    roleId: 'data-scientist',
    displayName: 'Data Scientist',
    category: 'Data & AI',
    description: 'Applies statistical modeling, machine learning, and data visualization to discover actionable business insights.',
    foundationalSkills: ['Python', 'SQL', 'Machine Learning', 'Pandas'],
    requiredSkills: [
      {
        name: 'Python',
        category: 'Programming Languages',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Primary programming language for data analysis, statistical modeling, and ML libraries.',
        recommendation: 'Master data structures, functional operations, and vectorization.',
      },
      {
        name: 'SQL',
        category: 'Databases',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Querying and extracting structured analytical datasets from data warehouses.',
        recommendation: 'Write complex window functions, CTEs, and aggregation queries.',
      },
      {
        name: 'Pandas',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Core data manipulation, cleaning, filtering, and exploratory data analysis library.',
        recommendation: 'Perform data wrangling, missing-value imputation, and time-series aggregation.',
      },
      {
        name: 'NumPy',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Numerical computing with multidimensional arrays and mathematical functions.',
        recommendation: 'Utilize array broadcasting, linear algebra, and statistical operations.',
      },
      {
        name: 'Machine Learning',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Supervised and unsupervised predictive modeling algorithms.',
        recommendation: 'Train regression, classification, clustering models, and evaluate with cross-validation.',
      },
      {
        name: 'Scikit-learn',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Standard Python machine learning toolkit for preprocessing, pipelines, and evaluation.',
        recommendation: 'Build end-to-end ML pipelines with hyperparameter tuning.',
      },
    ],
    preferredSkills: [
      {
        name: 'Deep Learning',
        category: 'AI/ML & Data',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Neural network architectures for complex image, text, and sequence modeling.',
        recommendation: 'Train a basic neural network using PyTorch or TensorFlow.',
      },
      {
        name: 'PyTorch',
        category: 'AI/ML & Data',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Dynamic deep learning framework favored in research and modern AI.',
        recommendation: 'Implement custom datasets, forward passes, and training loops in PyTorch.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Reproducible research code and model version control.',
        recommendation: 'Version Jupyter notebooks and data processing scripts on GitHub.',
      },
    ],
  },
  {
    roleId: 'devops-engineer',
    displayName: 'DevOps / Cloud Engineer',
    category: 'Cloud & Infrastructure',
    description: 'Automates infrastructure provisioning, CI/CD pipelines, container orchestration, and system reliability.',
    foundationalSkills: ['Linux', 'Docker', 'Git', 'AWS', 'CI/CD'],
    requiredSkills: [
      {
        name: 'Linux',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Underlying operating system for server administration, networking, and cloud VMs.',
        recommendation: 'Practice bash scripting, systemd service management, and network troubleshooting.',
      },
      {
        name: 'Docker',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Container runtime standard for isolating applications and dependencies.',
        recommendation: 'Create multi-stage Docker builds and optimize container image layers.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Infrastructure-as-code and configuration version management.',
        recommendation: 'Manage GitOps repositories and automated webhook triggers.',
      },
      {
        name: 'CI/CD',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Continuous integration and deployment pipelines automating testing and releases.',
        recommendation: 'Build GitHub Actions workflows with automated testing and deployment stages.',
      },
      {
        name: 'AWS',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Leading public cloud infrastructure platform.',
        recommendation: 'Configure EC2 instances, S3 buckets, VPC networking, and IAM security policies.',
      },
    ],
    preferredSkills: [
      {
        name: 'Kubernetes',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Industry standard for container orchestration, scaling, and self-healing.',
        recommendation: 'Deploy pods, services, ingress controllers, and configmaps in a local minikube cluster.',
      },
      {
        name: 'Python',
        category: 'Programming Languages',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Scripting language for infrastructure automation, SDKs, and cloud functions.',
        recommendation: 'Write automation scripts interacting with cloud APIs via boto3.',
      },
      {
        name: 'Nginx',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'High-performance reverse proxy and load balancer.',
        recommendation: 'Configure SSL certificates, reverse proxy routing, and caching rules with Nginx.',
      },
    ],
  },
  {
    roleId: 'data-analyst',
    displayName: 'Data Analyst',
    category: 'Data & Analytics',
    description: 'Collects, transforms, and visualizes data to help organizations make informed business decisions.',
    foundationalSkills: ['SQL', 'Excel', 'Python', 'Tableau', 'Statistics'],
    requiredSkills: [
      {
        name: 'SQL',
        category: 'Databases',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Essential for querying relational databases, aggregations, window functions, and joining business datasets.',
        recommendation: 'Master complex queries, aggregations, subqueries, and window functions.',
      },
      {
        name: 'Python',
        category: 'Programming Languages',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Core language for exploratory data analysis, automation, and statistical modeling.',
        recommendation: 'Practice data transformation, cleaning, and statistical calculations with Python.',
      },
      {
        name: 'Pandas',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Standard tool for tabular data manipulation, filtering, and summarization.',
        recommendation: 'Perform end-to-end data wrangling, missing data imputation, and group-by aggregations.',
      },
      {
        name: 'Excel',
        category: 'Tools',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Ubiquitous tool for rapid business analysis, pivot tables, and financial modeling.',
        recommendation: 'Master VLOOKUP/XLOOKUP, pivot tables, advanced formulas, and scenario analysis.',
      },
      {
        name: 'Tableau',
        category: 'Tools',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Leading business intelligence and interactive data visualization platform.',
        recommendation: 'Design executive dashboards with interactive filters, calculated fields, and drill-downs.',
      },
    ],
    preferredSkills: [
      {
        name: 'Power BI',
        category: 'Tools',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Popular Microsoft BI solution for business reporting and DAX modeling.',
        recommendation: 'Build interactive reports with DAX measures and Power Query transformations.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Version control for analytics scripts and reporting pipelines.',
        recommendation: 'Maintain version-controlled analysis repositories with reproducible READMEs.',
      },
      {
        name: 'NumPy',
        category: 'AI/ML & Data',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Vectorized mathematical operations on structured numerical data.',
        recommendation: 'Learn basic multidimensional array indexing and mathematical operations.',
      },
    ],
  },
  {
    roleId: 'ml-engineer',
    displayName: 'Machine Learning Engineer',
    category: 'AI & Machine Learning',
    description: 'Researches, builds, and operationalizes scalable machine learning and deep learning models into production systems.',
    foundationalSkills: ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'Docker'],
    requiredSkills: [
      {
        name: 'Python',
        category: 'Programming Languages',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'De facto standard programming language across machine learning research and engineering.',
        recommendation: 'Master idiomatic Python, OOP, packaging, and performance profiling.',
      },
      {
        name: 'Machine Learning',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Foundational algorithmic knowledge for training, regularizing, and evaluating statistical models.',
        recommendation: 'Implement linear models, tree ensembles, SVMs, clustering, and cross-validation pipelines.',
      },
      {
        name: 'Deep Learning',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Architecting neural networks for computer vision, NLP, and multimodal applications.',
        recommendation: 'Train CNNs, RNNs, and Transformers with loss function tuning and backpropagation.',
      },
      {
        name: 'PyTorch',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Leading deep learning framework for production ML systems and research.',
        recommendation: 'Build custom Dataset/DataLoader pipelines, model architectures, and training loops.',
      },
      {
        name: 'Scikit-learn',
        category: 'AI/ML & Data',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Classical machine learning toolkit for feature extraction and baseline modeling.',
        recommendation: 'Create modular data preprocessing pipelines and hyperparameter search grids.',
      },
      {
        name: 'Docker',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Packaging reproducible ML inference microservices with isolated CUDA dependencies.',
        recommendation: 'Containerize an ML model serving REST or gRPC predictions.',
      },
    ],
    preferredSkills: [
      {
        name: 'TensorFlow',
        category: 'AI/ML & Data',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Production ML ecosystem with TF Serving and TFLite support.',
        recommendation: 'Understand Keras model construction and deployment with TensorFlow Serving.',
      },
      {
        name: 'Kubernetes',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Orchestrating scalable distributed model training and inference workloads.',
        recommendation: 'Deploy containerized ML prediction pods with auto-scaling in Kubernetes.',
      },
      {
        name: 'AWS',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Cloud infrastructure hosting GPU instances, S3 datasets, and SageMaker pipelines.',
        recommendation: 'Experiment with cloud model training, storage, and API gateway deployment.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Code and experiment tracking version control.',
        recommendation: 'Version ML pipelines and code on GitHub.',
      },
    ],
  },
  {
    roleId: 'cybersecurity-engineer',
    displayName: 'Cybersecurity Engineer',
    category: 'Security & Infrastructure',
    description: 'Safeguards organizational networks, cloud systems, and applications from vulnerabilities and unauthorized access.',
    foundationalSkills: ['Linux', 'Networking', 'Python', 'Git', 'Security'],
    requiredSkills: [
      {
        name: 'Linux',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Primary operating system for security testing, server hardening, and forensic analysis.',
        recommendation: 'Master command-line administration, log inspection, and system access controls.',
      },
      {
        name: 'Python',
        category: 'Programming Languages',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Writing automated vulnerability scanners, security test scripts, and log parsers.',
        recommendation: 'Write scripts utilizing network sockets, cryptography, and HTTP request inspection.',
      },
      {
        name: 'Git',
        category: 'Cloud & DevOps',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Managing secure code repositories and automated security scanning workflows.',
        recommendation: 'Incorporate secret scanning and static analysis in Git workflows.',
      },
      {
        name: 'SQL',
        category: 'Databases',
        importance: 'required',
        minProficiency: 'intermediate',
        reason: 'Understanding SQL injection vectors, database auditing, and access control.',
        recommendation: 'Understand parameterized queries, privilege least-privilege principles, and audit logging.',
      },
    ],
    preferredSkills: [
      {
        name: 'Docker',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Container security, rootless containers, and image vulnerability scanning.',
        recommendation: 'Scan container images for known CVEs using vulnerability scanners.',
      },
      {
        name: 'AWS',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'Cloud security posture, IAM least privilege, and VPC network isolation.',
        recommendation: 'Configure IAM policies, security groups, and audit trails in AWS CloudTrail.',
      },
      {
        name: 'CI/CD',
        category: 'Cloud & DevOps',
        importance: 'preferred',
        minProficiency: 'beginner',
        reason: 'DevSecOps integration for continuous security and SAST/DAST scanning.',
        recommendation: 'Integrate automated static application security testing (SAST) in CI pipelines.',
      },
    ],
  },
];

/**
 * Flexible matching helper to find baseline requirements for a target role string
 */
function findRoleRequirements(targetRole) {
  if (!targetRole || typeof targetRole !== 'string') return null;

  const normalized = targetRole.trim().toLowerCase();

  // 1. Direct slug or name match
  let matched = CAREER_ROLES.find(
    (r) => r.roleId === normalized || r.displayName.toLowerCase() === normalized
  );
  if (matched) return matched;

  // 2. Substring matching heuristics
  if (normalized.includes('front') || normalized.includes('ui') || normalized.includes('react')) {
    return CAREER_ROLES.find((r) => r.roleId === 'frontend-developer');
  }
  if (normalized.includes('back') || normalized.includes('api') || normalized.includes('server')) {
    return CAREER_ROLES.find((r) => r.roleId === 'backend-developer');
  }
  if (normalized.includes('full') || normalized.includes('mern') || normalized.includes('web dev')) {
    return CAREER_ROLES.find((r) => r.roleId === 'full-stack-developer');
  }
  if (normalized.includes('cyber') || normalized.includes('security') || normalized.includes('infosec') || normalized.includes('soc')) {
    return CAREER_ROLES.find((r) => r.roleId === 'cybersecurity-engineer');
  }
  if (normalized.includes('ml') || normalized.includes('machine learn') || normalized.includes('deep learn') || normalized.includes('ai engineer')) {
    return CAREER_ROLES.find((r) => r.roleId === 'ml-engineer');
  }
  if (normalized.includes('data analyst') || normalized.includes('analytics') || normalized.includes('bi analyst') || normalized.includes('business intelligence')) {
    return CAREER_ROLES.find((r) => r.roleId === 'data-analyst');
  }
  if (normalized.includes('data sci') || normalized.includes('data')) {
    return CAREER_ROLES.find((r) => r.roleId === 'data-scientist');
  }
  if (normalized.includes('devops') || normalized.includes('cloud') || normalized.includes('infra') || normalized.includes('sre')) {
    return CAREER_ROLES.find((r) => r.roleId === 'devops-engineer');
  }
  if (normalized.includes('software') || normalized.includes('engineer') || normalized.includes('sde') || normalized.includes('developer')) {
    return CAREER_ROLES.find((r) => r.roleId === 'software-engineer');
  }

  // Fallback to general Software Engineer baseline
  return CAREER_ROLES.find((r) => r.roleId === 'software-engineer');
}

module.exports = {
  CAREER_ROLES,
  findRoleRequirements,
};

