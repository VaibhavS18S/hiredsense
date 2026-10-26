// Pure Node.js PDF Document Generator
// Zero external dependencies. Creates standard PDF 1.4 documents.

const fs = require('fs');
const path = require('path');

class SimplePDF {
  constructor() {
    this.objects = [];
    this.pages = [];
    this.fonts = {};
    this.pageWidth = 595.28;
    this.pageHeight = 841.89;
    this.currentPage = null;
  }

  addObject(content) {
    const objNum = this.objects.length + 1;
    this.objects.push({ num: objNum, content: content });
    return objNum;
  }

  addFont(name, baseFont) {
    const fontObjNum = this.addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /${baseFont} /Encoding /WinAnsiEncoding >>`);
    this.fonts[name] = { num: fontObjNum, baseFont };
    return fontObjNum;
  }

  addPage() {
    const page = {
      stream: [],
      y: 780,
      left: 45,
      right: 550,
      pageNumber: this.pages.length + 1
    };
    this.pages.push(page);
    this.currentPage = page;
    return page;
  }

  checkPageBreak(neededSpace) {
    if (this.currentPage.y - neededSpace < 55) {
      this.addPage();
    }
  }

  // Graphics commands
  setColorRGB(r, g, b, isFill = true) {
    const cmd = `${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} ${isFill ? 'rg' : 'RG'}`;
    this.currentPage.stream.push(cmd);
  }

  drawRect(x, y, w, h, fillColor = null, strokeColor = null, lineWidth = 1) {
    const ops = [];
    if (fillColor) {
      ops.push(`${(fillColor[0]/255).toFixed(3)} ${(fillColor[1]/255).toFixed(3)} ${(fillColor[2]/255).toFixed(3)} rg`);
    }
    if (strokeColor) {
      ops.push(`${lineWidth} w`);
      ops.push(`${(strokeColor[0]/255).toFixed(3)} ${(strokeColor[1]/255).toFixed(3)} ${(strokeColor[2]/255).toFixed(3)} RG`);
    }
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fillColor && strokeColor) {
      ops.push('B');
    } else if (fillColor) {
      ops.push('f');
    } else if (strokeColor) {
      ops.push('S');
    }
    this.currentPage.stream.push(ops.join('\n'));
  }

  drawLine(x1, y1, x2, y2, color = [226, 228, 222], lineWidth = 1) {
    const ops = [
      `${lineWidth} w`,
      `${(color[0]/255).toFixed(3)} ${(color[1]/255).toFixed(3)} ${(color[2]/255).toFixed(3)} RG`,
      `${x1.toFixed(2)} ${y1.toFixed(2)} m`,
      `${x2.toFixed(2)} ${y2.toFixed(2)} l`,
      'S'
    ];
    this.currentPage.stream.push(ops.join('\n'));
  }

  escapeText(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  drawText(text, x, y, fontName, size, colorRGB = [23, 26, 33]) {
    const escaped = this.escapeText(text);
    const ops = [
      'BT',
      `/${fontName} ${size} Tf`,
      `${(colorRGB[0]/255).toFixed(3)} ${(colorRGB[1]/255).toFixed(3)} ${(colorRGB[2]/255).toFixed(3)} rg`,
      `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
      `(${escaped}) Tj`,
      'ET'
    ];
    this.currentPage.stream.push(ops.join('\n'));
  }

  // High-level typography
  addHeader() {
    this.drawRect(45, this.currentPage.y - 10, 505, 34, [232, 240, 234]);
    this.drawRect(45, this.currentPage.y - 10, 505, 34, null, [209, 221, 212], 1);
    this.drawText('HIRESENSE AI  |  TALENT INTELLIGENCE PLATFORM', 56, this.currentPage.y + 6, 'F2', 8.5, [23, 107, 82]);
    this.drawText('CONFIDENTIAL & PROPRIETARY', 410, this.currentPage.y + 6, 'F1', 7.5, [97, 103, 115]);
    this.currentPage.y -= 45;
  }

  addTitle(title, subtitle) {
    this.checkPageBreak(120);
    // Badge
    this.drawRect(45, this.currentPage.y, 160, 18, [232, 240, 234]);
    this.drawText('OFFICIAL PRODUCT DOSSIER', 53, this.currentPage.y + 5, 'F2', 7.5, [23, 107, 82]);
    this.currentPage.y -= 30;

    // Title
    this.drawText(title, 45, this.currentPage.y, 'F2', 24, [23, 26, 33]);
    this.currentPage.y -= 20;

    // Subtitle
    this.drawText(subtitle, 45, this.currentPage.y, 'F1', 10.5, [85, 91, 102]);
    this.currentPage.y -= 25;

    // Meta box
    this.drawRect(45, this.currentPage.y - 12, 505, 36, [247, 247, 244], [226, 228, 222], 1);
    this.drawText('VERSION: v1.0.0 Production', 55, this.currentPage.y + 10, 'F2', 7.5, [97, 103, 115]);
    this.drawText('TECH STACK: MERN + Pluggable XAI', 55, this.currentPage.y - 4, 'F1', 8, [23, 26, 33]);
    this.drawText('REPO: github.com/VaibhavS18S/hiredsense', 230, this.currentPage.y + 10, 'F2', 7.5, [97, 103, 115]);
    this.drawText('BRANCH: main (Synced)', 230, this.currentPage.y - 4, 'F1', 8, [23, 107, 82]);
    this.drawText('TEST SUITE: 5/5 PASSED (100%)', 400, this.currentPage.y + 10, 'F2', 7.5, [97, 103, 115]);
    this.drawText('STATUS: Production Ready', 400, this.currentPage.y - 4, 'F2', 8, [23, 107, 82]);
    this.currentPage.y -= 45;
  }

  addSection(title) {
    this.checkPageBreak(50);
    this.currentPage.y -= 10;
    this.drawText(title, 45, this.currentPage.y, 'F2', 13, [23, 107, 82]);
    this.drawLine(45, this.currentPage.y - 5, 550, this.currentPage.y - 5, [226, 228, 222], 1.5);
    this.currentPage.y -= 20;
  }

  addSubSection(title) {
    this.checkPageBreak(35);
    this.drawText(title, 45, this.currentPage.y, 'F2', 10.5, [23, 26, 33]);
    this.currentPage.y -= 15;
  }

  addParagraph(text, font = 'F1', size = 9, color = [51, 56, 66], lineHeight = 13) {
    const words = text.split(' ');
    let currentLine = '';
    const maxCharsPerLine = 92;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
        this.checkPageBreak(lineHeight + 5);
        this.drawText(currentLine.trim(), 45, this.currentPage.y, font, size, color);
        this.currentPage.y -= lineHeight;
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine.trim().length > 0) {
      this.checkPageBreak(lineHeight + 5);
      this.drawText(currentLine.trim(), 45, this.currentPage.y, font, size, color);
      this.currentPage.y -= lineHeight;
    }
    this.currentPage.y -= 4; // paragraph spacing
  }

  addBullet(title, text) {
    this.checkPageBreak(25);
    // bullet dot
    this.drawRect(48, this.currentPage.y + 2, 4, 4, [23, 107, 82]);
    
    const fullText = (title ? `${title}: ` : '') + text;
    const words = fullText.split(' ');
    let currentLine = '';
    const maxChars = 85;
    let isFirstLine = true;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if ((currentLine + ' ' + word).trim().length > maxChars) {
        this.checkPageBreak(13);
        const indent = isFirstLine ? 58 : 58;
        this.drawText(currentLine.trim(), indent, this.currentPage.y, isFirstLine && title ? 'F2' : 'F1', 8.5, [51, 56, 66]);
        this.currentPage.y -= 12;
        currentLine = word;
        isFirstLine = false;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine.trim().length > 0) {
      this.checkPageBreak(13);
      this.drawText(currentLine.trim(), 58, this.currentPage.y, isFirstLine && title ? 'F2' : 'F1', 8.5, [51, 56, 66]);
      this.currentPage.y -= 12;
    }
    this.currentPage.y -= 2;
  }

  addCallout(title, text, isAmber = false) {
    this.checkPageBreak(50);
    const bgColor = isAmber ? [254, 249, 238] : [247, 247, 244];
    const borderColor = isAmber ? [217, 119, 6] : [23, 107, 82];
    const titleColor = isAmber ? [180, 83, 9] : [23, 107, 82];

    const boxHeight = 44;
    this.drawRect(45, this.currentPage.y - boxHeight + 14, 505, boxHeight, bgColor, [226, 228, 222], 1);
    this.drawRect(45, this.currentPage.y - boxHeight + 14, 4, boxHeight, borderColor);

    this.drawText(title, 56, this.currentPage.y, 'F2', 9, titleColor);
    this.drawText(text, 56, this.currentPage.y - 14, 'F1', 8, [51, 56, 66]);
    this.currentPage.y -= (boxHeight + 8);
  }

  addTable(headers, rows, colWidths) {
    const rowHeight = 18;
    const needed = (rows.length + 1) * rowHeight + 15;
    this.checkPageBreak(Math.min(needed, 100));

    // Headers
    let startX = 45;
    this.drawRect(45, this.currentPage.y - rowHeight + 12, 505, rowHeight, [232, 240, 234], [209, 221, 212], 1);
    for (let c = 0; c < headers.length; c++) {
      this.drawText(headers[c], startX + 6, this.currentPage.y - 2, 'F2', 7.5, [23, 107, 82]);
      startX += colWidths[c];
    }
    this.currentPage.y -= rowHeight;

    // Rows
    for (let r = 0; r < rows.length; r++) {
      this.checkPageBreak(rowHeight + 10);
      const row = rows[r];
      startX = 45;
      const isEven = r % 2 === 0;
      const bg = isEven ? [255, 255, 255] : [247, 247, 244];
      this.drawRect(45, this.currentPage.y - rowHeight + 12, 505, rowHeight, bg, [226, 228, 222], 0.7);

      for (let c = 0; c < row.length; c++) {
        const cellText = String(row[c]);
        this.drawText(cellText.length > 34 ? cellText.substring(0, 31) + '...' : cellText, startX + 6, this.currentPage.y - 2, c === 0 ? 'F2' : 'F1', 7.5, [23, 26, 33]);
        startX += colWidths[c];
      }
      this.currentPage.y -= rowHeight;
    }
    this.currentPage.y -= 10;
  }

  compile() {
    // 1. Build Pages Object
    const pageRefs = [];
    const contentRefs = [];

    // First, compile content streams for each page
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];

      // Add footer to page
      const footerOps = [
        'BT',
        '/F1 7.5 Tf',
        '0.55 0.57 0.60 rg',
        `1 0 0 1 45 35 Tm`,
        `(HireSense AI Platform Dossier - github.com/VaibhavS18S/hiredsense) Tj`,
        `1 0 0 1 480 35 Tm`,
        `(Page ${i + 1} of ${this.pages.length}) Tj`,
        'ET'
      ];
      page.stream.push(footerOps.join('\n'));

      const streamContent = page.stream.join('\n');
      const streamLen = Buffer.byteLength(streamContent, 'utf-8');
      const streamObj = `<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`;
      const streamObjNum = this.addObject(streamObj);
      contentRefs.push(streamObjNum);
    }

    // Allocate Pages and Page objects
    const pagesObjNum = this.objects.length + 1; // placeholder

    for (let i = 0; i < this.pages.length; i++) {
      const pageObjNum = this.objects.length + 1;
      pageRefs.push(pageObjNum);
      const pageObjContent = `<< /Type /Page /Parent ${pagesObjNum + this.pages.length} 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Resources << /Font << /F1 ${this.fonts['F1'].num} 0 R /F2 ${this.fonts['F2'].num} 0 R /F3 ${this.fonts['F3'].num} 0 R >> >> /Contents ${contentRefs[i]} 0 R >>`;
      this.addObject(pageObjContent);
    }

    // Now add Catalog and Pages
    const actualPagesObjNum = this.addObject(`<< /Type /Pages /Kids [${pageRefs.map(num => `${num} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`);
    const catalogObjNum = this.addObject(`<< /Type /Catalog /Pages ${actualPagesObjNum} 0 R >>`);

    // Fix up parent reference for pages if needed (we point to actualPagesObjNum)
    for (let i = 0; i < pageRefs.length; i++) {
      const pIdx = pageRefs[i] - 1;
      this.objects[pIdx].content = this.objects[pIdx].content.replace(/Parent \d+ 0 R/, `Parent ${actualPagesObjNum} 0 R`);
    }

    // Serialize to PDF Buffer
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [];

    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      offsets.push(Buffer.byteLength(out, 'utf-8'));
      out += `${obj.num} 0 obj\n${obj.content}\nendobj\n`;
    }

    const startXref = Buffer.byteLength(out, 'utf-8');
    out += `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 0; i < offsets.length; i++) {
      const offStr = String(offsets[i]).padStart(10, '0');
      out += `${offStr} 00000 n \n`;
    }

    out += `trailer\n<< /Size ${this.objects.length + 1} /Root ${catalogObjNum} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    return Buffer.from(out, 'utf-8');
  }
}

// Generate HireSense AI Full Document
const pdf = new SimplePDF();
pdf.addFont('F1', 'Helvetica');
pdf.addFont('F2', 'Helvetica-Bold');
pdf.addFont('F3', 'Courier');

// Page 1
pdf.addPage();
pdf.addHeader();
pdf.addTitle('HireSense AI Platform Dossier', 'AI-Powered Resume Intelligence, Explainable Matching & Talent Acquisition SaaS');

pdf.addSection('1. Executive Overview & Problem Statement');
pdf.addParagraph('HireSense AI is a full-stack, enterprise-style talent acquisition platform built using the MERN stack (MongoDB, Express, React, Node.js) combined with Explainable AI (XAI) and natural language processing. The product addresses fundamental failures in modern recruitment software: black-box algorithms, opaque rejection criteria, and keyword-stuffing exploits.');
pdf.addParagraph('Unlike generic ATS tools that act as silent gatekeepers, HireSense AI maintains a strict Human-in-the-Loop policy. The platform calculates match scores from verifiable evidence, extracts direct textual citations from resumes, highlights candidate skill gaps, and equips hiring teams with side-by-side comparisons, Kanban pipelines, and interview rubrics.');

pdf.addCallout('Design Philosophy: Distinctive Editorial Aesthetics', 'Designed with a warm off-white canvas (#F7F7F4), deep obsidian ink typography (#171A21), dark forest-green accents (#176B52), and sage surfaces (#E8F0EA), deliberately rejecting generic neon purple gradients and hollow glassmorphism.');

pdf.addSection('2. End-to-End Recruitment Workflow (6-Stage Pipeline)');
pdf.addParagraph('The platform organizes candidate screening into a structured, automated six-stage lifecycle:');
pdf.addBullet('1. Upload & Ingestion', 'Batch upload supporting PDF, DOCX, and TXT files with SHA-256 duplicate detection.');
pdf.addBullet('2. Text Extraction', 'Robust streaming extraction via pdf-parse and mammoth, isolating header, body, and contact.');
pdf.addBullet('3. Information Parsing', 'Determines tenure dates, educational credentials, phone numbers, emails, and links.');
pdf.addBullet('4. Taxonomy Mapping', 'Extracts skills across 8 technical domains using a 500+ term regex boundary engine.');
pdf.addBullet('5. XAI Scoring Engine', 'Calculates 4-part weighted score with verbatim textual citations for every matched requirement.');
pdf.addBullet('6. Recruiter Review', 'Enables human verification, manual score adjustments, notes, and pipeline stage movement.');

// Page 2
pdf.addPage();
pdf.addHeader();
pdf.addSection('3. Core Application Modules (Detailed Feature Breakdown)');

pdf.addSubSection('Module A: Executive Recruitment Dashboard');
pdf.addParagraph('The central command center provides real-time recruitment KPIs calculated directly from persistent database records: Active Job Openings, Total Candidates Processed, Review Backlog, Shortlist Conversion Rate, Average Time-to-Shortlist, and historical screening volume trends visualized with interactive Recharts area graphs.');

pdf.addSubSection('Module B: Job Intelligence & Readiness Analyzer');
pdf.addParagraph('Allows hiring teams to create, edit, duplicate, and analyze job descriptions. Includes an automated 0-100% Job Readiness Score that evaluates criteria clarity, role responsibilities, and mandatory competencies before publishing. A built-in Buzzword Detector flags non-informative clichés (e.g., "rockstar", "ninja", "guru") and suggests concrete competency definitions. Recruiters can also click "AI Enhance" to generate structured job criteria.');

pdf.addSubSection('Module C: Smart Resume Processing Center');
pdf.addParagraph('Equipped with a bulk drag-and-drop interface supporting PDF and DOCX documents up to 15MB. Calculates SHA-256 fingerprints to prevent duplicate processing, shows real-time multi-stage progress bars, and alerts recruiters if a scanned document or corrupt file requires optical character recognition.');

pdf.addSubSection('Module D: Explainable AI Matching Engine & Evidence Extraction');
pdf.addParagraph('Eliminates guesswork by decomposing candidate-job alignment into four normalized, auditable components with configurable administrative weights:');

pdf.addTable(
  ['Scoring Dimension', 'Default Weight', 'Measurement Method', 'Evidence Provided'],
  [
    ['Skill Alignment', '40%', 'Mandatory (85% base) + Preferred (15%)', 'Verbatim resume quotes & citations'],
    ['Semantic Fit', '30%', 'Vector cosine similarity (TF-IDF / HF)', 'Distance score & semantic correlation'],
    ['Relevant Experience', '20%', 'Parsed employment years vs threshold', 'Timeline verification & job tenure'],
    ['Qualifications', '10%', 'Degree hierarchy (BS, MS, PhD) & major', 'Degree level, major & institution']
  ],
  [120, 80, 150, 155]
);

pdf.addSubSection('Module E: Side-by-Side Candidate Comparison Studio');
pdf.addParagraph('Enables recruiters to select between 2 and 4 applicants and view them in a synchronized matrix comparing match score breakdowns, skill coverage, total experience, educational credentials, and missing prerequisites to facilitate balanced hiring discussions.');

// Page 3
pdf.addPage();
pdf.addHeader();
pdf.addSubSection('Module F: 7-Stage Drag-and-Drop Recruitment Kanban Board');
pdf.addParagraph('Organizes applicants across 7 pipeline columns: New -> Screening -> Shortlisted -> Interview -> Offer -> Hired -> Rejected. Features smooth HTML5 drag-and-drop, multi-candidate bulk actions, candidate counts by stage, stage duration metrics, and an instantaneous Undo button to reverse accidental transitions.');

pdf.addSubSection('Module G: Talent Pool & Faceted Search');
pdf.addParagraph('Enables recruitment teams to search historical applicants across all past postings using full-text keyword indexing, minimum experience sliders, categorized skill pills, and saved search query presets.');

pdf.addSubSection('Module H: Gap-Targeted Interview Intelligence');
pdf.addParagraph('Analyzes missing mandatory skills and weak competency areas for shortlisted candidates, dynamically generating tailored technical and behavioral interview questions. Interviewers can grade candidates using a standardized 1-5 evaluation rubric (Technical Competency, Problem Solving, Communication, and Team Fit).');

pdf.addSubSection('Module I: Reports, Analytics & CSV Export');
pdf.addParagraph('Generates recruitment funnel conversion charts, skill distribution graphs across candidate pools, and exports filtered candidate rankings to standardized CSV spreadsheets.');

pdf.addSubSection('Module J: Privacy, GDPR & Blind Screening');
pdf.addParagraph('Features an unconscious-bias toggle ("Blind Screening") that hides candidate names, photos, emails, phone numbers, and gender markers during initial screening. Includes automated data retention rules (90/180/365 days) and GDPR Right-to-be-Forgotten candidate record purging.');

pdf.addSection('4. Technical Architecture & Zero-Dependency Design');
pdf.addTable(
  ['Layer', 'Technologies', 'Purpose & Resilience'],
  [
    ['Frontend', 'React 18, Vite, Tailwind CSS, Recharts', '20 client routes, responsive editorial layout'],
    ['Backend API', 'Node.js v20, Express.js, Multer', '12 REST controllers, cookie sessions, JWT'],
    ['Database', 'MongoDB Atlas + MongoMemoryServer', 'Dual-mode: cloud cluster or local in-memory'],
    ['AI Engine', 'Pluggable: Hugging Face / Local TF-IDF', 'Sentence vector cosine similarity matching'],
    ['Validation', 'Zod, bcryptjs, SHA-256 Crypto', 'Payload validation, password hashing, deduplication']
  ],
  [100, 185, 220]
);

// Page 4
pdf.addPage();
pdf.addHeader();
pdf.addSection('5. Verification Test Suite Results');
pdf.addParagraph('The automated backend test suite (server/tests/runTests.js) asserts core algorithmic correctness across 5 test suites:');

pdf.addTable(
  ['Test Suite', 'Function Under Test', 'Specification', 'Status'],
  [
    ['SHA-256 Fingerprinting', 'calculateHash()', 'Duplicate file detection & hash integrity', '100% PASSED'],
    ['Skill Extractor', 'extractSkills()', 'Boundary detection of C++, C#, React, Node', '100% PASSED'],
    ['Explainable Matching', 'calculateMatchScore()', '4-component weighted formula & evidence', '100% PASSED'],
    ['Job Readiness Analyzer', 'analyzeJobDescription()', 'Readiness score & buzzword identification', '100% PASSED'],
    ['Vector Cosine Engine', 'calculateCosineSimilarity()', 'Semantic text vector distance calculations', '100% PASSED']
  ],
  [120, 110, 195, 80]
);

pdf.addSection('6. Quick-Start Execution Guide');
pdf.addCallout('Pre-Seeded Recruiter Credentials', 'URL: http://localhost:5173  |  Email: recruiter@hiresense.ai  |  Password: Password123!', true);

pdf.addParagraph('Follow these commands to boot the complete application locally:');
pdf.addBullet('Start Backend API', 'cd c:\\HCL_TRAINING\\server && npm run dev (Runs on port 5000)');
pdf.addBullet('Start Frontend Client', 'cd c:\\HCL_TRAINING\\client && npm run dev (Runs on port 5173)');
pdf.addBullet('Run Automated Tests', 'cd c:\\HCL_TRAINING\\server && node tests/runTests.js');

pdf.addSection('7. Source Code & GitHub Repository');
pdf.addParagraph('The entire source tree, frontend components, server controllers, seed data, sample resumes, and automated test suite have been initialized, committed, and pushed to GitHub:');
pdf.addBullet('Repository Link', 'https://github.com/VaibhavS18S/hiredsense.git');
pdf.addBullet('Active Branch', 'main');
pdf.addBullet('Sample Resumes for Testing', 'Located in sample_resumes/ (alex_morgan_fullstack.txt, sarah_jenkins_devops.txt, marcus_reed_designer.txt)');

// Write PDF to disk
const pdfBuffer = pdf.compile();
const outputPath = path.join(__dirname, 'HireSense_AI_Documentation.pdf');
fs.writeFileSync(outputPath, pdfBuffer);
console.log(`[SUCCESS] PDF successfully written to ${outputPath} (${pdfBuffer.length} bytes, ${pdf.pages.length} pages)`);
