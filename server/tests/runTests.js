const assert = require('assert');
const { calculateFileHash } = require('../src/services/resumeParser/textExtractor');
const { extractSkillsFromText } = require('../src/services/skillExtractor/skillExtractor');
const { calculateCandidateMatch } = require('../src/services/matchingEngine/scoringEngine');
const { analyzeJobReadiness } = require('../src/services/jobIntelligence/jobAnalyzer');
const { aiProvider } = require('../src/services/matchingEngine/aiProvider');

async function runTestSuite() {
  console.log('\n=============================================');
  console.log('   RUNNING HIRESENSE AI BACKEND TEST SUITE   ');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name}`);
      console.error(e);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name}`);
      console.error(e);
      failed++;
    }
  }

  // 1. Hash Calculation
  test('SHA-256 Resume File Hash Calculation', () => {
    const bufferA = Buffer.from('Resume candidate John Doe React Node.js');
    const hashA = calculateFileHash(bufferA);
    const hashB = calculateFileHash(bufferA);
    assert.strictEqual(typeof hashA, 'string');
    assert.strictEqual(hashA.length, 64);
    assert.strictEqual(hashA, hashB, 'Hashes of identical buffers must match exactly');
  });

  // 2. Skill Extraction from Taxonomy
  test('Skill Extractor matches technical skills and extracts evidence', () => {
    const sampleResumeText = `
      Senior Software Engineer with 6 years experience.
      Architected scalable frontend solutions using React and TypeScript.
      Developed RESTful microservices with Node.js and PostgreSQL.
      Managed deployments using Docker on AWS cloud infrastructure.
    `;
    const skills = extractSkillsFromText(sampleResumeText);
    const names = skills.map((s) => s.name);

    assert(names.includes('React'), 'Should detect React');
    assert(names.includes('TypeScript'), 'Should detect TypeScript');
    assert(names.includes('Node.js'), 'Should detect Node.js');
    assert(names.includes('PostgreSQL'), 'Should detect PostgreSQL');
    assert(names.includes('Docker'), 'Should detect Docker');
    assert(names.includes('AWS'), 'Should detect AWS');

    const reactSkill = skills.find((s) => s.name === 'React');
    assert(reactSkill.evidence.length > 5, 'Evidence excerpt should be populated');
  });

  // 3. AI Matching & Weighted Scoring
  await testAsync('Explainable AI Matching Engine calculates weighted breakdown correctly', async () => {
    const candidate = {
      name: 'Test Candidate',
      totalExperienceYears: 6,
      skills: [
        { name: 'React', evidence: '6 years of React' },
        { name: 'Node.js', evidence: '5 years of Node.js' },
        { name: 'TypeScript', evidence: '4 years of TypeScript' },
        { name: 'PostgreSQL', evidence: '4 years of PostgreSQL' },
      ],
      educationTimeline: [{ degree: "Bachelor's Degree in CS" }],
    };

    const job = {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      minYearsExperience: 5,
      mandatorySkills: [
        { name: 'React' },
        { name: 'Node.js' },
        { name: 'TypeScript' },
        { name: 'PostgreSQL' },
      ],
      preferredSkills: [{ name: 'Docker' }],
      qualifications: ["Bachelor's Degree"],
    };

    const resumeText = 'Senior Full Stack Engineer with extensive experience in React, TypeScript, Node.js, and PostgreSQL databases.';
    const result = await calculateCandidateMatch(candidate, job, resumeText, {
      skills: 40,
      semantic: 30,
      experience: 20,
      qualification: 10,
    });

    assert(result.overallScore >= 75, `Expected score >= 75 for matching profile, got ${result.overallScore}`);
    assert.strictEqual(result.missingRequiredSkills.length, 0, 'Should have 0 missing mandatory skills');
    assert.strictEqual(result.matchedRequiredSkills.length, 4, 'Should have 4 matched mandatory skills');
    assert(result.componentScores.skillAlignment >= 80, 'Skill alignment score should be high');
    assert(result.supportingExcerpts.length > 0, 'Supporting evidence excerpts should be extracted');
  });

  // 4. Job Readiness Analyzer & Vague Wording Detection
  test('Job Readiness Analyzer detects missing elements and vague phrases', () => {
    const weakJob = {
      title: 'Rockstar Ninja Developer',
      rawDescription: 'We need a rockstar ninja who works hard play hard in a fast-paced environment for competitive salary.',
      mandatorySkills: [],
      responsibilities: [],
      minYearsExperience: 0,
      qualifications: [],
    };

    const analysis = analyzeJobReadiness(weakJob);
    assert.strictEqual(analysis.isReady, false, 'Weak job should not be ready');
    assert(analysis.clarityScore < 60, `Clarity score should be penalized, got ${analysis.clarityScore}`);
    assert(analysis.vaguePhrases.includes('rockstar'), 'Should flag rockstar');
    assert(analysis.vaguePhrases.includes('ninja'), 'Should flag ninja');
    assert(analysis.missingElements.length >= 3, 'Should list missing mandatory skills and responsibilities');
  });

  // 5. Semantic Similarity Fallback
  await testAsync('Local Vector Space Engine produces deterministic cosine similarity', async () => {
    const textA = 'React frontend web developer specializing in component architecture and state management';
    const textB = 'Looking for a React developer experienced in building modern frontend web user interfaces';
    const textC = 'Experienced diesel mechanic for heavy automotive equipment and hydraulic systems';

    const simAB = await aiProvider.calculateSimilarity(textA, textB);
    const simAC = await aiProvider.calculateSimilarity(textA, textC);

    assert(simAB > simAC, `Relevant documents (${simAB}) must have higher similarity than unrelated documents (${simAC})`);
  });

  console.log('\n=============================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
