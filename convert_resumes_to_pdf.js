// Script to generate polished sample PDF resumes for demo & testing
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

  checkPageBreak(needed) {
    if (this.currentPage.y - needed < 50) {
      this.addPage();
    }
  }

  escapeText(text) {
    return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
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

  addTextWrapped(text, font = 'F1', size = 9, color = [51, 56, 66], lineHeight = 13, indent = 45) {
    const words = text.split(' ');
    let currentLine = '';
    const maxChars = Math.floor((550 - indent) / 5.5);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if ((currentLine + ' ' + word).trim().length > maxChars) {
        this.checkPageBreak(lineHeight + 5);
        this.drawText(currentLine.trim(), indent, this.currentPage.y, font, size, color);
        this.currentPage.y -= lineHeight;
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine.trim().length > 0) {
      this.checkPageBreak(lineHeight + 5);
      this.drawText(currentLine.trim(), indent, this.currentPage.y, font, size, color);
      this.currentPage.y -= lineHeight;
    }
  }

  compile() {
    const pageRefs = [];
    const contentRefs = [];

    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const streamContent = page.stream.join('\n');
      const streamLen = Buffer.byteLength(streamContent, 'utf-8');
      const streamObj = `<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`;
      contentRefs.push(this.addObject(streamObj));
    }

    const pagesObjNum = this.objects.length + 1;
    for (let i = 0; i < this.pages.length; i++) {
      const pageObjNum = this.objects.length + 1;
      pageRefs.push(pageObjNum);
      const pageObjContent = `<< /Type /Page /Parent ${pagesObjNum + this.pages.length} 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Resources << /Font << /F1 ${this.fonts['F1'].num} 0 R /F2 ${this.fonts['F2'].num} 0 R >> >> /Contents ${contentRefs[i]} 0 R >>`;
      this.addObject(pageObjContent);
    }

    const actualPagesObjNum = this.addObject(`<< /Type /Pages /Kids [${pageRefs.map(num => `${num} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`);
    const catalogObjNum = this.addObject(`<< /Type /Catalog /Pages ${actualPagesObjNum} 0 R >>`);

    for (let i = 0; i < pageRefs.length; i++) {
      const pIdx = pageRefs[i] - 1;
      this.objects[pIdx].content = this.objects[pIdx].content.replace(/Parent \d+ 0 R/, `Parent ${actualPagesObjNum} 0 R`);
    }

    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [];

    for (let i = 0; i < this.objects.length; i++) {
      offsets.push(Buffer.byteLength(out, 'utf-8'));
      out += `${this.objects[i].num} 0 obj\n${this.objects[i].content}\nendobj\n`;
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

function buildResumePDF(filePath, name, role, contact, summary, skills, experience, education, certs) {
  const pdf = new SimplePDF();
  pdf.addFont('F1', 'Helvetica');
  pdf.addFont('F2', 'Helvetica-Bold');
  pdf.addPage();

  // Name & Header
  pdf.drawText(name.toUpperCase(), 45, pdf.currentPage.y, 'F2', 20, [23, 26, 33]);
  pdf.currentPage.y -= 16;
  pdf.drawText(role, 45, pdf.currentPage.y, 'F2', 11, [23, 107, 82]);
  pdf.currentPage.y -= 14;
  pdf.drawText(contact, 45, pdf.currentPage.y, 'F1', 8, [97, 103, 115]);
  pdf.currentPage.y -= 8;
  pdf.drawLine(45, pdf.currentPage.y, 550, pdf.currentPage.y, [23, 107, 82], 1.5);
  pdf.currentPage.y -= 18;

  // Summary
  pdf.drawText('PROFESSIONAL SUMMARY', 45, pdf.currentPage.y, 'F2', 10, [23, 107, 82]);
  pdf.currentPage.y -= 14;
  pdf.addTextWrapped(summary, 'F1', 8.5, [51, 56, 66], 12);
  pdf.currentPage.y -= 10;

  // Skills
  pdf.drawText('TECHNICAL COMPETENCIES & SKILLS', 45, pdf.currentPage.y, 'F2', 10, [23, 107, 82]);
  pdf.currentPage.y -= 14;
  for (const s of skills) {
    pdf.drawRect(48, pdf.currentPage.y + 2, 3, 3, [23, 107, 82]);
    pdf.drawText(`${s.category}: `, 56, pdf.currentPage.y, 'F2', 8, [23, 26, 33]);
    pdf.drawText(s.items, 56 + (s.category.length * 5.2) + 5, pdf.currentPage.y, 'F1', 8, [51, 56, 66]);
    pdf.currentPage.y -= 13;
  }
  pdf.currentPage.y -= 10;

  // Experience
  pdf.drawText('WORK EXPERIENCE', 45, pdf.currentPage.y, 'F2', 10, [23, 107, 82]);
  pdf.currentPage.y -= 14;
  for (const exp of experience) {
    pdf.drawText(exp.role, 45, pdf.currentPage.y, 'F2', 9, [23, 26, 33]);
    pdf.drawText(exp.dates, 470, pdf.currentPage.y, 'F2', 8, [97, 103, 115]);
    pdf.currentPage.y -= 12;
    for (const bullet of exp.bullets) {
      pdf.drawRect(48, pdf.currentPage.y + 2, 3, 3, [97, 103, 115]);
      pdf.addTextWrapped(bullet, 'F1', 8, [51, 56, 66], 11, 56);
      pdf.currentPage.y -= 2;
    }
    pdf.currentPage.y -= 6;
  }

  // Education
  pdf.drawText('EDUCATION', 45, pdf.currentPage.y, 'F2', 10, [23, 107, 82]);
  pdf.currentPage.y -= 14;
  for (const edu of education) {
    pdf.drawText(edu.degree, 45, pdf.currentPage.y, 'F2', 8.5, [23, 26, 33]);
    pdf.drawText(edu.dates, 470, pdf.currentPage.y, 'F1', 8, [97, 103, 115]);
    pdf.currentPage.y -= 11;
    pdf.drawText(edu.school, 45, pdf.currentPage.y, 'F1', 8, [97, 103, 115]);
    pdf.currentPage.y -= 14;
  }

  // Certs
  if (certs && certs.length > 0) {
    pdf.drawText('CERTIFICATIONS', 45, pdf.currentPage.y, 'F2', 10, [23, 107, 82]);
    pdf.currentPage.y -= 14;
    for (const c of certs) {
      pdf.drawText(`• ${c}`, 45, pdf.currentPage.y, 'F1', 8, [51, 56, 66]);
      pdf.currentPage.y -= 11;
    }
  }

  const buf = pdf.compile();
  fs.writeFileSync(filePath, buf);
  console.log(`[SUCCESS] Generated ${filePath} (${buf.length} bytes)`);
}

// 1. Alex Morgan
buildResumePDF(
  path.join(__dirname, 'sample_resumes', 'alex_morgan_fullstack.pdf'),
  'Alex Morgan',
  'Senior Full-Stack Engineer',
  'Email: alex.morgan.dev@vanguardpool.io | Phone: +1 (415) 672-8819 | Location: San Francisco, CA | GitHub: alexmorgan-dev',
  'Senior Full-Stack Engineer with 6+ years of experience designing and scaling distributed web applications and cloud microservices. Proven expertise in React, TypeScript, Node.js, and PostgreSQL. Passionate about clean architecture, sub-100ms API response times, and automated CI/CD workflows.',
  [
    { category: 'Frontend', items: 'React, TypeScript, Next.js, Redux, Tailwind CSS, HTML5, CSS3, WebSockets' },
    { category: 'Backend', items: 'Node.js, Express.js, GraphQL, REST APIs, Microservices, Python' },
    { category: 'Database', items: 'PostgreSQL, Redis, MongoDB, SQL' },
    { category: 'Cloud & DevOps', items: 'Docker, AWS (ECS, S3, RDS), Kubernetes, CI/CD (GitHub Actions)' },
    { category: 'Testing', items: 'Jest, Vitest, Cypress, Unit Testing' }
  ],
  [
    {
      role: 'Lead Full-Stack Engineer | Apex Cloud Solutions',
      dates: '2021 - Present',
      bullets: [
        'Architected and delivered high-throughput React and Node.js microservices serving 250,000 daily active enterprise users.',
        'Re-architected relational database schema in PostgreSQL, reducing complex query latencies by 42%.',
        'Integrated Redis caching layer and GraphQL endpoints, improving dashboard load times.',
        'Spearheaded migration of legacy services to Docker containers orchestrated on AWS ECS.'
      ]
    },
    {
      role: 'Senior Software Engineer | Kinetic Fintech',
      dates: '2018 - 2021',
      bullets: [
        'Developed responsive customer dashboard in React and TypeScript backed by Node.js REST APIs.',
        'Built automated database migrations and integration test suites using Jest and PostgreSQL.',
        'Collaborated with product designers to implement reusable design systems using Tailwind CSS.'
      ]
    }
  ],
  [
    { degree: 'Bachelor of Science in Computer Science (GPA: 3.8/4.0)', school: 'University of California, Davis', dates: '2014 - 2018' }
  ],
  ['AWS Certified Solutions Architect - Associate']
);

// 2. Sarah Jenkins
buildResumePDF(
  path.join(__dirname, 'sample_resumes', 'sarah_jenkins_devops.pdf'),
  'Sarah Jenkins',
  'Lead Cloud Infrastructure Architect',
  'Email: sarah.jenkins.cloud@opsnet.com | Phone: +1 (206) 412-9033 | Location: Seattle, WA | GitHub: sjenkins-infra',
  'Lead Cloud Infrastructure Architect with 8 years of deep expertise in Kubernetes, Terraform, Docker, and AWS ecosystem. Proven track record establishing multi-region zero-downtime infrastructure, automated CI/CD deployment pipelines, and enterprise telemetry with Prometheus & Grafana.',
  [
    { category: 'Cloud Platforms', items: 'AWS (EKS, VPC, CloudFront, Route53, RDS, IAM), Google Cloud (GCP)' },
    { category: 'IaC & Automation', items: 'Terraform, Terragrunt, CloudFormation, Ansible, Bash, Python' },
    { category: 'Containers', items: 'Kubernetes, Docker, Helm, Docker Compose, Linux' },
    { category: 'Observability', items: 'Prometheus, Grafana, Datadog, CloudWatch' }
  ],
  [
    {
      role: 'Lead DevOps & Infrastructure Engineer | Stratosphere Networks',
      dates: '2020 - Present',
      bullets: [
        'Designed and maintained multi-region AWS cloud infrastructure using Terraform, managing 35+ production Kubernetes clusters.',
        'Implemented GitOps continuous deployment pipelines with GitHub Actions, reducing deployment failure rates to under 0.2%.',
        'Enforced zero-trust networking policies and cluster security benchmarks across Linux and Docker workloads.',
        'Decreased monthly cloud compute spend by 32% using spot instances and automated HPA pod autoscaling.'
      ]
    },
    {
      role: 'Senior Cloud Engineer | Matrix Software Labs',
      dates: '2016 - 2020',
      bullets: [
        'Automated infrastructure provisioning on AWS using Terraform and Docker.',
        'Administered Linux servers, Nginx reverse proxies, and centralized logging clusters.',
        'Configured real-time system alerts and SLO/SLA dashboards in Grafana and Prometheus.'
      ]
    }
  ],
  [
    { degree: 'Master of Science in Computer Engineering', school: 'University of Washington', dates: '2014 - 2016' }
  ],
  ['Certified Kubernetes Administrator (CKA)', 'AWS Certified Solutions Architect - Professional']
);

// 3. Marcus Reed
buildResumePDF(
  path.join(__dirname, 'sample_resumes', 'marcus_reed_designer.pdf'),
  'Marcus Reed',
  'Lead Product Designer',
  'Email: marcus.reed.design@creativestudio.io | Phone: +1 (512) 430-8821 | Location: Austin, TX | Portfolio: marcusreed.design',
  'Lead Product Designer with 6+ years of experience crafting enterprise B2B SaaS interfaces and multi-brand design systems. Deep expertise in Figma, User Research, Wireframing, and Prototyping.',
  [
    { category: 'Design & Prototyping', items: 'Figma, Design Systems, Wireframing, Prototyping, Storybook' },
    { category: 'Research & Strategy', items: 'User Research, Usability Testing, Information Architecture' },
    { category: 'Frontend Collaboration', items: 'Tailwind CSS, HTML5, CSS3, Responsive Design' }
  ],
  [
    {
      role: 'Lead Product Designer | OmniSaaS Platform',
      dates: '2020 - Present',
      bullets: [
        'Designed and documented an enterprise design system in Figma used by 50+ engineers and product squads.',
        'Conducted 75+ generative user research interviews and usability sessions.',
        'Redesigned core recruitment workflows, increasing onboarding completion by 31%.'
      ]
    },
    {
      role: 'Senior UI/UX Designer | Vertex Interactive',
      dates: '2018 - 2020',
      bullets: [
        'Designed high-fidelity prototypes and responsive web applications in Figma.',
        'Created component libraries with Tailwind CSS and CSS3 tokens.'
      ]
    }
  ],
  [
    { degree: 'Bachelor of Fine Arts in Interaction Design', school: 'University of Texas at Austin', dates: '2014 - 2018' }
  ],
  ['Nielsen Norman Group UX Master Certified']
);
