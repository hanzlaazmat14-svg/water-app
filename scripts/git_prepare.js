import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

const repoDir = process.cwd();

async function prepareRepo() {
  console.log('Initializing git repository in', repoDir);
  await git.init({ fs, dir: repoDir, defaultBranch: 'main' });

  // Read status of files
  console.log('Reading file status...');
  const statusMatrix = await git.statusMatrix({
    fs,
    dir: repoDir,
    filter: (f) => !f.startsWith('.git') && !f.startsWith('node_modules') && !f.startsWith('dist') && !f.startsWith('.env')
  });

  console.log(`Found ${statusMatrix.length} candidate files.`);

  for (const [filepath, headStatus, workdirStatus, stageStatus] of statusMatrix) {
    if (workdirStatus !== stageStatus || headStatus !== workdirStatus) {
      if (workdirStatus === 0) {
        await git.remove({ fs, dir: repoDir, filepath });
      } else {
        await git.add({ fs, dir: repoDir, filepath });
      }
    }
  }

  console.log('Files staged.');

  const sha = await git.commit({
    fs,
    dir: repoDir,
    author: {
      name: 'Hanzla Azmat',
      email: 'hanzlaazmat14@gmail.com',
    },
    message: process.argv[2] || 'feat: add business info manager, owner profile & password security, product photos, and sleek dynamic navbar',
  });

  console.log('Commit created with SHA:', sha);

  // Configure origin remote
  const remotes = await git.listRemotes({ fs, dir: repoDir });
  const hasOrigin = remotes.some((r) => r.remote === 'origin');
  if (hasOrigin) {
    await git.deleteRemote({ fs, dir: repoDir, remote: 'origin' });
  }

  await git.addRemote({
    fs,
    dir: repoDir,
    remote: 'origin',
    url: 'https://github.com/hanzlaazmat14-svg/water-app.git',
  });

  console.log('Remote origin configured to: https://github.com/hanzlaazmat14-svg/water-app.git');
}

prepareRepo().catch((err) => {
  console.error('Git error:', err);
  process.exit(1);
});
