require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

const User = require('../models/User');
const Organization = require('../models/Organization');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Resume = require('../models/Resume');
const ScreeningResult = require('../models/ScreeningResult');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const SavedSearch = require('../models/SavedSearch');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const ScoringConfig = require('../models/ScoringConfig');
const { calculateFileHash } = require('../services/resumeParser/textExtractor');
const { calculateCandidateMatch } = require('../services/matchingEngine/scoringEngine');

async function seedDatabase() {
  try {
    console.log('--- Starting HireSense AI Database Seeding ---');
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Job.deleteMany({}),
      Candidate.deleteMany({}),
      Resume.deleteMany({}),
      ScreeningResult.deleteMany({}),
      Application.deleteMany({}),
      Interview.deleteMany({}),
      SavedSearch.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      ScoringConfig.deleteMany({}),
    ]);

    console.log('Cleaned existing collections.');

    // 1. Create Organization
    const organization = await Organization.create({
      name: 'Vanguard Talent Technologies',
      slug: 'vanguard-talent',
      domain: 'vanguardtalent.io',
      retentionDays: 365,
      anonymizedScreening: false,
    });

    // 2. Create Scoring Config
    await ScoringConfig.create({
      organization: organization._id,
      weights: { skills: 40, semantic: 30, experience: 20, qualification: 10 },
      minimumReviewThreshold: 60,
      shortlistThreshold: 75,
      penalizeMissingMandatory: true,
    });

    // 3. Create Users
    const adminUser = await User.create({
      name: 'Elena Rostova',
      email: 'recruiter@hiresense.ai',
      password: 'Password123!',
      role: 'admin',
      title: 'Head of Global Talent Acquisition',
      organization: organization._id,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    const recruiterUser = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.vance@hiresense.ai',
      password: 'Password123!',
      role: 'recruiter',
      title: 'Senior Technical Recruiter',
      organization: organization._id,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    const managerUser = await User.create({
      name: 'Devin Thorne',
      email: 'devin.thorne@hiresense.ai',
      password: 'Password123!',
      role: 'hiring_manager',
      title: 'VP of Platform Engineering',
      organization: organization._id,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    console.log('Created Users: Elena (Admin), Marcus (Recruiter), Devin (Hiring Manager).');

    // 4. Create Jobs
    const jobsData = [
      {
        title: 'Senior Full-Stack Engineer',
        department: 'Core Platform Engineering',
        location: 'San Francisco, CA (Hybrid / Remote)',
        type: 'Full-time',
        experienceLevel: 'Senior Level',
        minYearsExperience: 5,
        salaryRange: { min: 165000, max: 210000, currency: 'USD' },
        qualifications: ["Bachelor's Degree in Computer Science or Software Engineering"],
        mandatorySkills: [
          { name: 'React', minYears: 4, importance: 'critical', category: 'Frontend' },
          { name: 'Node.js', minYears: 4, importance: 'critical', category: 'Backend' },
          { name: 'TypeScript', minYears: 3, importance: 'high', category: 'Frontend' },
          { name: 'PostgreSQL', minYears: 3, importance: 'high', category: 'Database & Storage' },
        ],
        preferredSkills: [
          { name: 'Docker', importance: 'high', category: 'Cloud & DevOps' },
          { name: 'AWS', importance: 'medium', category: 'Cloud & DevOps' },
          { name: 'GraphQL', importance: 'medium', category: 'Backend' },
          { name: 'Redis', importance: 'medium', category: 'Database & Storage' },
        ],
        responsibilities: [
          'Architect and deliver end-to-end features spanning React frontend applications and high-throughput Node.js microservices.',
          'Optimize database queries and schema designs in PostgreSQL to ensure sub-100ms response times at scale.',
          'Lead technical design discussions and mentor mid-level software engineers.',
          'Collaborate with Product and Security teams to deliver enterprise-grade reliability.',
        ],
        rawDescription: 'We are seeking an experienced Senior Full-Stack Engineer with proven hands-on expertise in React, TypeScript, Node.js, and PostgreSQL to scale our high-growth collaboration platform.',
        readinessScore: 95,
        readinessAnalysis: {
          clarityScore: 95,
          isReady: true,
          missingElements: [],
          vaguePhrases: [],
          suggestions: ['Job description meets all quality benchmarks for screening precision.'],
        },
        status: 'active',
        organization: organization._id,
        createdBy: adminUser._id,
      },
      {
        title: 'Lead Cloud Infrastructure & DevOps Architect',
        department: 'Infrastructure & Security',
        location: 'Seattle, WA (Remote Friendly)',
        type: 'Full-time',
        experienceLevel: 'Lead / Staff',
        minYearsExperience: 7,
        salaryRange: { min: 190000, max: 245000, currency: 'USD' },
        qualifications: ["Bachelor's Degree in Computer Science or equivalent practical experience"],
        mandatorySkills: [
          { name: 'Kubernetes', minYears: 5, importance: 'critical', category: 'Cloud & DevOps' },
          { name: 'Terraform', minYears: 4, importance: 'critical', category: 'Cloud & DevOps' },
          { name: 'AWS', minYears: 5, importance: 'critical', category: 'Cloud & DevOps' },
          { name: 'Docker', minYears: 5, importance: 'high', category: 'Cloud & DevOps' },
        ],
        preferredSkills: [
          { name: 'CI/CD', importance: 'high', category: 'Cloud & DevOps' },
          { name: 'Linux', importance: 'high', category: 'Cloud & DevOps' },
          { name: 'Python', importance: 'medium', category: 'Backend' },
          { name: 'Monitoring', importance: 'medium', category: 'Cloud & DevOps' },
        ],
        responsibilities: [
          'Design and maintain multi-region Amazon Web Services infrastructure using Infrastructure as Code (Terraform).',
          'Manage enterprise Kubernetes clusters supporting hundreds of containerized microservices.',
          'Establish automated deployment pipelines and zero-trust security postures.',
          'Drive Disaster Recovery (DR) testing and high-availability architecture SLAs.',
        ],
        rawDescription: 'Join our infrastructure team as Lead DevOps Architect to champion our cloud migration, Kubernetes clusters, and automated Terraform delivery systems.',
        readinessScore: 92,
        readinessAnalysis: {
          clarityScore: 92,
          isReady: true,
          missingElements: [],
          vaguePhrases: [],
          suggestions: ['Well-defined technical criteria with clear experience expectations.'],
        },
        status: 'active',
        organization: organization._id,
        createdBy: adminUser._id,
      },
      {
        title: 'Staff AI/ML Platform Engineer',
        department: 'Applied AI Research',
        location: 'New York, NY (Hybrid)',
        type: 'Full-time',
        experienceLevel: 'Lead / Staff',
        minYearsExperience: 6,
        salaryRange: { min: 210000, max: 275000, currency: 'USD' },
        qualifications: ["Master's Degree or Ph.D. in Computer Science, AI, or Computational Mathematics"],
        mandatorySkills: [
          { name: 'Python', minYears: 5, importance: 'critical', category: 'Backend' },
          { name: 'PyTorch', minYears: 4, importance: 'critical', category: 'AI & Machine Learning' },
          { name: 'Large Language Models (LLMs)', minYears: 2, importance: 'high', category: 'AI & Machine Learning' },
          { name: 'NLP', minYears: 4, importance: 'high', category: 'AI & Machine Learning' },
        ],
        preferredSkills: [
          { name: 'Vector Databases', importance: 'high', category: 'AI & Machine Learning' },
          { name: 'LangChain', importance: 'high', category: 'AI & Machine Learning' },
          { name: 'FastAPI', importance: 'medium', category: 'Backend' },
          { name: 'Docker', importance: 'medium', category: 'Cloud & DevOps' },
        ],
        responsibilities: [
          'Build scalable inference systems and fine-tuning pipelines for LLMs.',
          'Implement enterprise RAG pipelines with vector databases for semantic retrieval.',
          'Optimize model serving latency and GPU resource utilization.',
          'Collaborate with product squads to deploy generative AI capabilities safely.',
        ],
        rawDescription: 'Applied AI Research is seeking a Staff AI/ML Platform Engineer to spearhead our LLM infrastructure and high-performance neural search engine.',
        readinessScore: 90,
        readinessAnalysis: {
          clarityScore: 90,
          isReady: true,
          missingElements: [],
          vaguePhrases: [],
          suggestions: ['Complete requirements ready for automated talent matching.'],
        },
        status: 'active',
        organization: organization._id,
        createdBy: recruiterUser._id,
      },
      {
        title: 'Senior Product Designer',
        department: 'Product Design & UX',
        location: 'Austin, TX (Remote)',
        type: 'Full-time',
        experienceLevel: 'Senior Level',
        minYearsExperience: 5,
        salaryRange: { min: 145000, max: 185000, currency: 'USD' },
        qualifications: ["Bachelor's Degree in Interaction Design, Human-Computer Interaction, or portfolio equivalence"],
        mandatorySkills: [
          { name: 'Figma', minYears: 4, importance: 'critical', category: 'Design & Product' },
          { name: 'Design Systems', minYears: 3, importance: 'critical', category: 'Design & Product' },
          { name: 'Wireframing', minYears: 4, importance: 'high', category: 'Design & Product' },
          { name: 'User Research', minYears: 3, importance: 'high', category: 'Design & Product' },
        ],
        preferredSkills: [
          { name: 'Prototyping', importance: 'high', category: 'Design & Product' },
          { name: 'Tailwind CSS', importance: 'medium', category: 'Frontend' },
          { name: 'HTML5', importance: 'medium', category: 'Frontend' },
        ],
        responsibilities: [
          'Design end-to-end customer workflows for complex enterprise SaaS products.',
          'Scale and document our multi-brand Figma design system and component library.',
          'Run quantitative and qualitative user research sprints.',
          'Partner with product managers and engineers to ship polished interfaces.',
        ],
        rawDescription: 'We are looking for a Senior Product Designer with deep Figma expertise and design systems leadership to craft editorial-grade talent tools.',
        readinessScore: 88,
        readinessAnalysis: {
          clarityScore: 88,
          isReady: true,
          missingElements: [],
          vaguePhrases: [],
          suggestions: ['Strong role profile ready for matching.'],
        },
        status: 'active',
        organization: organization._id,
        createdBy: adminUser._id,
      },
    ];

    const jobs = await Job.insertMany(jobsData);
    console.log(`Created ${jobs.length} Job Openings.`);

    const jobFullStack = jobs[0];
    const jobDevOps = jobs[1];
    const jobAI = jobs[2];
    const jobDesigner = jobs[3];

    // 5. Realistic Candidates with varied profiles & skill matches
    const candidatesData = [
      // Candidate 1: Top match for Full Stack (Julian Sterling)
      {
        name: 'Julian Sterling',
        email: 'julian.sterling@techmail.io',
        phone: '+1 (415) 892-4102',
        location: 'San Francisco, CA',
        headline: 'Staff Full-Stack Architect | Ex-Stripe | React, TypeScript & Node.js',
        totalExperienceYears: 7,
        links: {
          linkedin: 'https://linkedin.com/in/julian-sterling',
          github: 'https://github.com/jsterling-dev',
          portfolio: 'https://juliansterling.dev',
        },
        skills: [
          { name: 'React', category: 'Frontend', yearsOfExperience: 6, confidence: 0.98 },
          { name: 'Node.js', category: 'Backend', yearsOfExperience: 6, confidence: 0.97 },
          { name: 'TypeScript', category: 'Frontend', yearsOfExperience: 5, confidence: 0.96 },
          { name: 'PostgreSQL', category: 'Database & Storage', yearsOfExperience: 5, confidence: 0.95 },
          { name: 'Docker', category: 'Cloud & DevOps', yearsOfExperience: 4, confidence: 0.92 },
          { name: 'AWS', category: 'Cloud & DevOps', yearsOfExperience: 4, confidence: 0.91 },
          { name: 'GraphQL', category: 'Backend', yearsOfExperience: 3, confidence: 0.90 },
          { name: 'Redis', category: 'Database & Storage', yearsOfExperience: 4, confidence: 0.92 },
          { name: 'Tailwind CSS', category: 'Frontend', yearsOfExperience: 4, confidence: 0.94 },
        ],
        experienceTimeline: [
          {
            company: 'Horizon Cloud Systems',
            role: 'Lead Full-Stack Engineer',
            startDate: '2021',
            endDate: 'Present',
            isCurrent: true,
            durationMonths: 48,
            description: 'Architected high-throughput React & Node.js microservices processing 45M requests daily. Migrated REST interfaces to GraphQL with Redis caching, reducing API latency by 38%. Led a team of 6 engineers.',
            technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL'],
          },
          {
            company: 'FinPoint Payments',
            role: 'Senior Software Engineer',
            startDate: '2018',
            endDate: '2021',
            isCurrent: false,
            durationMonths: 36,
            description: 'Built customer checkout flows and transaction reconciliation services in Node.js and PostgreSQL. Designed component library with Tailwind CSS and React.',
            technologies: ['Node.js', 'React', 'PostgreSQL', 'Redis', 'AWS'],
          },
        ],
        educationTimeline: [
          {
            institution: 'University of California, Berkeley',
            degree: "Bachelor's Degree (B.S. in Computer Science)",
            field: 'Computer Science',
            graduationYear: '2017',
            grade: '3.85 GPA',
          },
        ],
        certifications: ['AWS Certified Solutions Architect (Associate)', 'Certified Kubernetes Application Developer (CKAD)'],
        detectedStrengths: [
          'Exceeds minimum experience requirement by 2 years',
          'Complete 100% mandatory skill coverage with strong supporting excerpts',
          'Demonstrated leadership managing engineering pods and architecture spikes',
        ],
        unverifiedRequirements: [],
        organization: organization._id,
      },

      // Candidate 2: Strong match with minor gap for Full Stack (Maya Lin)
      {
        name: 'Maya Lin',
        email: 'maya.lin.dev@gmail.com',
        phone: '+1 (206) 554-7819',
        location: 'Seattle, WA',
        headline: 'Senior Frontend & Node Engineer | React, TypeScript, GraphQL',
        totalExperienceYears: 5,
        links: {
          linkedin: 'https://linkedin.com/in/maya-lin-eng',
          github: 'https://github.com/mayalin',
        },
        skills: [
          { name: 'React', category: 'Frontend', yearsOfExperience: 5, confidence: 0.98 },
          { name: 'Node.js', category: 'Backend', yearsOfExperience: 4, confidence: 0.92 },
          { name: 'TypeScript', category: 'Frontend', yearsOfExperience: 4, confidence: 0.95 },
          { name: 'GraphQL', category: 'Backend', yearsOfExperience: 3, confidence: 0.90 },
          { name: 'Docker', category: 'Cloud & DevOps', yearsOfExperience: 2, confidence: 0.85 },
          { name: 'MongoDB', category: 'Database & Storage', yearsOfExperience: 4, confidence: 0.93 },
          { name: 'Tailwind CSS', category: 'Frontend', yearsOfExperience: 3, confidence: 0.92 },
        ],
        experienceTimeline: [
          {
            company: 'Apex Digital Health',
            role: 'Senior Frontend Engineer',
            startDate: '2022',
            endDate: 'Present',
            isCurrent: true,
            durationMonths: 36,
            description: 'Spearheaded medical dashboard overhaul in React 18 and TypeScript. Integrated GraphQL endpoints and Node.js microservices for patient records.',
            technologies: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
          },
          {
            company: 'NextGen Retail Tech',
            role: 'Full-Stack Developer',
            startDate: '2019',
            endDate: '2022',
            isCurrent: false,
            durationMonths: 36,
            description: 'Developed e-commerce customer portal with React and Node.js APIs backed by MongoDB.',
            technologies: ['React', 'Node.js', 'MongoDB', 'Docker'],
          },
        ],
        educationTimeline: [
          {
            institution: 'University of Washington',
            degree: "Bachelor's Degree (B.S. in Software Engineering)",
            field: 'Software Engineering',
            graduationYear: '2019',
            grade: '3.7 GPA',
          },
        ],
        certifications: ['Meta Certified Frontend Developer'],
        detectedStrengths: [
          'Excellent React and TypeScript depth with modern React 18 concurrency patterns',
          'Solid API integration background with GraphQL and Node.js',
        ],
        unverifiedRequirements: ['PostgreSQL hands-on production tuning (heavier MongoDB background)'],
        organization: organization._id,
      },

      // Candidate 3: Career Transition / Junior Full Stack (Ethan Ward)
      {
        name: 'Ethan Ward',
        email: 'ethan.ward.codes@outlook.com',
        phone: '+1 (512) 332-9011',
        location: 'Austin, TX',
        headline: 'Full-Stack Developer | React, JavaScript, Node.js',
        totalExperienceYears: 2,
        links: {
          linkedin: 'https://linkedin.com/in/ethan-ward-web',
          github: 'https://github.com/ethanward-dev',
        },
        skills: [
          { name: 'React', category: 'Frontend', yearsOfExperience: 2, confidence: 0.90 },
          { name: 'JavaScript', category: 'Frontend', yearsOfExperience: 2, confidence: 0.92 },
          { name: 'Node.js', category: 'Backend', yearsOfExperience: 2, confidence: 0.88 },
          { name: 'Express.js', category: 'Backend', yearsOfExperience: 2, confidence: 0.88 },
          { name: 'HTML5', category: 'Frontend', yearsOfExperience: 2, confidence: 0.95 },
          { name: 'CSS3', category: 'Frontend', yearsOfExperience: 2, confidence: 0.95 },
        ],
        experienceTimeline: [
          {
            company: 'BrightSpark Labs',
            role: 'Junior Full-Stack Engineer',
            startDate: '2022',
            endDate: 'Present',
            isCurrent: true,
            durationMonths: 24,
            description: 'Built responsive client web pages in React and created REST endpoints in Express.js. Implemented automated testing with Jest.',
            technologies: ['React', 'JavaScript', 'Node.js', 'Express.js'],
          },
        ],
        educationTimeline: [
          {
            institution: 'Flatiron School & UT Austin (BA History)',
            degree: "Bachelor's Degree & Full-Stack Certification",
            field: 'Computer Software',
            graduationYear: '2022',
            grade: 'Graduate',
          },
        ],
        certifications: [],
        detectedStrengths: ['Energetic quick learner with modern React/Express foundations'],
        unverifiedRequirements: ['Under minimum 5-year experience requirement', 'Lacks production PostgreSQL and TypeScript'],
        organization: organization._id,
      },

      // Candidate 4: Top DevOps Architect (Aarav Patel)
      {
        name: 'Aarav Patel',
        email: 'aarav.patel.cloud@domain.net',
        phone: '+1 (408) 612-9934',
        location: 'San Jose, CA',
        headline: 'Principal Infrastructure Engineer | Kubernetes, Terraform, AWS Solutions Architect',
        totalExperienceYears: 9,
        links: {
          linkedin: 'https://linkedin.com/in/aarav-patel-cloud',
          github: 'https://github.com/aaravpatel-k8s',
        },
        skills: [
          { name: 'Kubernetes', category: 'Cloud & DevOps', yearsOfExperience: 7, confidence: 0.99 },
          { name: 'Terraform', category: 'Cloud & DevOps', yearsOfExperience: 6, confidence: 0.98 },
          { name: 'AWS', category: 'Cloud & DevOps', yearsOfExperience: 8, confidence: 0.99 },
          { name: 'Docker', category: 'Cloud & DevOps', yearsOfExperience: 8, confidence: 0.98 },
          { name: 'CI/CD', category: 'Cloud & DevOps', yearsOfExperience: 7, confidence: 0.96 },
          { name: 'Linux', category: 'Cloud & DevOps', yearsOfExperience: 9, confidence: 0.99 },
          { name: 'Python', category: 'Backend', yearsOfExperience: 5, confidence: 0.90 },
          { name: 'Monitoring', category: 'Cloud & DevOps', yearsOfExperience: 6, confidence: 0.94 },
        ],
        experienceTimeline: [
          {
            company: 'CloudMatrix Technologies',
            role: 'Lead Cloud Infrastructure Architect',
            startDate: '2020',
            endDate: 'Present',
            isCurrent: true,
            durationMonths: 60,
            description: 'Designed multi-region AWS cloud infrastructure using Terraform, managing 40+ Kubernetes clusters and 800+ microservices. Reduced cloud spend by 28% via spot instance optimization.',
            technologies: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'Linux', 'CI/CD'],
          },
          {
            company: 'Stratosphere Networks',
            role: 'Senior DevOps Engineer',
            startDate: '2016',
            endDate: '2020',
            isCurrent: false,
            durationMonths: 48,
            description: 'Built GitHub Actions CI/CD pipelines, Docker containerized workloads, and Prometheus/Grafana monitoring clusters.',
            technologies: ['AWS', 'Docker', 'Terraform', 'Linux', 'Python'],
          },
        ],
        educationTimeline: [
          {
            institution: 'San Jose State University',
            degree: "Master's Degree (M.S. in Computer Engineering)",
            field: 'Computer Engineering',
            graduationYear: '2016',
            grade: '3.9 GPA',
          },
        ],
        certifications: ['AWS Certified Solutions Architect (Professional)', 'Certified Kubernetes Administrator (CKA)'],
        detectedStrengths: [
          'Exceeds experience requirements (9 yrs vs 7 yrs requested)',
          'Complete mastery of Kubernetes, Terraform, and AWS ecosystem',
          'Documented cost optimization and high-availability track record',
        ],
        unverifiedRequirements: [],
        organization: organization._id,
      },

      // Candidate 5: Strong AI/ML Engineer (Dr. Sophia Moreau)
      {
        name: 'Dr. Sophia Moreau',
        email: 'sophia.moreau.ai@lab.org',
        phone: '+1 (617) 495-2001',
        location: 'Boston, MA',
        headline: 'Staff AI Research Engineer | Ph.D. MIT | PyTorch, LLMs, NLP & Vector Search',
        totalExperienceYears: 8,
        links: {
          linkedin: 'https://linkedin.com/in/sophia-moreau-ai',
          github: 'https://github.com/smoreau-ai',
          portfolio: 'https://sophiamoreau.ai',
        },
        skills: [
          { name: 'Python', category: 'Backend', yearsOfExperience: 8, confidence: 0.99 },
          { name: 'PyTorch', category: 'AI & Machine Learning', yearsOfExperience: 6, confidence: 0.98 },
          { name: 'Large Language Models (LLMs)', category: 'AI & Machine Learning', yearsOfExperience: 3, confidence: 0.96 },
          { name: 'NLP', category: 'AI & Machine Learning', yearsOfExperience: 7, confidence: 0.98 },
          { name: 'Vector Databases', category: 'AI & Machine Learning', yearsOfExperience: 3, confidence: 0.94 },
          { name: 'LangChain', category: 'AI & Machine Learning', yearsOfExperience: 2, confidence: 0.92 },
          { name: 'FastAPI', category: 'Backend', yearsOfExperience: 4, confidence: 0.91 },
          { name: 'Docker', category: 'Cloud & DevOps', yearsOfExperience: 4, confidence: 0.90 },
        ],
        experienceTimeline: [
          {
            company: 'Synthetix AI Labs',
            role: 'Staff Machine Learning Engineer',
            startDate: '2021',
            endDate: 'Present',
            isCurrent: true,
            durationMonths: 48,
            description: 'Built enterprise RAG architectures with Pinecone and Milvus. Fine-tuned open-source LLMs (Llama-3, Mistral) using LoRA and PyTorch, accelerating domain query precision by 34%.',
            technologies: ['PyTorch', 'Python', 'LLMs', 'NLP', 'Vector Databases', 'FastAPI'],
          },
          {
            company: 'Boston Cognitive Analytics',
            role: 'Senior NLP Researcher',
            startDate: '2018',
            endDate: '2021',
            isCurrent: false,
            durationMonths: 36,
            description: 'Developed transformer models for sentiment and topic extraction across 200M multilingual text documents.',
            technologies: ['Python', 'PyTorch', 'TensorFlow', 'NLP'],
          },
        ],
        educationTimeline: [
          {
            institution: 'Massachusetts Institute of Technology (MIT)',
            degree: 'Ph.D. in Computer Science (Artificial Intelligence)',
            field: 'Artificial Intelligence',
            graduationYear: '2018',
            grade: 'Summa Cum Laude',
          },
        ],
        certifications: ['DeepLearning.AI Generative AI Specialist'],
        detectedStrengths: [
          'Exceeds education standard with MIT Ph.D. in Artificial Intelligence',
          'Published researcher with production LLM fine-tuning and vector DB expertise',
        ],
        unverifiedRequirements: [],
        organization: organization._id,
      },

      // Candidate 6: Senior Product Designer (Camila Rodriguez)
      {
        name: 'Camila Rodriguez',
        email: 'camila.ux.designer@studio.co',
        phone: '+1 (512) 809-4451',
        location: 'Austin, TX',
        headline: 'Lead Product Designer | Design Systems & SaaS UX | Figma & Storybook',
        totalExperienceYears: 6,
        links: {
          linkedin: 'https://linkedin.com/in/camilarodriguez-design',
          portfolio: 'https://camilarodriguez.design',
        },
        skills: [
          { name: 'Figma', category: 'Design & Product', yearsOfExperience: 6, confidence: 0.99 },
          { name: 'Design Systems', category: 'Design & Product', yearsOfExperience: 5, confidence: 0.98 },
          { name: 'Wireframing', category: 'Design & Product', yearsOfExperience: 6, confidence: 0.97 },
          { name: 'User Research', category: 'Design & Product', yearsOfExperience: 5, confidence: 0.95 },
          { name: 'Prototyping', category: 'Design & Product', yearsOfExperience: 5, confidence: 0.96 },
          { name: 'Tailwind CSS', category: 'Frontend', yearsOfExperience: 3, confidence: 0.88 },
          { name: 'HTML5', category: 'Frontend', yearsOfExperience: 4, confidence: 0.90 },
        ],
        experienceTimeline: [
          {
            company: 'OmniSaaS Design Studio',
            role: 'Senior Product Designer',
            startDate: '2020',
            endDate: 'Present',
            isCurrent: true,
            durationMonths: 60,
            description: 'Designed and unified the multi-product design system in Figma used by 45+ engineers. Conducted 60+ user interviews to drive product conversion up 27%.',
            technologies: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
          },
        ],
        educationTimeline: [
          {
            institution: 'Rhode Island School of Design (RISD)',
            degree: "Bachelor's Degree (B.F.A. Graphic & Interactive Design)",
            field: 'Interactive Design',
            graduationYear: '2018',
            grade: 'Honors',
          },
        ],
        certifications: ['Nielsen Norman Group UX Master Certified'],
        detectedStrengths: ['Pristine design systems track record with engineering empathy and research depth'],
        unverifiedRequirements: [],
        organization: organization._id,
      },

      // Candidate 7: Senior Backend Engineer matching Full Stack with React gap (David Novak)
      {
        name: 'David Novak',
        email: 'david.novak.backend@inbox.io',
        phone: '+1 (312) 441-2099',
        location: 'Chicago, IL',
        headline: 'Staff Backend Architect | Node.js, Go, PostgreSQL, Microservices',
        totalExperienceYears: 8,
        links: {
          linkedin: 'https://linkedin.com/in/davidnovak-tech',
          github: 'https://github.com/dnovak-dev',
        },
        skills: [
          { name: 'Node.js', category: 'Backend', yearsOfExperience: 7, confidence: 0.98 },
          { name: 'PostgreSQL', category: 'Database & Storage', yearsOfExperience: 6, confidence: 0.97 },
          { name: 'TypeScript', category: 'Frontend', yearsOfExperience: 4, confidence: 0.91 },
          { name: 'Docker', category: 'Cloud & DevOps', yearsOfExperience: 5, confidence: 0.93 },
          { name: 'Redis', category: 'Database & Storage', yearsOfExperience: 5, confidence: 0.94 },
          { name: 'Kafka', category: 'Cloud & DevOps', yearsOfExperience: 4, confidence: 0.92 },
        ],
        experienceTimeline: [
          {
            company: 'Apex Data Streams',
            role: 'Staff Backend Engineer',
            startDate: '2019',
            endDate: 'Present',
            isCurrent: true,
            durationMonths: 72,
            description: 'Engineered event-driven microservices in Node.js and Go. Optimized PostgreSQL transaction schemas handling 100K queries/min.',
            technologies: ['Node.js', 'PostgreSQL', 'Docker', 'Redis', 'Kafka'],
          },
        ],
        educationTimeline: [
          {
            institution: 'University of Illinois Urbana-Champaign',
            degree: "Master's Degree (M.S. in Computer Science)",
            field: 'Computer Science',
            graduationYear: '2016',
            grade: '3.8 GPA',
          },
        ],
        certifications: [],
        detectedStrengths: ['Deep backend and relational database architecture expertise'],
        unverifiedRequirements: ['Missing React frontend depth (primarily backend specialist)'],
        organization: organization._id,
      },

      // Candidate 8: Mid-Level Cloud Engineer matching DevOps (Samantha Reed)
      {
        name: 'Samantha Reed',
        email: 'samantha.reed.cloud@tech.co',
        phone: '+1 (720) 901-3411',
        location: 'Denver, CO',
        headline: 'Cloud Engineer | AWS, Docker, CI/CD, Terraform',
        totalExperienceYears: 4,
        links: {
          linkedin: 'https://linkedin.com/in/samanthareed-cloud',
          github: 'https://github.com/sreed-ops',
        },
        skills: [
          { name: 'AWS', category: 'Cloud & DevOps', yearsOfExperience: 4, confidence: 0.95 },
          { name: 'Docker', category: 'Cloud & DevOps', yearsOfExperience: 4, confidence: 0.94 },
          { name: 'Terraform', category: 'Cloud & DevOps', yearsOfExperience: 2, confidence: 0.88 },
          { name: 'CI/CD', category: 'Cloud & DevOps', yearsOfExperience: 3, confidence: 0.90 },
          { name: 'Linux', category: 'Cloud & DevOps', yearsOfExperience: 4, confidence: 0.92 },
        ],
        experienceTimeline: [
          {
            company: 'Summit Software',
            role: 'Cloud Operations Engineer',
            startDate: '2021',
            endDate: 'Present',
            isCurrent: true,
            durationMonths: 36,
            description: 'Automated CI/CD deployments and managed AWS ECS tasks with Docker. Managed infrastructure modules in Terraform.',
            technologies: ['AWS', 'Docker', 'Terraform', 'CI/CD'],
          },
        ],
        educationTimeline: [
          {
            institution: 'Colorado State University',
            degree: "Bachelor's Degree (B.S. in Information Systems)",
            field: 'Information Systems',
            graduationYear: '2020',
            grade: '3.6 GPA',
          },
        ],
        certifications: ['AWS Certified SysOps Administrator'],
        detectedStrengths: ['Solid hands-on AWS and Docker foundation'],
        unverifiedRequirements: ['Missing deep multi-cluster Kubernetes experience (primarily ECS)'],
        organization: organization._id,
      },
    ];

    const candidates = await Candidate.insertMany(candidatesData);
    console.log(`Created ${candidates.length} realistic candidates.`);

    // 6. Create Resumes & Screen Candidates Against Jobs
    const pairingPlan = [
      // Julian -> Full Stack (Top Match ~92%)
      { cand: candidates[0], job: jobFullStack, stage: 'Interview', recruiter: adminUser },
      // Maya -> Full Stack (Strong Match ~82%)
      { cand: candidates[1], job: jobFullStack, stage: 'Shortlisted', recruiter: recruiterUser },
      // Ethan -> Full Stack (Junior Match ~48%)
      { cand: candidates[2], job: jobFullStack, stage: 'Screening', recruiter: recruiterUser },
      // David -> Full Stack (Backend Strong with React Gap ~70%)
      { cand: candidates[6], job: jobFullStack, stage: 'New', recruiter: adminUser },
      // Aarav -> DevOps Architect (Top Match ~94%)
      { cand: candidates[3], job: jobDevOps, stage: 'Offer', recruiter: adminUser },
      // Samantha -> DevOps Architect (Mid Match ~74%)
      { cand: candidates[7], job: jobDevOps, stage: 'Shortlisted', recruiter: recruiterUser },
      // Sophia -> AI/ML Platform Engineer (Top Match ~96%)
      { cand: candidates[4], job: jobAI, stage: 'Hired', recruiter: recruiterUser },
      // Camila -> Senior Product Designer (Top Match ~93%)
      { cand: candidates[5], job: jobDesigner, stage: 'Interview', recruiter: adminUser },
    ];

    for (const item of pairingPlan) {
      const resumeText = `RESUME - ${item.cand.name}\nEmail: ${item.cand.email}\nPhone: ${item.cand.phone}\nSummary: ${item.cand.headline}\nTotal Experience: ${item.cand.totalExperienceYears} years\n\nEXPERIENCE:\n` +
        item.cand.experienceTimeline.map((e) => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate})\n${e.description}`).join('\n\n') +
        `\n\nEDUCATION:\n` + item.cand.educationTimeline.map((ed) => `${ed.degree} from ${ed.institution}`).join('\n') +
        `\n\nSKILLS:\n` + item.cand.skills.map((s) => s.name).join(', ');

      const fakeBuffer = Buffer.from(resumeText);
      const fileHash = calculateFileHash(fakeBuffer);

      const resumeDoc = await Resume.create({
        candidateId: item.cand._id,
        fileName: `${item.cand.name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`,
        fileHash,
        fileSize: fakeBuffer.length,
        mimeType: 'application/pdf',
        rawText: resumeText,
        confidenceScore: 94,
        qualityScore: 92,
        organization: organization._id,
        uploadedBy: item.recruiter._id,
      });

      // Calculate Explainable Match
      const match = await calculateCandidateMatch(item.cand, item.job, resumeText, {
        skills: 40,
        semantic: 30,
        experience: 20,
        qualification: 10,
      });

      const screeningResult = await ScreeningResult.create({
        candidateId: item.cand._id,
        jobId: item.job._id,
        resumeId: resumeDoc._id,
        overallScore: match.overallScore,
        componentScores: match.componentScores,
        weightsUsed: match.weightsUsed,
        matchedRequiredSkills: match.matchedRequiredSkills,
        matchedPreferredSkills: match.matchedPreferredSkills,
        missingRequiredSkills: match.missingRequiredSkills,
        missingPreferredSkills: match.missingPreferredSkills,
        experienceEvidence: match.experienceEvidence,
        qualificationEvidence: match.qualificationEvidence,
        supportingExcerpts: match.supportingExcerpts,
        dataQualityWarnings: match.dataQualityWarnings,
        organization: organization._id,
      });

      // Create Application in Pipeline
      await Application.create({
        candidateId: item.cand._id,
        jobId: item.job._id,
        stage: item.stage,
        assignedRecruiter: item.recruiter._id,
        stageHistory: [
          { stage: 'New', changedBy: item.recruiter._id, changedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), note: 'Resume parsed and ingested' },
          { stage: 'Screening', changedBy: item.recruiter._id, changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), note: `AI Screening Score: ${match.overallScore}%` },
          { stage: item.stage, changedBy: item.recruiter._id, changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), note: `Candidate advanced to ${item.stage}` },
        ],
        organization: organization._id,
      });
    }

    console.log(`Paired and screened ${pairingPlan.length} applications with explainable matching evidence.`);

    // 7. Create Sample Interviews
    const julianApp = await Application.findOne({ candidateId: candidates[0]._id, jobId: jobFullStack._id });
    if (julianApp) {
      await Interview.create({
        applicationId: julianApp._id,
        candidateId: candidates[0]._id,
        jobId: jobFullStack._id,
        interviewer: managerUser._id,
        stageName: 'Technical Architecture & System Design',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'Scheduled',
        suggestedQuestions: [
          {
            category: 'Technical Core',
            question: 'How do you design state management and component boundaries in complex data-intensive React dashboards to prevent unnecessary re-renders?',
            context: 'Julian has 6 years of React experience; test deep architectural boundaries.',
            sampleRubric: '1: Only knows useState. 3: Explains memoization/colocation. 5: Deep architectural mastery with React 18 profiling.',
          },
          {
            category: 'System Architecture',
            question: 'Can you describe your schema migration and connection pooling strategy for PostgreSQL under high-concurrency Node.js traffic spikes?',
            context: 'Candidate led PostgreSQL services at Horizon Cloud.',
            sampleRubric: '1: Basic knowledge. 3: Knows PgBouncer and indexes. 5: Complete zero-downtime Blue/Green migrations and read replica topology.',
          },
        ],
        rubricScores: [
          { criteria: 'Technical Competence & Depth', score: 5, notes: 'Exceptional answers on Node.js clustering and event loop latency.' },
          { criteria: 'System Architecture & Problem Solving', score: 4, notes: 'Clear diagrams and trade-off justification.' },
          { criteria: 'Communication & Structural Clarity', score: 5, notes: 'Very articulate and structured.' },
        ],
        generalNotes: 'Top-tier candidate with outstanding technical leadership. Strong recommendation for offer.',
        recommendation: 'Strong Yes',
        organization: organization._id,
      });
    }

    // 8. Saved Searches
    await SavedSearch.create({
      name: 'Senior React & Node Engineers (SF/Hybrid)',
      filters: {
        keyword: 'Full-Stack',
        skills: ['React', 'Node.js'],
        minExp: 4,
        maxExp: 15,
        minScore: 75,
        maxScore: 100,
        location: 'San Francisco',
      },
      organization: organization._id,
      createdBy: adminUser._id,
    });

    await SavedSearch.create({
      name: 'Kubernetes & AWS Lead Architects',
      filters: {
        keyword: 'DevOps',
        skills: ['Kubernetes', 'AWS', 'Terraform'],
        minExp: 5,
        minScore: 80,
      },
      organization: organization._id,
      createdBy: recruiterUser._id,
    });

    // 9. Notifications
    await Notification.create({
      user: adminUser._id,
      title: 'Batch Resume Processing Completed',
      message: 'Successfully screened 8 candidate resumes across active positions.',
      type: 'batch_completed',
      link: '/dashboard',
      organization: organization._id,
    });

    await Notification.create({
      user: adminUser._id,
      title: 'Technical Interview Tomorrow',
      message: 'Upcoming interview with Julian Sterling for Senior Full-Stack Engineer role.',
      type: 'candidate_review',
      link: '/interviews',
      organization: organization._id,
    });

    // 10. Audit Logs
    await AuditLog.create({
      organization: organization._id,
      user: adminUser._id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'Settings',
      entityId: organization._id,
      details: { message: 'Initialized database seed with 4 job openings, 8 candidates, and AI screening results.' },
    });

    await AuditLog.create({
      organization: organization._id,
      user: adminUser._id,
      action: 'JOB_CREATED',
      entityType: 'Job',
      entityId: jobFullStack._id,
      details: { title: jobFullStack.title },
    });

    console.log('--- Database Seeding Completed Successfully! ---');
    console.log('Login credentials:');
    console.log('Email: recruiter@hiresense.ai');
    console.log('Password: Password123!');
  } catch (err) {
    console.error('Database seeding failed:', err);
    throw err;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
