import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const file = req.query.file;
  if (!file || typeof file !== 'string') {
    res.status(400).json({ error: 'Missing file query parameter' });
    return;
  }

  // Security: only allow .json files
  if (!file.endsWith('.json')) {
    res.status(400).json({ error: 'Only .json files are allowed' });
    return;
  }

  // Security: prevent path traversal
  if (file.includes('..') || file.includes('~') || path.isAbsolute(file)) {
    res.status(400).json({ error: 'Invalid file path' });
    return;
  }

  const filePath = path.join(DATA_DIR, file);

  // Ensure resolved path is still within DATA_DIR
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
    res.status(400).json({ error: 'Invalid file path' });
    return;
  }

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  try {
    const data = fs.readFileSync(resolvedPath, 'utf-8');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=3600'
    );
    res.status(200).send(data);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to read file',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
