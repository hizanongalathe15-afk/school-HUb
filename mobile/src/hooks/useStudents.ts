import { useCallback, useEffect, useState } from 'react';
import { mobileApi } from '../services';
import type { MobileStudent, StudentResult } from '../types';

export function useStudents() {
  const [students, setStudents] = useState<MobileStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await mobileApi.getStudents();
    setStudents(rows);
    setSelectedStudentId((current) => current || rows[0]?.id || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedStudentId) {
      setResults([]);
      return;
    }

    mobileApi.getResults(selectedStudentId).then(setResults);
  }, [selectedStudentId]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId) || students[0];

  return { students, selectedStudent, selectedStudentId, setSelectedStudentId, results, loading, refresh };
}
