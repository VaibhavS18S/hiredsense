const VAGUE_PHRASES = [
  'rockstar',
  'ninja',
  'guru',
  'wizard',
  'wear many hats',
  'fast-paced environment',
  'work hard play hard',
  'self-starter who needs no direction',
  'competitive salary',
  'unlimited potential',
  'team player with good vibes',
  'jack of all trades',
];

/**
 * Analyzes a job posting for quality, clarity, and readiness
 */
function analyzeJobReadiness(jobData) {
  let score = 100;
  const missingElements = [];
  const detectedVaguePhrases = [];
  const suggestions = [];

  const textToScan = `${jobData.title || ''} ${jobData.rawDescription || ''} ${(jobData.responsibilities || []).join(' ')}`.toLowerCase();

  // 1. Mandatory Skills check
  if (!jobData.mandatorySkills || jobData.mandatorySkills.length === 0) {
    score -= 30;
    missingElements.push('No mandatory skills specified');
    suggestions.push('Add at least 3-5 mandatory skills to enable precise candidate matching.');
  } else if (jobData.mandatorySkills.length < 3) {
    score -= 10;
    missingElements.push('Fewer than 3 mandatory skills');
    suggestions.push('Consider defining more core requirements to distinguish strong candidates.');
  }

  // 2. Responsibilities check
  if (!jobData.responsibilities || jobData.responsibilities.length === 0) {
    score -= 25;
    missingElements.push('Missing key responsibilities');
    suggestions.push('Detail day-to-day deliverables and expectations.');
  }

  // 3. Experience check
  if (!jobData.minYearsExperience || jobData.minYearsExperience <= 0) {
    score -= 10;
    missingElements.push('Unspecified minimum experience duration');
    suggestions.push('Clarify minimum years of experience expected.');
  }

  // 4. Qualifications check
  if (!jobData.qualifications || jobData.qualifications.length === 0) {
    score -= 10;
    missingElements.push('No degree or educational qualifications listed');
    suggestions.push('Specify minimum education level or equivalent experience.');
  }

  // 5. Salary transparency check
  if (!jobData.salaryRange || (!jobData.salaryRange.min && !jobData.salaryRange.max)) {
    score -= 10;
    missingElements.push('Salary range not provided');
    suggestions.push('Providing a compensation band improves applicant quality and candidate engagement.');
  }

  // 6. Vague wording detection
  for (const phrase of VAGUE_PHRASES) {
    if (textToScan.includes(phrase)) {
      detectedVaguePhrases.push(phrase);
      score -= 4;
    }
  }

  if (detectedVaguePhrases.length > 0) {
    suggestions.push(`Replace vague phrases (${detectedVaguePhrases.join(', ')}) with specific, verifiable role criteria.`);
  }

  const clarityScore = Math.max(10, Math.min(100, score));
  const isReady = clarityScore >= 70;

  return {
    clarityScore,
    isReady,
    missingElements,
    vaguePhrases: detectedVaguePhrases,
    suggestions,
  };
}

/**
 * Intelligent Job Enhancement / Generation Templates
 */
