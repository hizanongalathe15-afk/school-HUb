import { PrismaClient } from '@prisma/client';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_LOCAL_POSTGRES_PORTS = [5433, 5432, 5434, 5435];
const LOCAL_DATABASE_START_TIMEOUT_MS = 30_000;

export let prisma = new PrismaClient();

function getDatabaseUrlPort(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return Number(url.port || 5432);
  } catch {
    return null;
  }
}

function withDatabaseUrlPort(databaseUrl: string, port: number) {
  const url = new URL(databaseUrl);
  url.port = String(port);
  return url.toString();
}

function canTryLocalPortFallback(databaseUrl?: string) {
  if (!databaseUrl) return false;

  try {
    const url = new URL(databaseUrl);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function shouldAutoStartLocalDatabase(databaseUrl?: string) {
  if (!canTryLocalPortFallback(databaseUrl)) return false;
  if (process.env.NODE_ENV === 'production') return false;

  const setting = (process.env.AUTO_START_DATABASE || 'true').toLowerCase();
  return !['0', 'false', 'no', 'off'].includes(setting);
}

function findDockerComposeFile() {
  const candidates = [
    path.resolve(process.cwd(), '../docker/docker-compose.yml'),
    path.resolve(process.cwd(), 'docker/docker-compose.yml'),
    path.resolve(process.cwd(), '../../docker/docker-compose.yml'),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(output.trim() || `${command} exited with code ${code}`));
    });
  });
}

async function startLocalDatabaseIfAvailable() {
  const composeFile = findDockerComposeFile();
  if (!composeFile) {
    console.warn('Local database auto-start skipped: docker/docker-compose.yml was not found.');
    return;
  }

  console.log('Starting local PostgreSQL container...');
  await runCommand('docker', ['compose', '-f', composeFile, 'up', '-d', 'postgres']);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCandidateDatabaseUrls() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !canTryLocalPortFallback(databaseUrl)) {
    return databaseUrl ? [databaseUrl] : [];
  }

  const configuredPort = getDatabaseUrlPort(databaseUrl);
  const fallbackPorts = (process.env.DATABASE_PORT_FALLBACKS || '')
    .split(',')
    .map((port) => Number(port.trim()))
    .filter((port) => Number.isInteger(port) && port > 0);
  const ports = Array.from(new Set([
    configuredPort,
    ...fallbackPorts,
    ...DEFAULT_LOCAL_POSTGRES_PORTS,
  ].filter((port): port is number => Boolean(port))));

  return ports.map((port) => withDatabaseUrlPort(databaseUrl, port));
}

async function tryConnect(candidates: string[]): Promise<Error | null> {
  let lastError: unknown;
  const attempted: string[] = [];

  for (const databaseUrl of candidates) {
    attempted.push(databaseUrl);
    const candidate = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    try {
      await candidate.$connect();
      if (candidate !== prisma) {
        await prisma.$disconnect().catch(() => undefined);
      }
      prisma = candidate;
      process.env.DATABASE_URL = databaseUrl;
      const port = getDatabaseUrlPort(databaseUrl);
      console.log(`Database connected${port ? ` on port ${port}` : ''}`);
      return null;
    } catch (error) {
      await candidate.$disconnect().catch(() => undefined);
      lastError = error;
    }
  }

  return new Error(
    `Unable to connect to database. Tried: ${attempted.join(', ')}. Last error: ${
      (lastError as Error)?.message || String(lastError)
    }`
  );
}

async function waitForDatabase(candidates: string[]) {
  const deadline = Date.now() + LOCAL_DATABASE_START_TIMEOUT_MS;
  let error = await tryConnect(candidates);

  while (error && Date.now() < deadline) {
    await delay(1_000);
    error = await tryConnect(candidates);
  }

  if (error) {
    throw error;
  }
}

export async function connectDatabase() {
  const candidates = getCandidateDatabaseUrls();
  if (candidates.length === 0) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const error = await tryConnect(candidates);
  if (!error) {
    return prisma;
  }

  if (!shouldAutoStartLocalDatabase(process.env.DATABASE_URL)) {
    throw error;
  }

  try {
    await startLocalDatabaseIfAvailable();
  } catch (startError) {
    throw new Error(
      `Unable to auto-start local database with Docker Compose. ${
        (startError as Error)?.message || String(startError)
      }\nOriginal database error: ${error.message}`
    );
  }

  await waitForDatabase(candidates);
  return prisma;
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
