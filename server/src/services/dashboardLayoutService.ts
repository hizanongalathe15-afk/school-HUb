import { Role } from '@prisma/client';
import { readSetting, writeSetting } from './settingStore.js';

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'workflow' | 'record' | 'action';
  title: string;
  body: string;
  order: number;
  locked?: boolean;
}

export interface DashboardLayout {
  moduleId: string;
  role: Role;
  widgets: DashboardWidget[];
  updatedAt: string;
}

function key(role: string, moduleId: string) {
  return `dashboard_layout:${role}:${moduleId}`;
}

export const dashboardLayoutService = {
  async get(role: Role, moduleId: string) {
    const fallback: DashboardLayout = {
      role,
      moduleId,
      updatedAt: new Date().toISOString(),
      widgets: []
    };
    return readSetting(key(role, moduleId), fallback);
  },

  async save(role: Role, moduleId: string, widgets: DashboardWidget[]) {
    const normalized = widgets.map((widget, index) => ({
      id: widget.id || `widget-${Date.now()}-${index}`,
      type: widget.type || 'record',
      title: String(widget.title || 'Untitled widget').trim(),
      body: String(widget.body || '').trim(),
      order: index,
      locked: Boolean(widget.locked)
    }));

    return writeSetting(key(role, moduleId), 'dashboard-layouts', {
      role,
      moduleId,
      widgets: normalized,
      updatedAt: new Date().toISOString()
    });
  }
};

