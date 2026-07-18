import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Define ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoRepoPath = path.resolve(__dirname, '../demo-repo');

console.log(`Starting TraceMind Demo Repository Setup...`);
console.log(`Repository Target Directory: ${demoRepoPath}`);

// 1. Clean up existing demo-repo folder
if (fs.existsSync(demoRepoPath)) {
  console.log(`Cleaning up existing demo-repo directory...`);
  fs.rmSync(demoRepoPath, { recursive: true, force: true });
}

// 2. Create target directory
fs.mkdirSync(demoRepoPath, { recursive: true });

// Helper to run commands inside demo-repo
function runGit(cmd: string) {
  execSync(cmd, { cwd: demoRepoPath, stdio: 'ignore' });
}

// Helper to write files
function writeFile(relativeFilePath: string, content: string) {
  const fullPath = path.join(demoRepoPath, relativeFilePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
}

// 3. Initialize Git Repository
console.log(`Initializing Git repository...`);
runGit('git init');
runGit('git config user.name "Demo Developer"');
runGit('git config user.email "demo@tracemind.ai"');

// --- COMMIT 1: Initial Login Service ---
console.log(`Committing Commit 1/7: Initial login...`);
writeFile(
  'authService.ts',
  `
export async function login(username, password) {
  // Basic validation
  if (username === 'admin' && password === 'secret123') {
    return { success: true, user: { username } };
  }
  return { success: false, error: 'Invalid credentials' };
}
`,
);
runGit('git add .');
runGit(
  'git commit -m "feat: implement base username/password login service" --date="2026-07-10T10:00:00"',
);

// --- COMMIT 2: Integrate JWT Token ---
console.log(`Committing Commit 2/7: Integrate JWT...`);
writeFile(
  'authService.ts',
  `
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'super-secret-key';

export async function login(username, password) {
  if (username === 'admin' && password === 'secret123') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return { success: true, user: { username }, token };
  }
  return { success: false, error: 'Invalid credentials' };
}
`,
);
runGit('git add .');
runGit(
  'git commit -m "feat: integrate JWT token generation for session security" --date="2026-07-11T12:00:00"',
);

// --- COMMIT 3: Google OAuth ---
console.log(`Committing Commit 3/7: OAuth Provider...`);
writeFile(
  'oauthService.ts',
  `
export async function verifyGoogleToken(token: string) {
  // Verify client token matching google oauth endpoints
  if (token.startsWith('google-oauth-mock-')) {
    return { email: 'admin@google-oauth-mock.com', verified: true };
  }
  throw new Error('OAuth token verification failed');
}
`,
);
runGit('git add .');
runGit(
  'git commit -m "feat: integrate Google OAuth authentication provider" --date="2026-07-12T14:00:00"',
);

// --- COMMIT 4: Refactor Token Helpers ---
console.log(`Committing Commit 4/7: Refactor Helpers...`);
writeFile(
  'helpers/token.ts',
  `
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'super-secret-key';

export function generateToken(payload: any) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}
`,
);
writeFile(
  'authService.ts',
  `
import { generateToken } from './helpers/token';

export async function login(username, password) {
  if (username === 'admin' && password === 'secret123') {
    const token = generateToken({ username });
    return { success: true, user: { username }, token };
  }
  return { success: false, error: 'Invalid credentials' };
}
`,
);
runGit('git add .');
runGit(
  'git commit -m "refactor: extract JWT signing logic to token helper module" --date="2026-07-13T16:00:00"',
);

// --- COMMIT 5: Database User Auth (The Bug: Connection Leak) ---
console.log(`Committing Commit 5/7: DB integration (leak)...`);
writeFile(
  'db.ts',
  `
import { Pool } from 'pg';

export const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
});
`,
);
writeFile(
  'authService.ts',
  `
import { pool } from './db';
import { generateToken } from './helpers/token';

export async function getUser(username: string) {
  // Open DB socket client connection
  const client = await pool.connect();
  // Execute database query
  const res = await client.query('SELECT * FROM users WHERE username = $1', [username]);
  
  // REGRESSION BUG: Missing client.release()! 
  // Connection client is never released back to PG Pool, leaking sockets on every call.
  return res.rows[0];
}

export async function login(username, password) {
  const user = await getUser(username);
  if (user && user.password === password) {
    const token = generateToken({ username });
    return { success: true, user: { username }, token };
  }
  return { success: false, error: 'Invalid credentials' };
}
`,
);
runGit('git add .');
runGit('git commit -m "feat: add database-backed user validation" --date="2026-07-14T09:00:00"');

// --- COMMIT 6: Docker deployment setup ---
console.log(`Committing Commit 6/7: Docker configurations...`);
writeFile(
  'Dockerfile',
  `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
`,
);
writeFile(
  '.env.example',
  `
PORT=3000
DATABASE_URL=postgresql://localhost:5432/auth_db
JWT_SECRET=super-secret-key
`,
);
runGit('git add .');
runGit(
  'git commit -m "chore: prepare docker configuration and environment setup" --date="2026-07-14T11:00:00"',
);

// --- COMMIT 7: Hotfix (The Fix) ---
console.log(`Committing Commit 7/7: Release client hotfix...`);
writeFile(
  'authService.ts',
  `
import { pool } from './db';
import { generateToken } from './helpers/token';

export async function getUser(username: string) {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    return res.rows[0];
  } finally {
    // HOTFIX: release client back to the database connection pool
    client.release();
  }
}

export async function login(username, password) {
  const user = await getUser(username);
  if (user && user.password === password) {
    const token = generateToken({ username });
    return { success: true, user: { username }, token };
  }
  return { success: false, error: 'Invalid credentials' };
}
`,
);
runGit('git add .');
runGit(
  'git commit -m "fix: resolve socket connection leak by releasing DB client in finally block" --date="2026-07-15T15:00:00"',
);

console.log(`\nDemo Repository setup completed successfully!`);
console.log(`Path: ${demoRepoPath}`);
