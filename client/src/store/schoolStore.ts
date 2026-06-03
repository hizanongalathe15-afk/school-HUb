import { create } from 'zustand';
import type { School } from '../types/school';

interface SchoolState {
  school: School | null;
  setSchool: (school: School) => void;
  updateSchool: (school: Partial<School>) => void;
}

export const useSchoolStore = create<SchoolState>((set) => ({
  school: null,
  setSchool: (school) => set({ school }),
  updateSchool: (updatedSchool) =>
    set((state) => ({
      school: state.school ? { ...state.school, ...updatedSchool } : null,
    })),
}));