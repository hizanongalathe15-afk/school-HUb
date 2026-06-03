export interface Setting {
  id: string;
  key: string;
  value: any;
  group: string;
  updatedBy?: string;
}

export interface SystemConfig {
  schoolName: string;
  timezone: string;
  currency: string;
  academicYear: string;
  terms: string[];
  gradingSystem: GradingScale[];
}

export interface GradingScale {
  grade: string;
  minScore: number;
  maxScore: number;
  points: number;
}