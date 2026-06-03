import { prisma } from '../config/database.js';

export async function readSetting<TValue>(key: string, fallback: TValue): Promise<TValue> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return fallback;
  return setting.value as unknown as TValue;
}

export async function writeSetting<TValue>(key: string, group: string, value: TValue) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as any, group },
    create: { key, value: value as any, group }
  });
  return value;
}

