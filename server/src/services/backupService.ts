import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export const backupService = {
  async list() {
    try {
      const backupsDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const files = fs.readdirSync(backupsDir)
        .filter(f => f.endsWith('.sql') || f.endsWith('.json'))
        .map(f => {
          const stats = fs.statSync(path.join(backupsDir, f));
          return {
            id: f.replace('.sql', '').replace('.json', ''),
            filename: f,
            size: stats.size,
            createdAt: stats.mtime.toISOString(),
            status: 'completed'
          };
        });

      return backupsDir;
    } catch (error) {
      return [];
    }
  },

  async create(name?: string) {
    try {
      const backupsDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${name || timestamp}.sql`;
      const filepath = path.join(backupsDir, filename);

      const dbUrl = process.env.DATABASE_URL!;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!match) {
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, user, password, host, port, database] = match;
      const env = { PGPASSWORD: password };

      await execAsync(`pg_dump -U ${user} -h ${host} -p ${port} -d ${database} -f ${filepath}`, { env });

      return { id: timestamp, filename, status: 'completed', createdAt: new Date().toISOString() };
    } catch (error: any) {
      console.error('Backup error:', error);
      return { id: Date.now().toString(), filename: 'failed', status: 'failed', error: error.message };
    }
  },

  async restore(backupId: string) {
    try {
      const backupsDir = path.join(process.cwd(), 'backups');
      const filepath = path.join(backupsDir, `${backupId}.sql`);

      if (!fs.existsSync(filepath)) {
        throw new Error('Backup file not found');
      }

      const dbUrl = process.env.DATABASE_URL!;
      if (!dbUrl) {
        throw new Error('DATABASE_URL is not set');
      }

      const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!match) {
        throw new Error('Invalid DATABASE_URL format');
      }

      const [, user, password, host, port, database] = match;
      const env = { PGPASSWORD: password };

      await execAsync(`psql -U ${user} -h ${host} -p ${port} -d ${database} -f ${filepath}`, { env });

      return { success: true, message: 'Backup restored successfully' };
    } catch (error: any) {
      console.error('Restore error:', error);
      return { success: false, error: error.message };
    }
  }
};