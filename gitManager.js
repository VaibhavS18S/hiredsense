const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname);

// Recursively get all files excluding those in .gitignore
function getAllFiles(currentDir, relativePath = '') {
  const ignored = [
    'node_modules',
    '.git',
    '.tools',
    'dist',
    '.env',
    'uploads',
  ];

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const rel = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (ignored.includes(entry.name)) continue;

    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, rel));
    } else {
      files.push(rel);
    }
  }

  return files;
}

async function initAndCommit() {
  console.log('Initializing git repository...');
  await git.init({ fs, dir, defaultBranch: 'main' });

  // Add remote
  const remoteUrl = 'https://github.com/VaibhavS18S/hiredsense.git';
  try {
    await git.addRemote({
      fs,
      dir,
      remote: 'origin',
      url: remoteUrl,
      force: true,
    });
    console.log(`Configured remote origin: ${remoteUrl}`);
  } catch (e) {
    console.log('Remote configuration:', e.message);
  }

  // Get files
  const files = getAllFiles(dir);
  console.log(`Staging ${files.length} project files...`);

  for (const filepath of files) {
    await git.add({ fs, dir, filepath });
  }

  console.log('Creating commit...');
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'VaibhavS18S',
      email: 'recruiter@hiresense.ai',
    },
    message: 'Initial commit: HireSense AI talent acquisition platform with explainable AI screening',
  });

  console.log(`Commit created successfully: ${sha}`);
  console.log('\nRepository ready on branch: main');
}

async function pushToGithub(token) {
  if (!token) {
    console.log('\n[INFO] To push to GitHub, a GitHub Personal Access Token (PAT) is required.');
    console.log('Push URL: https://github.com/VaibhavS18S/hiredsense.git');
    return;
  }

  console.log('Pushing to GitHub origin/main...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({
      username: token,
      password: '',
    }),
  });

  console.log('Push complete:', pushResult);
}

const args = process.argv.slice(2);
const token = args[0] || process.env.GITHUB_TOKEN;

initAndCommit()
  .then(() => pushToGithub(token))
  .catch((err) => {
    console.error('Git error:', err);
    process.exit(1);
  });
