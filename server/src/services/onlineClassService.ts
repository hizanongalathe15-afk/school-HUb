import { prisma } from '../config/database.js';

export type OnlineClassStatus = 'scheduled' | 'live' | 'ended';

export interface FocusObservation {
  id: string;
  studentId: string;
  score: number;
  status: 'focused' | 'distracted' | 'idle' | 'away';
  signals: {
    visible: boolean;
    activeWindow: boolean;
    idleSeconds: number;
    faceDetected?: boolean;
    gazeCentered?: boolean;
  };
  createdAt: string;
}

export interface OnlineClassSession {
  id: string;
  title: string;
  subject: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  status: OnlineClassStatus;
  participants: string[];
  focusObservations: FocusObservation[];
  createdAt: string;
  updatedAt: string;
}

interface OnlineClassStore {
  sessions: OnlineClassSession[];
}

const STORE_KEY = 'online_classes';

const defaultSessions: OnlineClassSession[] = [
  {
    id: 'online-class-form-3a-math',
    title: 'Form 3A Mathematics Live Lesson',
    subject: 'Mathematics',
    classId: 'Form 3A',
    teacherId: 'demo-teacher',
    teacherName: 'Peter Teacher',
    startsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    meetingUrl: 'https://meet.jit.si/school-hub-form-3a-math',
    status: 'scheduled',
    participants: [],
    focusObservations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function readStore(): Promise<OnlineClassStore> {
  const setting = await prisma.setting.findUnique({ where: { key: STORE_KEY } });
  if (!setting) {
    return { sessions: defaultSessions };
  }

  const value = setting.value as unknown as OnlineClassStore;
  return {
    sessions: Array.isArray(value.sessions) ? value.sessions : defaultSessions
  };
}

async function writeStore(store: OnlineClassStore) {
  await prisma.setting.upsert({
    where: { key: STORE_KEY },
    update: { value: store as any, group: 'learning' },
    create: { key: STORE_KEY, value: store as any, group: 'learning' }
  });
}

function calculateFocus(signals: FocusObservation['signals']) {
  let score = 100;
  if (!signals.visible) score -= 35;
  if (!signals.activeWindow) score -= 25;
  if (signals.idleSeconds > 30) score -= Math.min(30, Math.floor(signals.idleSeconds / 2));
  if (signals.faceDetected === false) score -= 20;
  if (signals.gazeCentered === false) score -= 15;

  const normalized = Math.max(0, Math.min(100, score));
  const status: FocusObservation['status'] =
    normalized >= 75 ? 'focused' : normalized >= 45 ? 'distracted' : normalized >= 20 ? 'idle' : 'away';

  return { score: normalized, status };
}

export const onlineClassService = {
  async list() {
    const store = await readStore();
    return store.sessions;
  },

  async create(payload: Partial<OnlineClassSession>) {
    const store = await readStore();
    const now = new Date().toISOString();
    const session: OnlineClassSession = {
      id: `online-class-${Date.now()}`,
      title: payload.title?.trim() || 'New Online Class',
      subject: payload.subject?.trim() || 'General Studies',
      classId: payload.classId?.trim() || 'Unassigned',
      teacherId: payload.teacherId?.trim() || 'current-teacher',
      teacherName: payload.teacherName?.trim() || 'Class Teacher',
      startsAt: payload.startsAt || now,
      endsAt: payload.endsAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      meetingUrl: payload.meetingUrl?.trim() || `https://meet.jit.si/school-hub-${Date.now()}`,
      status: payload.status || 'scheduled',
      participants: [],
      focusObservations: [],
      createdAt: now,
      updatedAt: now
    };

    store.sessions.unshift(session);
    await writeStore(store);
    return session;
  },

  async join(sessionId: string, studentId: string) {
    const store = await readStore();
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return undefined;

    if (!session.participants.includes(studentId)) {
      session.participants.push(studentId);
    }
    session.status = 'live';
    session.updatedAt = new Date().toISOString();
    await writeStore(store);
    return session;
  },

  async recordFocus(sessionId: string, studentId: string, signals: FocusObservation['signals']) {
    const store = await readStore();
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return undefined;

    const focus = calculateFocus(signals);
    const observation: FocusObservation = {
      id: `focus-${Date.now()}`,
      studentId,
      score: focus.score,
      status: focus.status,
      signals,
      createdAt: new Date().toISOString()
    };

    session.focusObservations.unshift(observation);
    session.focusObservations = session.focusObservations.slice(0, 200);
    session.updatedAt = new Date().toISOString();
    await writeStore(store);
    return observation;
  }
};

