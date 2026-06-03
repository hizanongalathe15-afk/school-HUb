import { useCallback, useEffect, useState } from 'react';
import { mobileApi } from '../services';
import type { AttendanceDay } from '../types';

export function useAttendance() {
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await mobileApi.getAttendance();
    setDays(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function byStudent(studentId: string) {
    return days.filter((day) => day.studentId === studentId);
  }

  return { days, loading, refresh, byStudent };
}
