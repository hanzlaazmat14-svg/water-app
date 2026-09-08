import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';

const repoDir = process.cwd();
const token = process.argv[2] || process.env.GITHUB_TOKEN;

async function pushRepo() {
  console.log('Attempting push to origin main...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir: repoDir,
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => {
        if (token) {
          return { username: token };
        }
        return undefined;
      }
    });

    console.log('Push result:', JSON.stringify(pushResult, null, 2));
    console.log('Push completed successfully!');
  } catch (err) {
    console.error('Push error:', err.message || err);
    process.exit(1);
  }
}

pushRepo();
