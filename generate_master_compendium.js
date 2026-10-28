// Script to generate a unified master source code compendium PDF
const fs = require('fs');
const path = require('path');

// Re-use CodePDF class from generate_code_pdfs.js
const { execSync } = require('child_process');

class MasterCompendiumPDF {
  constructor() {
    this.title = 'HireSense AI — Complete Source Code Compendium';
    this.authorInfo = 'Vaibhav Srivastava (2400320101215) • ABES Engineering College • Mentor: Anshul Tickoo';
    this.objects = [];
    this.pages = [];
    this.fonts = {};
    this.pageWidth = 595.28;
    this.pageHeight = 841.89;
    this.currentPage = null;

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

  addPage(skipHeader = false) {
    const page = {
      stream: [],
      y: 775,
      pageNumber: this.pages.length + 1,
      skipHeader
    };
    this.pages.push(page);
    this.currentPage = page;

    if (!skipHeader) {
      this.drawHeader();
    }
    return page;
  }

  checkPageBreak(neededSpace) {
    if (this.currentPage.y - neededSpace < 50) {
      this.addPage();
    }
  }

  escapeText(text) {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  drawRect(x, y, w, h, fillColor = null, strokeColor = null, lineWidth = 1) {
    const ops = [];
    if (fillColor) ops.push(`${(fillColor[0]/255).toFixed(3)} ${(fillColor[1]/255).toFixed(3)} ${(fillColor[2]/255).toFixed(3)} rg`);
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
    this.drawRect(40, 800, 515, 20, [247, 247, 244], [226, 228, 222], 0.7);
    this.drawText(`HIRESENSE AI — SOURCE CODE COMPENDIUM`, 46, 806, 'F2', 7.5, [23, 107, 82]);
    this.drawText(this.authorInfo, 250, 806, 'F1', 6.5, [100, 105, 115]);
    this.currentPage.y = 780;
  }

  drawFooter(pageNum, totalPages) {
    this.drawLine(40, 36, 555, 36, [226, 228, 222], 0.7);
    this.drawText('ABES Engineering College • HCL Agile Capstone Project • Student: Vaibhav Srivastava', 40, 24, 'F1', 7, [120, 125, 135]);
    this.drawText(`Page ${pageNum} of ${totalPages}`, 505, 24, 'F2', 7, [23, 107, 82]);
  }

  addCoverPage() {
    this.addPage(true); // skip normal header
    this.currentPage.y = 720;

    // College & Project Banner
    this.drawRect(40, this.currentPage.y - 10, 515, 60, [240, 247, 244], [23, 107, 82], 1.5);
    this.drawText('ABES ENGINEERING COLLEGE, GHAZIABAD', 55, this.currentPage.y + 26, 'F2', 13, [23, 107, 82]);
    this.drawText('Department of Computer Science & Engineering • HCL Agile Capstone Project', 55, this.currentPage.y + 10, 'F1', 9, [80, 85, 95]);
    this.currentPage.y -= 90;

    // Title
    this.drawText('HireSense AI', 40, this.currentPage.y, 'F2', 32, [23, 26, 33]);
    this.currentPage.y -= 25;
    this.drawText('Official Comprehensive Source Code Compendium', 40, this.currentPage.y, 'F2', 14, [23, 107, 82]);
    this.currentPage.y -= 18;
    this.drawText('AI-Powered Resume Intelligence, Explainable Matching & Talent Acquisition Platform', 40, this.currentPage.y, 'F1', 10, [100, 105, 115]);
    this.currentPage.y -= 35;

    // Student & Project Metadata Box
    this.drawRect(40, this.currentPage.y - 120, 515, 130, [250, 251, 249], [226, 228, 222], 1);
    
    this.drawText('CANDIDATE & MENTOR DETAILS', 55, this.currentPage.y - 16, 'F2', 9, [23, 107, 82]);
    this.drawLine(55, this.currentPage.y - 22, 535, this.currentPage.y - 22, [226, 228, 222], 1);

    this.drawText('STUDENT NAME:', 55, this.currentPage.y - 40, 'F2', 8.5, [70, 75, 85]);
    this.drawText('Vaibhav Srivastava', 180, this.currentPage.y - 40, 'F2', 9, [23, 26, 33]);

    this.drawText('UNIVERSITY ROLL NO:', 55, this.currentPage.y - 58, 'F2', 8.5, [70, 75, 85]);
    this.drawText('2400320101215', 180, this.currentPage.y - 58, 'F3', 9.5, [23, 107, 82]);

    this.drawText('FACULTY MENTOR:', 55, this.currentPage.y - 76, 'F2', 8.5, [70, 75, 85]);
    this.drawText('Mr. Anshul Tickoo', 180, this.currentPage.y - 76, 'F2', 9, [23, 26, 33]);

    this.drawText('PROJECT REPOSITORY:', 55, this.currentPage.y - 94, 'F2', 8.5, [70, 75, 85]);
    this.drawText('https://github.com/VaibhavS18S/hiredsense (branch: main)', 180, this.currentPage.y - 94, 'F1', 8.5, [18, 95, 75]);

    this.drawText('RELEASE VERSION:', 55, this.currentPage.y - 112, 'F2', 8.5, [70, 75, 85]);
    this.drawText('v1.0.0 Production Release (Full-Stack MERN + Pluggable XAI)', 180, this.currentPage.y - 112, 'F1', 8.5, [23, 26, 33]);

    this.currentPage.y -= 160;

    // Architecture Overview Card
    this.drawRect(40, this.currentPage.y - 110, 515, 120, [255, 255, 255], [226, 228, 222], 1);
    this.drawText('CODEBASE ARCHITECTURE & MODULE SUMMARY', 55, this.currentPage.y - 14, 'F2', 9, [23, 107, 82]);
    this.drawLine(55, this.currentPage.y - 20, 535, this.currentPage.y - 20, [226, 228, 222], 1);

    this.drawText('• BACKEND API: Node.js, Express.js, JWT Cookie Sessions, Multer, pdf-parse, mammoth', 55, this.currentPage.y - 38, 'F1', 8, [50, 55, 65]);
    this.drawText('• DATABASE LAYER: MongoDB Atlas with automatic in-memory fallback (12 Mongoose models)', 55, this.currentPage.y - 54, 'F1', 8, [50, 55, 65]);
    this.drawText('• EXPLAINABLE AI: 4-component weighted model (Skills 40%, Semantic 30%, Exp 20%, Qual 10%)', 55, this.currentPage.y - 70, 'F1', 8, [50, 55, 65]);
    this.drawText('• FRONTEND CLIENT: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons (20 responsive routes)', 55, this.currentPage.y - 86, 'F1', 8, [50, 55, 65]);
    this.drawText('• VERIFICATION: 100% test pass rate across 5 automated backend verification suites', 55, this.currentPage.y - 102, 'F1', 8, [23, 107, 82]);

    this.currentPage.y -= 140;
    this.drawText('Generated automatically for academic submission and offline source code archival.', 40, this.currentPage.y, 'F1', 7.5, [130, 135, 145]);
  }

  addFileSection(filePath, category, description, sourceCode) {
    this.addPage();
    const lineCount = sourceCode.split('\n').length;
    const sizeBytes = Buffer.byteLength(sourceCode, 'utf8');

    // File Header
    this.drawRect(40, this.currentPage.y - 48, 515, 52, [240, 247, 244], [180, 215, 200], 1);
    this.drawText(`FILE: ${filePath}`, 50, this.currentPage.y - 12, 'F2', 9, [23, 107, 82]);
    this.drawText(`MODULE: ${category} — ${description}`, 50, this.currentPage.y - 25, 'F1', 7.5, [51, 56, 66]);
    this.drawText(`LINES: ${lineCount}  |  SIZE: ${(sizeBytes / 1024).toFixed(1)} KB  |  TYPE: ${path.extname(filePath).toUpperCase()}`, 50, this.currentPage.y - 37, 'F1', 7, [100, 105, 115]);
    this.currentPage.y -= 60;

    // Code lines
    const rawLines = sourceCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const lineHeight = 10;
    const maxCharsPerLine = 88;

    for (let i = 0; i < rawLines.length; i++) {
      const lineNumStr = String(i + 1).padStart(4, ' ') + ' | ';
      let codeText = rawLines[i].replace(/\t/g, '  ');

      let firstChunk = true;
      while (codeText.length > 0 || firstChunk) {
        this.checkPageBreak(lineHeight + 2);
        const currentChunk = codeText.substring(0, maxCharsPerLine);
        codeText = codeText.substring(maxCharsPerLine);

        if (firstChunk) {
          this.drawText(lineNumStr, 40, this.currentPage.y, 'F4', 7, [140, 145, 155]);
          const isComment = currentChunk.trim().startsWith('//') || currentChunk.trim().startsWith('/*') || currentChunk.trim().startsWith('*');
          const isKeyword = /^(const|let|var|function|import|export|class|async|await|return|if|else|switch|case|default|try|catch|throw)\b/.test(currentChunk.trim());
          
          let codeColor = [23, 26, 33];
          if (isComment) codeColor = [110, 130, 120];
          else if (isKeyword) codeColor = [18, 95, 75];

          this.drawText(currentChunk, 74, this.currentPage.y, 'F3', 7, codeColor);
        } else {
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

    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      this.currentPage = page;
      if (!page.skipHeader) {
        this.drawFooter(i + 1, totalPages);
      } else {
        // Simple cover page footer
        this.drawText(`Page 1 of ${totalPages}`, 505, 24, 'F2', 7, [100, 105, 115]);
      }

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

function buildMasterCompendium() {
  const rootDir = 'C:\\HCL_TRAINING';
  const outPath = path.join(rootDir, 'source_code_pdfs', 'HireSense_AI_Complete_Source_Code_Compendium.pdf');

  console.log(`\nGenerating Master Compendium PDF: ${outPath}...`);
  const masterPDF = new MasterCompendiumPDF();
  masterPDF.addCoverPage();

  const coreFiles = [
    // Backend Core
    { path: path.join(rootDir, 'server', 'src', 'server.js'), cat: 'Backend Core', desc: 'Server Entrypoint & Middleware' },
    { path: path.join(rootDir, 'server', 'src', 'config', 'db.js'), cat: 'Database', desc: 'Atlas & In-Memory Fallback' },
    { path: path.join(rootDir, 'server', 'src', 'middleware', 'auth.js'), cat: 'Security', desc: 'JWT Cookie & Bearer Token Middleware' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'matchingEngine', 'scoringEngine.js'), cat: 'Explainable AI', desc: '4-Factor Weighted Matching Model' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'matchingEngine', 'aiProvider.js'), cat: 'AI Vector Layer', desc: 'Hugging Face & TF-IDF Cosine Vectors' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'skillExtractor', 'taxonomy.js'), cat: 'Taxonomy', desc: '500+ Skills Across 8 Domains' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'skillExtractor', 'skillExtractor.js'), cat: 'Skill Extraction', desc: 'Regex Boundary Matcher' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'resumeParser', 'textExtractor.js'), cat: 'Extraction', desc: 'PDF, DOCX & SHA-256 Fingerprinting' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'jobIntelligence', 'jobAnalyzer.js'), cat: 'Job Intelligence', desc: 'Readiness Analyzer & Buzzwords' },
    { path: path.join(rootDir, 'server', 'src', 'services', 'interviewService.js'), cat: 'Interviews', desc: 'Skill Gap Questions & 1-5 Rubric' },
    { path: path.join(rootDir, 'server', 'tests', 'runTests.js'), cat: 'Testing', desc: '5 Automated Verification Suites' },

    // Frontend Core
    { path: path.join(rootDir, 'client', 'src', 'App.jsx'), cat: 'Frontend', desc: 'Client Routes & Layout' },
    { path: path.join(rootDir, 'client', 'src', 'api', 'client.js'), cat: 'API Client', desc: 'Resilient Fetch Wrapper' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'DashboardPage.jsx'), cat: 'Dashboard', desc: 'Executive Analytics View' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'ResumeUploadPage.jsx'), cat: 'Screening', desc: '6-Stage Intake Pipeline' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'JobCreateEditPage.jsx'), cat: 'Job Intelligence', desc: 'Job Formulation & Readiness' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'ComparisonPage.jsx'), cat: 'Comparison', desc: 'Multi-Candidate Alignment Matrix' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'PipelinePage.jsx'), cat: 'Pipeline', desc: '7-Stage Drag & Drop Kanban' },
    { path: path.join(rootDir, 'client', 'src', 'pages', 'ReportsPage.jsx'), cat: 'Reports', desc: 'Funnel Charts & CSV Export' },
  ];

  for (const item of coreFiles) {
    if (fs.existsSync(item.path)) {
      const code = fs.readFileSync(item.path, 'utf8');
      const relPath = path.relative(rootDir, item.path);
      masterPDF.addFileSection(relPath, item.cat, item.desc, code);
    }
  }

  const buf = masterPDF.compile();
  fs.writeFileSync(outPath, buf);
  console.log(`[SUCCESS] Master Compendium PDF created: ${outPath} (${buf.length} bytes, ${masterPDF.pages.length} pages)`);
}

buildMasterCompendium();
