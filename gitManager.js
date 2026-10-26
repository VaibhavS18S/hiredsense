const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname);

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
  const isGitRepo = fs.existsSync(path.join(dir, '.git'));
  if (!isGitRepo) {
    console.log('Initializing git repository...');
    await git.init({ fs, dir, defaultBranch: 'main' });
  }

  const remoteUrl = 'https://github.com/VaibhavS18S/hiredsense.git';
  try {
    const remotes = await git.listRemotes({ fs, dir });
    if (!remotes.some((r) => r.remote === 'origin')) {
      await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });
      console.log(`Configured remote origin: ${remoteUrl}`);
    }
  } catch (e) {
    console.log('Remote configuration notice:', e.message);
  }

  const files = getAllFiles(dir);
  for (const filepath of files) {
    await git.add({ fs, dir, filepath });
  }

  try {
    const sha = await git.commit({
      fs,
      dir,
      author: {
        name: 'VaibhavS18S',
        email: 'recruiter@hiresense.ai',
      },
      message: 'Initial commit: HireSense AI talent acquisition platform with explainable AI screening',
    });
    console.log(`Commit created: ${sha}`);
  } catch (commitErr) {
    // Commit may already exist with no new changes
    console.log('Working directory clean, existing commit ready to push.');
  }
}

async function pushToGithub(token) {
  if (!token) {
    console.log('\n=======================================================');
    console.log('  REPOSITORY COMMITTED AND READY TO PUSH TO GITHUB');
    console.log('=======================================================');
    console.log('Remote target: https://github.com/VaibhavS18S/hiredsense.git');
    console.log('Branch:        main');
    console.log('\nTo push, run:');
    console.log('  node gitManager.js <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>');
    console.log('=======================================================');
    return;
  }

  console.log('Pushing main branch to https://github.com/VaibhavS18S/hiredsense.git...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => ({
        username: token,
        password: '',
      }),
    });

    console.log('\nSUCCESS: Code successfully pushed to GitHub!');
    console.log(pushResult);
  } catch (pushErr) {
    console.error('\nPush failed:', pushErr.message);
    if (pushErr.message.includes('401')) {
      console.error('Authentication Error: Invalid or expired GitHub Personal Access Token.');
      console.error('Ensure your token has the "repo" scope checked.');
    }
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const token = args[0] || process.env.GITHUB_TOKEN;

initAndCommit()
  .then(() => pushToGithub(token))
  .catch((err) => {
    console.error('Git error:', err);
    process.exit(1);
  });