const DOMAIN_SUGGESTIONS = {
  'full-stack': {
    mandatorySkills: [
      { name: 'React', minYears: 3, importance: 'critical', category: 'Frontend' },
      { name: 'Node.js', minYears: 3, importance: 'critical', category: 'Backend' },
      { name: 'TypeScript', minYears: 2, importance: 'high', category: 'Frontend' },
      { name: 'PostgreSQL', minYears: 2, importance: 'high', category: 'Database & Storage' },
    ],
    preferredSkills: [
      { name: 'Docker', importance: 'high', category: 'Cloud & DevOps' },
      { name: 'AWS', importance: 'medium', category: 'Cloud & DevOps' },
      { name: 'GraphQL', importance: 'nice-to-have', category: 'Backend' },
      { name: 'Tailwind CSS', importance: 'medium', category: 'Frontend' },
    ],
    responsibilities: [
      'Design, develop, and maintain performant full-stack web applications and microservices.',
      'Collaborate with product designers and backend engineers to implement intuitive user workflows.',
      'Architect robust REST and GraphQL APIs with comprehensive automated test suites.',
      'Ensure high code standards, security posture, and database optimization.',
    ],
    qualifications: ["Bachelor's Degree in Computer Science, Software Engineering, or equivalent practical experience"],
  },
  'devops': {
    mandatorySkills: [
      { name: 'Kubernetes', minYears: 3, importance: 'critical', category: 'Cloud & DevOps' },
      { name: 'Docker', minYears: 3, importance: 'critical', category: 'Cloud & DevOps' },
      { name: 'AWS', minYears: 3, importance: 'critical', category: 'Cloud & DevOps' },
      { name: 'Terraform', minYears: 2, importance: 'high', category: 'Cloud & DevOps' },
    ],
    preferredSkills: [
      { name: 'CI/CD', importance: 'high', category: 'Cloud & DevOps' },
      { name: 'Linux', importance: 'high', category: 'Cloud & DevOps' },
      { name: 'Python', importance: 'medium', category: 'Backend' },
      { name: 'Monitoring', importance: 'medium', category: 'Cloud & DevOps' },
    ],
    responsibilities: [
      'Architect and manage multi-region cloud infrastructure using Infrastructure as Code (Terraform).',
      'Optimize CI/CD release pipelines to achieve zero-downtime automated deployments.',
      'Establish enterprise telemetry, alerting, and incident response runbooks.',
      'Enforce security best practices across Kubernetes clusters and cloud VPCs.',
    ],
    qualifications: ["Bachelor's Degree in Computer Science, Information Technology, or equivalent experience"],
  },
  'design': {
    mandatorySkills: [
      { name: 'Figma', minYears: 3, importance: 'critical', category: 'Design & Product' },
      { name: 'Design Systems', minYears: 3, importance: 'critical', category: 'Design & Product' },
      { name: 'Wireframing', minYears: 2, importance: 'high', category: 'Design & Product' },
      { name: 'User Research', minYears: 2, importance: 'high', category: 'Design & Product' },
    ],
    preferredSkills: [
      { name: 'Prototyping', importance: 'high', category: 'Design & Product' },
      { name: 'Tailwind CSS', importance: 'medium', category: 'Frontend' },
      { name: 'HTML5', importance: 'medium', category: 'Frontend' },
    ],
    responsibilities: [
      'Lead end-to-end product design from generative user research to high-fidelity implementation specs.',
      'Maintain and evolve the global multi-brand design system in Figma and code tokens.',
      'Facilitate design reviews with executive stakeholders and cross-functional engineering teams.',
      'Conduct regular usability tests and synthesize user feedback into actionable product iterations.',
    ],
    qualifications: ["Bachelor's Degree in Design, Human-Computer Interaction, or equivalent portfolio evidence"],
  },
  'ai': {
    mandatorySkills: [
      { name: 'Python', minYears: 3, importance: 'critical', category: 'Backend' },
      { name: 'PyTorch', minYears: 2, importance: 'critical', category: 'AI & Machine Learning' },
      { name: 'Large Language Models (LLMs)', minYears: 1, importance: 'high', category: 'AI & Machine Learning' },
      { name: 'NLP', minYears: 2, importance: 'high', category: 'AI & Machine Learning' },
    ],
    preferredSkills: [
      { name: 'LangChain', importance: 'high', category: 'AI & Machine Learning' },
      { name: 'Vector Databases', importance: 'high', category: 'AI & Machine Learning' },
      { name: 'Docker', importance: 'medium', category: 'Cloud & DevOps' },
      { name: 'FastAPI', importance: 'medium', category: 'Backend' },
    ],
    responsibilities: [
      'Train, fine-tune, and evaluate deep learning and transformer-based language models.',
      'Implement enterprise RAG (Retrieval Augmented Generation) architectures with vector indexes.',
      'Build scalable inference APIs with low latency and streaming responses.',
      'Ensure ethical AI practices, guardrails against hallucinations, and rigorous benchmark testing.',
    ],
    qualifications: ["Master's Degree or PhD in Computer Science, Artificial Intelligence, or Mathematics"],
  }
};

/**
 * Generates tailored suggestions based on title or domain
 */
function generateJobEnhancements(title) {
  const lower = (title || '').toLowerCase();
  let selected = DOMAIN_SUGGESTIONS['full-stack'];

  if (lower.includes('devops') || lower.includes('cloud') || lower.includes('infra') || lower.includes('sre')) {
    selected = DOMAIN_SUGGESTIONS['devops'];
  } else if (lower.includes('design') || lower.includes('product designer') || lower.includes('ui') || lower.includes('ux')) {
    selected = DOMAIN_SUGGESTIONS['design'];
  } else if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learning') || lower.includes('data science') || lower.includes('nlp')) {
    selected = DOMAIN_SUGGESTIONS['ai'];
  }

  return selected;
}

module.exports = {
  analyzeJobReadiness,
  generateJobEnhancements,
};
