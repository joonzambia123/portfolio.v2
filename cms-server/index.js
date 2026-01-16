import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CMS_DATA_DIR = path.join(__dirname, '..', 'cms-data');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure cms-data directory exists
async function ensureDataDir() {
  try {
    await fs.access(CMS_DATA_DIR);
  } catch {
    await fs.mkdir(CMS_DATA_DIR, { recursive: true });
  }
}

// GET /api/collections - List all collections
app.get('/api/collections', async (req, res) => {
  try {
    await ensureDataDir();
    const files = await fs.readdir(CMS_DATA_DIR);
    const collections = files
      .filter(f => f.endsWith('.json') && !f.startsWith('_'))
      .map(f => f.replace('.json', ''));
    res.json({ collections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/schemas - Get all schemas
app.get('/api/schemas', async (req, res) => {
  try {
    await ensureDataDir();
    const schemaPath = path.join(CMS_DATA_DIR, '_schemas.json');
    try {
      const data = await fs.readFile(schemaPath, 'utf-8');
      res.json(JSON.parse(data));
    } catch {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/schemas - Save schemas
app.post('/api/schemas', async (req, res) => {
  try {
    await ensureDataDir();
    const schemaPath = path.join(CMS_DATA_DIR, '_schemas.json');
    await fs.writeFile(schemaPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/collections/:name - Get collection data
app.get('/api/collections/:name', async (req, res) => {
  try {
    await ensureDataDir();
    const filePath = path.join(CMS_DATA_DIR, `${req.params.name}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(data));
    } catch {
      res.json({ data: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/collections/:name - Save collection data
app.post('/api/collections/:name', async (req, res) => {
  try {
    await ensureDataDir();
    const filePath = path.join(CMS_DATA_DIR, `${req.params.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/collections/:name - Delete a collection
app.delete('/api/collections/:name', async (req, res) => {
  try {
    const filePath = path.join(CMS_DATA_DIR, `${req.params.name}.json`);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/deploy - Git commit and push
app.post('/api/deploy', async (req, res) => {
  try {
    const projectRoot = path.join(__dirname, '..');
    const message = req.body.message || 'CMS update';
    const includeAll = req.body.includeAll !== false; // Default to true

    // Stage changes - either all files or just cms-data
    if (includeAll) {
      execSync('git add -A', { cwd: projectRoot, stdio: 'pipe' });
    } else {
      execSync('git add cms-data/', { cwd: projectRoot, stdio: 'pipe' });
    }

    // Check if there are changes to commit
    try {
      execSync('git diff --cached --quiet', { cwd: projectRoot, stdio: 'pipe' });
      // If we get here, there are no changes
      res.json({ success: true, message: 'No changes to deploy' });
      return;
    } catch {
      // There are changes to commit (git diff returns non-zero)
    }

    // Get list of files being committed for the response
    const stagedFiles = execSync('git diff --cached --name-only', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).trim().split('\n').filter(Boolean);

    // Commit
    execSync(`git commit -m "${message}"`, { cwd: projectRoot, stdio: 'pipe' });

    // Push
    execSync('git push', { cwd: projectRoot, stdio: 'pipe' });

    res.json({
      success: true,
      message: 'Deployed successfully!',
      filesDeployed: stagedFiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/git-status - Check git status
app.get('/api/git-status', async (req, res) => {
  try {
    const projectRoot = path.join(__dirname, '..');

    // Get CMS data changes
    const cmsStatus = execSync('git status --porcelain cms-data/', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).trim();

    // Get ALL changes (including source code)
    const allStatus = execSync('git status --porcelain', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).trim();

    // Parse changes into categories
    const allFiles = allStatus.split('\n').filter(Boolean);
    const cmsFiles = allFiles.filter(f => f.includes('cms-data/'));
    const sourceFiles = allFiles.filter(f => !f.includes('cms-data/') && !f.includes('node_modules/'));

    res.json({
      hasChanges: allStatus.length > 0,
      hasCmsChanges: cmsStatus.length > 0,
      hasSourceChanges: sourceFiles.length > 0,
      cmsFiles: cmsFiles.map(f => f.trim()),
      sourceFiles: sourceFiles.map(f => f.trim()),
      status: allStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.CMS_PORT || 3001;
app.listen(PORT, () => {
  console.log(`CMS Server running on http://localhost:${PORT}`);
});

