import type { NextConfig } from 'next';
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };

function commit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? '';
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERSION: pkg.version,
    NEXT_PUBLIC_BUILT: new Date().toISOString().slice(0, 16).replace('T', ' '),
    NEXT_PUBLIC_COMMIT: commit(),
  },
};

export default nextConfig;
