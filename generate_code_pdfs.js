// Script to generate source code PDFs in organized folders
const fs = require('fs');
const path = require('path');

class CodePDF {
  constructor(title, subtitle, authorInfo) {
    this.title = title;
    this.subtitle = subtitle || '';
    this.authorInfo = authorInfo || 'Vaibhav Srivastava (2400320101215) • ABES Engineering College';
    this.objects = [];
    this.pages = [];
    this.fonts = {};
    this.pageWidth = 595.28;
    this.pageHeight = 841.89;
    this.currentPage = null;

    // Default fonts
    this.addFont('F1', 'Helvetica');
    this.addFont('F2', 'Helvetica-Bold');
    this.addFont('F3', 'Courier');
    this.addFont('F4', 'Courier-Bold');
  }

  addObject(content) {
    const objNum = this.objects.length + 1;
    this.objects.push({ num: objNum, content });
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
      y: 775,
      pageNumber: this.pages.length + 1,
    };
    this.pages.push(page);
    this.currentPage = page;

    // Header on every page
    this.drawHeader();
    return page;
  }

  checkPageBreak(neededSpace) {
    if (this.currentPage.y - neededSpace < 50) {
      this.addPage();
    }
  }

  escapeText(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
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
    if (fillColor && strokeColor) ops.push('B');
    else if (fillColor) ops.push('f');
    else if (strokeColor) ops.push('S');
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

  drawText(text, x, y, fontName, size, colorRGB = [23, 26, 33]) {
    const sanitized = this.escapeText(text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''));
    const ops = [
      'BT',
      `/${fontName} ${size} Tf`,
      `${(colorRGB[0]/255).toFixed(3)} ${(colorRGB[1]/255).toFixed(3)} ${(colorRGB[2]/255).toFixed(3)} rg`,
      `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
      `(${sanitized}) Tj`,
      'ET'
    ];
    this.currentPage.stream.push(ops.join('\n'));
  }

  drawHeader() {
    // Top border banner
    this.drawRect(40, 800, 515, 20, [247, 247, 244], [226, 228, 222], 0.7);
    this.drawText(`HIRESENSE AI SOURCE CODE: ${this.title}`, 46, 806, 'F2', 7.5, [23, 107, 82]);
    this.drawText(this.authorInfo, 330, 806, 'F1', 6.5, [100, 105, 115]);
    this.currentPage.y = 780;
  }

  drawFooter(pageNum, totalPages) {
    this.drawLine(40, 36, 555, 36, [226, 228, 222], 0.7);
    this.drawText('HireSense AI • Explainable Resume Intelligence Platform (HCL Capstone Project)', 40, 24, 'F1', 7, [120, 125, 135]);
    this.drawText(`Page ${pageNum} of ${totalPages}`, 505, 24, 'F2', 7, [23, 107, 82]);
  }

  addFileMetadata(filePath, lineCount, sizeBytes, description) {
    this.checkPageBreak(70);
    this.drawRect(40, this.currentPage.y - 50, 515, 54, [240, 247, 244], [180, 215, 200], 1);
    this.drawText(`FILE: ${filePath}`, 50, this.currentPage.y - 12, 'F2', 9, [23, 107, 82]);
    this.drawText(`LINES: ${lineCount}  |  SIZE: ${(sizeBytes / 1024).toFixed(1)} KB  |  LANGUAGE: ${path.extname(filePath).toUpperCase().replace('.', '')}`, 50, this.currentPage.y - 25, 'F1', 7.5, [51, 56, 66]);
    this.drawText(`MODULE: ${description}`, 50, this.currentPage.y - 38, 'F1', 7.5, [85, 91, 102]);
    this.currentPage.y -= 64;
  }

  addCode(sourceCode) {
    const rawLines = sourceCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const lineHeight = 10;
    const maxCharsPerLine = 88;

    for (let i = 0; i < rawLines.length; i++) {
      const lineNumStr = String(i + 1).padStart(4, ' ') + ' | ';
      let codeText = rawLines[i].replace(/\t/g, '  ');

      // Wrap lines longer than maxCharsPerLine
      let firstChunk = true;
      while (codeText.length > 0 || firstChunk) {
        this.checkPageBreak(lineHeight + 2);

        const currentChunk = codeText.substring(0, maxCharsPerLine);
        codeText = codeText.substring(maxCharsPerLine);

        // Draw line number box or continuation
        if (firstChunk) {
          this.drawText(lineNumStr, 40, this.currentPage.y, 'F4', 7, [140, 145, 155]);
          const isComment = currentChunk.trim().startsWith('//') || currentChunk.trim().startsWith('/*') || currentChunk.trim().startsWith('*');
          const isKeyword = /^(const|let|var|function|import|export|class|async|await|return|if|else|switch|case|default|try|catch|throw)\b/.test(currentChunk.trim());
          
          let codeColor = [23, 26, 33]; // default ink
          if (isComment) codeColor = [110, 130, 120];
          else if (isKeyword) codeColor = [18, 95, 75];

          this.drawText(currentChunk, 74, this.currentPage.y, 'F3', 7, codeColor);
        } else {
          // Continuation indent
          this.drawText('     > ', 40, this.currentPage.y, 'F3', 6.5, [180, 185, 195]);
          this.drawText(currentChunk, 74, this.currentPage.y, 'F3', 7, [50, 55, 65]);
        }

        this.currentPage.y -= lineHeight;
        firstChunk = false;
        if (codeText.length === 0) break;
      }
    }
  }

  compile() {
    const totalPages = this.pages.length;
    const pageRefs = [];
    const contentRefs = [];

    // Add footers & build content streams
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      this.currentPage = page;
      this.drawFooter(i + 1, totalPages);

      const streamContent = page.stream.join('\n');
      const streamLen = Buffer.byteLength(streamContent, 'utf-8');
      const streamObj = `<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`;
      contentRefs.push(this.addObject(streamObj));
    }

    const pagesObjNum = this.objects.length + 1;
    for (let i = 0; i < this.pages.length; i++) {
      const pageObjNum = this.objects.length + 1;
      pageRefs.push(pageObjNum);
      const pageObjContent = `<< /Type /Page /Parent ${pagesObjNum + this.pages.length} 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Resources << /Font << /F1 ${this.fonts['F1'].num} 0 R /F2 ${this.fonts['F2'].num} 0 R /F3 ${this.fonts['F3'].num} 0 R /F4 ${this.fonts['F4'].num} 0 R >> >> /Contents ${contentRefs[i]} 0 R >>`;
      this.addObject(pageObjContent);
    }

    const actualPagesObjNum = this.addObject(`<< /Type /Pages /Kids [${pageRefs.map(n => `${n} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`);
    const catalogObjNum = this.addObject(`<< /Type /Catalog /Pages ${actualPagesObjNum} 0 R >>`);

    for (let i = 0; i < pageRefs.length; i++) {
      const pIdx = pageRefs[i] - 1;
      this.objects[pIdx].content = this.objects[pIdx].content.replace(/Parent \d+ 0 R/, `Parent ${actualPagesObjNum} 0 R`);
    }

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
      out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    out += `trailer\n<< /Size ${this.objects.length + 1} /Root ${catalogObjNum} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    return Buffer.from(out, 'utf-8');
  }
}

// Function to generate an individual code PDF
function generateSourcePDF(sourcePath, outputDir, category, description) {
  if (!fs.existsSync(sourcePath)) {
    console.warn(`[SKIP] Missing file: ${sourcePath}`);
    return null;
  }

  const content = fs.readFileSync(sourcePath, 'utf8');
  const fileName = path.basename(sourcePath);
  const pdfName = `${fileName}.pdf`;
  const outPath = path.join(outputDir, pdfName);

  const pdf = new CodePDF(
    fileName,
    `${category} • ${description}`,
    'Vaibhav Srivastava (Roll: 2400320101215) • Mentor: Anshul Tickoo'
  );

  pdf.addPage();
  const lineCount = content.split('\n').length;
  const sizeBytes = Buffer.byteLength(content, 'utf8');
  pdf.addFileMetadata(sourcePath, lineCount, sizeBytes, description);
  pdf.addCode(content);

  const buffer = pdf.compile();
  fs.writeFileSync(outPath, buffer);
  console.log(`[SUCCESS] Wrote: ${outPath} (${buffer.length} bytes, ${pdf.pages.length} pages)`);
  return { path: outPath, pages: pdf.pages.length, lines: lineCount };
}

// Master execution
function buildAllSourcePDFs() {
  const rootDir = 'C:\\HCL_TRAINING';
  const baseOutDir = path.join(rootDir, 'source_code_pdfs');

  const backendOutDir = path.join(baseOutDir, '01_Backend_Server');
  const frontendOutDir = path.join(baseOutDir, '02_Frontend_Client');
  const docsOutDir = path.join(baseOutDir, '03_Configuration_and_Root');

  [baseOutDir, backendOutDir, frontendOutDir, docsOutDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const filesToProcess = [
    // 1. Backend Server Files
    { path: path.join(rootDir, 'server', 'src', 'server.js'), dir: backendOutDir, cat: 'Backend Entrypoint', desc: 'Express Server Initialization, Middleware, Healthcheck, and Auto-Seed' },
    { path: path.join(rootDir, 'server', 'src', 'config', 'db.js'), dir: backendOutDir, cat: 'Database Config', desc: 'Dual-Mode Persistence (MongoDB Atlas + In-Memory Fallback)' },
    { path: path.join(rootDir, 'server', 'src', 'middleware', 'auth.js'), dir: backendOutDir, cat: 'Authentication Middleware', desc: 'JWT HTTP-Only Cookie & Bearer Token Verification with Resilient Fallback' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'matchingEngine', 'scoringEngine.js'), dir: backendOutDir, cat: 'Explainable AI Engine', desc: '4-Factor Weighted Scoring Model with Verbatim Citation Extraction' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'matchingEngine', 'aiProvider.js'), dir: backendOutDir, cat: 'Pluggable AI Layer', desc: 'Hugging Face API + Local TF-IDF Cosine Vector Fallback' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'skillExtractor', 'skillExtractor.js'), dir: backendOutDir, cat: 'Skill Extraction', desc: '500+ Skill Parser with Word Boundary Lookaheads' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'skillExtractor', 'taxonomy.js'), dir: backendOutDir, cat: 'Skill Taxonomy', desc: '8-Domain Categorized Technical Skill Taxonomy and Aliases' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'resumeParser', 'textExtractor.js'), dir: backendOutDir, cat: 'Document Extraction', desc: 'PDF, DOCX, TXT Parsing & SHA-256 Deduplication Fingerprinting' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'jobIntelligence', 'jobAnalyzer.js'), dir: backendOutDir, cat: 'Job Analyzer', desc: '0-100% Job Readiness Score & Buzzword Detector' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'interviewService.js'), dir: backendOutDir, cat: 'Interview Intelligence', desc: 'Gap-Targeted Question Generator and 1-5 Scoring Rubric' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'auditLogger.js'), dir: backendOutDir, cat: 'Compliance', desc: 'Immutable Enterprise Audit Ledger Service' },
    { path: path.join(rootDir, 'server', 'src', 'controllers', 'screeningController.js'), dir: backendOutDir, cat: 'API Controller', desc: 'Screening Results Retrieval, Manual Overrides, and Comparison API' },
    { path: path.join(rootDir, 'server', 'src', 'controllers', 'jobController.js'), dir: backendOutDir, cat: 'API Controller', desc: 'Job Opening Lifecycle (Create, Update, Duplicate, Readiness)' },
    { path: path.join(rootDir, 'server', 'src', 'controllers', 'pipelineController.js'), dir: backendOutDir, cat: 'API Controller', desc: '7-Stage Kanban Board Transitions, Bulk Moves, and Undo API' },
    { path: path.join(rootDir, 'server', 'src', 'controllers', 'reportController.js'), dir: backendOutDir, cat: 'API Controller', desc: 'Funnel Drop-Off Analytics, Skill Distributions, and CSV Export' },
    { path: path.join(rootDir, 'server', 'src', 'controllers', 'authController.js'), dir: backendOutDir, cat: 'API Controller', desc: 'Recruiter Registration, Login, Session Verification, and Cookie Handlers' },
    { path: path.join(rootDir, 'server', 'src', 'models', 'ScreeningResult.js'), dir: backendOutDir, cat: 'Database Model', desc: 'Mongoose Schema for 4-Component Scores and Evidence Excerpts' },
    { path: path.join(rootDir, 'server', 'src', 'models', 'Job.js'), dir: backendOutDir, cat: 'Database Model', desc: 'Mongoose Schema for Jobs, Mandatory/Preferred Skills, and Criteria' },
    { path: path.join(rootDir, 'server', 'src', 'models', 'Candidate.js'), dir: backendOutDir, cat: 'Database Model', desc: 'Mongoose Schema for Candidate Profiles, Contact, and Extracted Skills' },
    { path: path.join(rootDir, 'server', 'src', 'models', 'Application.js'), dir: backendOutDir, cat: 'Database Model', desc: 'Mongoose Schema for Pipeline Stages and Stage History Audit' },
    { path: path.join(rootDir, 'server', 'src', 'models', 'User.js'), dir: backendOutDir, cat: 'Database Model', desc: 'Mongoose Schema for Authenticated Users, bcrypt Hashing, and Roles' },
    { path: path.join(rootDir, 'server', 'tests', 'runTests.js'), dir: backendOutDir, cat: 'Automated Test Suite', desc: '5 Backend Verification Test Suites (100% Assertion Coverage)' },

    // 2. Frontend Client Files
    { path: path.join(rootDir, 'client', 'src', 'App.jsx'), dir: frontendOutDir, cat: 'Frontend Router', desc: 'Application Layout, QueryClient, and 20 Client-Side Routes' },
    { path: path.join(rootDir, 'client', 'src', 'api', 'client.js'), dir: frontendOutDir, cat: 'API Client', desc: 'Resilient Fetch Wrapper with JWT Injection and Error Handlers' },
    { path: path.join(rootDir, 'client', 'src', 'context', 'AuthContext.jsx'), dir: frontendOutDir, cat: 'State Management', desc: 'Authentication Context with Session Restoration & Auto-Login' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'DashboardPage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: 'Executive Dashboard with Live Metrics and Screening Trend Area Chart' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'ResumeUploadPage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: 'Drag-and-Drop Resume Ingestion with 6-Stage Progress Stepper' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'JobCreateEditPage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: 'Job Formulation with Real-Time Readiness Gauge and Buzzword Flags' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'CandidateDetailPage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: 'Deep Candidate Dossier with Evidence Citations and Score Override' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'ComparisonPage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: 'Side-by-Side Candidate Comparison Matrix for 2 to 4 Applicants' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'PipelinePage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: '7-Stage Drag-and-Drop Kanban Recruitment Board with Undo Support' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'TalentPoolPage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: 'Faceted Full-Text Candidate Search with Minimum Experience Sliders' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'InterviewsPage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: 'Gap-Targeted Interview Question Generator and 1-5 Rubric' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'ReportsPage.jsx'), dir: frontendOutDir, cat: 'Client Page', desc: 'Recruitment Funnel Velocity, Skill Distribution, and CSV Export' },

    // 3. Root Files
    { path: path.join(rootDir, 'index.html'), dir: docsOutDir, cat: 'Standalone Web App', desc: 'Complete Client-Side Browser Edition (Zero Terminal Needed)' },
    { path: path.join(rootDir, 'README.md'), dir: docsOutDir, cat: 'Project Documentation', desc: 'Architecture, API Endpoints, Local Setup, and Module Breakdown' },
  ];

  console.log(`\n=======================================================`);
  console.log(`  GENERATING SOURCE CODE PDFS (${filesToProcess.length} Files)`);
  console.log(`=======================================================`);

  let totalPagesGenerated = 0;
  for (const item of filesToProcess) {
    const res = generateSourcePDF(item.path, item.dir, item.cat, item.desc);
    if (res) totalPagesGenerated += res.pages;
  }

  console.log(`\n[SUCCESS] Completed generation of all source code PDFs.`);
  console.log(`Total Pages Processed: ${totalPagesGenerated} pages across 3 subdirectories.`);
}

buildAllSourcePDFs();
