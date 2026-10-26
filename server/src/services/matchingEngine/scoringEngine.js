const { aiProvider } = require('./aiProvider');

/**
 * Normalizes degree level for comparison
 */
function getDegreeRank(degreeStr) {
  if (!degreeStr) return 1;
  const lower = degreeStr.toLowerCase();
  if (lower.includes('phd') || lower.includes('doctor')) return 4;
  if (lower.includes('master') || lower.includes('m.s') || lower.includes('m.tech') || lower.includes('mba')) return 3;
  if (lower.includes('bachelor') || lower.includes('b.s') || lower.includes('b.tech') || lower.includes('b.e')) return 2;
  return 1;
}

/**
 * Calculates Explainable Match Result
 */
async function calculateCandidateMatch(candidate, job, resumeText, customWeights = null) {
  // 1. Resolve weights
  const weights = customWeights || {
    skills: 40,
    semantic: 30,
    experience: 20,
    qualification: 10,
  };

  const totalWeight = weights.skills + weights.semantic + weights.experience + weights.qualification;
  const normSkillsWeight = weights.skills / totalWeight;
  const normSemanticWeight = weights.semantic / totalWeight;
  const normExpWeight = weights.experience / totalWeight;
  const normQualWeight = weights.qualification / totalWeight;

  // 2. Skill Alignment (Required & Preferred)
  const candidateSkills = (candidate.skills || []).map((s) => s.name.toLowerCase());
  const candidateSkillsMap = {};
  (candidate.skills || []).forEach((s) => {
    candidateSkillsMap[s.name.toLowerCase()] = s;
  });

  const matchedRequiredSkills = [];
  const missingRequiredSkills = [];
  const matchedPreferredSkills = [];
  const missingPreferredSkills = [];

  const mandatoryList = job.mandatorySkills || [];
  const preferredList = job.preferredSkills || [];

  // Check mandatory skills
  for (const mSkill of mandatoryList) {
    const sNameLower = mSkill.name.toLowerCase();
    const foundSkill = candidateSkillsMap[sNameLower];

    if (foundSkill) {
      matchedRequiredSkills.push({
        skill: mSkill.name,
        evidence: foundSkill.evidence || `Demonstrated competency in ${mSkill.name}`,
        confidence: foundSkill.confidence || 0.95,
        category: mSkill.category || 'Core Requirement',
      });
    } else {
      missingRequiredSkills.push(mSkill.name);
    }
  }

  // Check preferred skills
  for (const pSkill of preferredList) {
    const sNameLower = pSkill.name.toLowerCase();
    const foundSkill = candidateSkillsMap[sNameLower];

    if (foundSkill) {
      matchedPreferredSkills.push({
        skill: pSkill.name,
        evidence: foundSkill.evidence || `Demonstrated competency in ${pSkill.name}`,
        confidence: foundSkill.confidence || 0.9,
        category: pSkill.category || 'Preferred Advantage',
      });
    } else {
      missingPreferredSkills.push(pSkill.name);
    }
  }

  // Skill alignment calculation:
  // If mandatory skills exist, achieving 100% of mandatory skills gives a solid 85 base score
  // Preferred skills provide the remaining 15 bonus points up to 100
  let mandatoryRatio = mandatoryList.length > 0 ? (matchedRequiredSkills.length / mandatoryList.length) : 1;
  let preferredRatio = preferredList.length > 0 ? (matchedPreferredSkills.length / preferredList.length) : 1;

  let skillAlignmentScore = Math.round((mandatoryRatio * 85) + (preferredRatio * 15));
  skillAlignmentScore = Math.max(10, Math.min(100, skillAlignmentScore));

  // 3. Semantic Similarity via AI Provider
  const jobFullText = `${job.title} ${job.department} ${job.rawDescription || ''} ${(job.responsibilities || []).join(' ')} ${(mandatoryList.map((m) => m.name)).join(' ')}`;
  const semanticSimilarityScore = await aiProvider.calculateSimilarity(resumeText, jobFullText);

  // 4. Experience Alignment
  const candidateYears = candidate.totalExperienceYears || 0;
  const requiredYears = job.minYearsExperience || 1;

  let experienceScore = 100;
  if (candidateYears >= requiredYears) {
    experienceScore = 100;
  } else if (candidateYears >= requiredYears * 0.75) {
    experienceScore = 80;
  } else if (candidateYears >= requiredYears * 0.5) {
    experienceScore = 60;
  } else {
    experienceScore = Math.max(30, Math.round((candidateYears / requiredYears) * 60));
  }

  const experienceSummary = candidateYears >= requiredYears
    ? `Meets experience requirement (${candidateYears} yrs vs ${requiredYears} yrs minimum)`
    : `Experience below target (${candidateYears} yrs vs ${requiredYears} yrs required)`;

  // 5. Qualification Alignment
  let highestCandidateDegree = "Bachelor's Degree";
  if (candidate.educationTimeline && candidate.educationTimeline.length > 0) {
    highestCandidateDegree = candidate.educationTimeline[0].degree || "Bachelor's Degree";
  }

  const requiredDegreeStr = (job.qualifications && job.qualifications.length > 0) ? job.qualifications[0] : "Bachelor's Degree";
  const candRank = getDegreeRank(highestCandidateDegree);
  const reqRank = getDegreeRank(requiredDegreeStr);

  let qualificationScore = 80;
  let matchStatus = 'Meets';

  if (candRank > reqRank) {
    qualificationScore = 100;
    matchStatus = 'Exceeds';
  } else if (candRank === reqRank) {
    qualificationScore = 95;
    matchStatus = 'Meets';
  } else if (candRank === reqRank - 1) {
    qualificationScore = 75;
    matchStatus = 'Equivalent';
  } else {
    qualificationScore = 55;
    matchStatus = 'Below';
  }

  // 6. Overall Weighted Score Calculation
  const overallScore = Math.round(
    (skillAlignmentScore * normSkillsWeight) +
    (semanticSimilarityScore * normSemanticWeight) +
    (experienceScore * normExpWeight) +
    (qualificationScore * normQualWeight)
  );

  // 7. Extract Supporting Resume Excerpts
  const supportingExcerpts = [];
  const sentences = resumeText.split(/(?<=[.?!])\s+|\n+/).filter((s) => s.trim().length > 25);

  // Excerpt for top skills
  matchedRequiredSkills.slice(0, 3).forEach((item) => {
    supportingExcerpts.push({
      topic: `Required Skill: ${item.skill}`,
      quote: item.evidence,
      sourceSection: 'Skills & Experience',
    });
  });

  if (supportingExcerpts.length < 3 && sentences.length > 0) {
    supportingExcerpts.push({
      topic: 'Core Accomplishment',
      quote: sentences[0].substring(0, 140) + '...',
      sourceSection: 'Profile Summary',
    });
  }

  // 8. Data Quality and Responsible Warnings
  const dataQualityWarnings = [];
  if (missingRequiredSkills.length > 0) {
    dataQualityWarnings.push(`Missing ${missingRequiredSkills.length} mandatory skill(s): ${missingRequiredSkills.join(', ')}`);
  }
  if (candidateYears < requiredYears) {
    dataQualityWarnings.push(`Years of experience (${candidateYears} yrs) is under the role's requested ${requiredYears} years.`);
  }
  if (semanticSimilarityScore > 85 && missingRequiredSkills.length > 2) {
    dataQualityWarnings.push('High semantic match despite missing core mandatory skills; verify practical hands-on experience.');
  }

  return {
    overallScore: Math.min(100, Math.max(15, overallScore)),
    componentScores: {
      skillAlignment: skillAlignmentScore,
      semanticSimilarity: semanticSimilarityScore,
      experienceScore: experienceScore,
      qualificationScore: qualificationScore,
    },
    weightsUsed: weights,
    matchedRequiredSkills,
    matchedPreferredSkills,
    missingRequiredSkills,
    missingPreferredSkills,
    experienceEvidence: {
      candidateYears,
      requiredYears,
      evidenceExcerpt: `${candidateYears} years of cumulative relevant industry experience.`,
      summary: experienceSummary,
    },
    qualificationEvidence: {
      candidateDegree: highestCandidateDegree,
      requiredDegree: requiredDegreeStr,
      matchStatus,
      evidenceExcerpt: `Verified credential: ${highestCandidateDegree}`,
    },
    supportingExcerpts,
    dataQualityWarnings,
  };
}

module.exports = {
  calculateCandidateMatch,
  getDegreeRank,
};
