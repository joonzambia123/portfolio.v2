import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

export function gitAdd(files = 'cms-data/') {
  return execSync(`git add ${files}`, { cwd: PROJECT_ROOT, encoding: 'utf-8' });
}

export function gitCommit(message = 'CMS update') {
  return execSync(`git commit -m "${message}"`, { cwd: PROJECT_ROOT, encoding: 'utf-8' });
}

export function gitPush() {
  return execSync('git push', { cwd: PROJECT_ROOT, encoding: 'utf-8' });
}

export function gitStatus() {
  return execSync('git status --porcelain cms-data/', { cwd: PROJECT_ROOT, encoding: 'utf-8' });
}

export function hasUncommittedChanges() {
  const status = gitStatus();
  return status.trim().length > 0;
}

export function deploy(message = 'CMS update') {
  gitAdd();
  if (!hasUncommittedChanges()) {
    return { success: true, message: 'No changes to deploy' };
  }
  gitCommit(message);
  gitPush();
  return { success: true, message: 'Deployed successfully!' };
}

