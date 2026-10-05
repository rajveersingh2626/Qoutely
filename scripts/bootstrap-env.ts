import fs from 'fs';
import path from 'path';

// Load .env.local if present for standalone script executions
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        // Check whether process.env[key] is undefined rather than falsy
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    }
  }
} catch {
  // Ignore
}
