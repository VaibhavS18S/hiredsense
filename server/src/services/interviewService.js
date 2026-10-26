/**
 * Interview Intelligence Service
 * Generates tailored technical, behavioral, and gap-probing interview questions.
 */

function generateInterviewQuestions(job, candidate, screeningResult) {
  const questions = [];

  // 1. Technical Core questions based on job mandatory skills
  const mandatorySkills = (job.mandatorySkills || []).map((s) => s.name);
  if (mandatorySkills.includes('React') || mandatorySkills.includes('Frontend')) {
    questions.push({
      category: 'Technical Core',
      targetSkillOrGap: 'React Architecture',
      question: 'How do you design state management and component boundaries in complex data-intensive React dashboards to prevent unnecessary re-renders?',
      context: 'Candidate claims strong React experience; evaluate their mental model of the virtual DOM and rendering cycles.',
      sampleRubric: '1: Only knows basic useState. 3: Understands useMemo/useCallback and context caveats. 5: Deep architectural expertise in state colocation and profiling.',
    });
  }

  if (mandatorySkills.includes('Node.js') || mandatorySkills.includes('Backend')) {
    questions.push({
      category: 'Technical Core',
      targetSkillOrGap: 'Node.js Asynchrony & Scaling',
      question: 'Can you walk us through the Node.js Event Loop phases, and how you would diagnose a CPU-bound bottleneck freezing I/O requests?',
      context: 'Tests deep knowledge of single-threaded event-driven execution vs worker threads.',
      sampleRubric: '1: Vague explanation. 3: Explains microtasks vs macrotasks. 5: Outlines precise clustering, worker threads, and flame graph debugging.',
    });
  }

  if (mandatorySkills.includes('Kubernetes') || mandatorySkills.includes('Docker') || mandatorySkills.includes('Cloud & DevOps')) {
    questions.push({
      category: 'Technical Core',
      targetSkillOrGap: 'Container Orchestration & High Availability',
      question: 'Explain your strategy for implementing zero-downtime rolling updates with Kubernetes, including liveness and readiness probe configurations.',
      context: 'Core infrastructure reliability question.',
      sampleRubric: '1: Mentions restart only. 3: Knows deployment spec and probes. 5: Explains PodDisruptionBudgets, graceful termination lifecycle (SIGTERM/preStop), and canary releases.',
    });
  }

  // 2. Behavioral & Leadership questions based on job responsibilities
  questions.push({
    category: 'Behavioral & Leadership',
    targetSkillOrGap: 'Conflict & Architecture Decision',
    question: 'Describe a situation where you had a fundamental disagreement with another engineer or stakeholder over a technical trade-off. How did you resolve it?',
    context: 'Assesses collaborative problem-solving, empathy, and evidence-based decision making.',
    sampleRubric: '1: Blamed others or conceded without rationale. 3: Used data and compromised. 5: Led an objective spike/RFC process that unified team alignment.',
  });

  // 3. Skill-Gap Investigation questions!
  const missingSkills = (screeningResult && screeningResult.missingRequiredSkills) ? screeningResult.missingRequiredSkills : [];
  if (missingSkills.length > 0) {
    missingSkills.slice(0, 2).forEach((skill) => {
      questions.push({
        category: 'Skill-Gap Investigation',
        targetSkillOrGap: `Gap: ${skill}`,
        question: `The role expects hands-on capability in ${skill}, which was not prominently highlighted on your resume. Could you share your familiarity or how you quickly adapt to related paradigms?`,
        context: 'Verifies whether the skill is genuinely absent or simply omitted from the written resume.',
        sampleRubric: '1: No awareness or willingness to learn. 3: Transferred conceptual knowledge from similar stack. 5: Shows working knowledge or rapid learning agility.',
      });
    });
  }

  // Ensure at least 4 questions
  if (questions.length < 4) {
    questions.push({
      category: 'Technical Core',
      targetSkillOrGap: 'System Reliability & Monitoring',
      question: 'How do you monitor distributed applications in production, and how do you establish SLOs/SLAs that actually protect user experience?',
      context: 'General enterprise engineering competency.',
      sampleRubric: '1: Relies on ad-hoc console logs. 3: Knows APM and alerts. 5: Implements structured telemetry (metrics, traces, logs) and automated circuit breaking.',
    });
  }

  return questions;
}

const DEFAULT_RUBRIC_CRITERIA = [
  { criteria: 'Technical Competence & Depth', score: 4, notes: '' },
  { criteria: 'System Architecture & Problem Solving', score: 4, notes: '' },
  { criteria: 'Communication & Structural Clarity', score: 4, notes: '' },
  { criteria: 'Domain & Cultural Alignment', score: 4, notes: '' },
];

module.exports = {
  generateInterviewQuestions,
  DEFAULT_RUBRIC_CRITERIA,
};
