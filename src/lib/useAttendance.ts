import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Punch, Employee, EmployeeSummary } from '../types/attendance';

export function useAttendance(date: string) {
  const [punches, setPunches] = useState<Punch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const start = `${date}T00:00:00`;
      const end = `${date}T23:59:59`;

      const [{ data: punchData, error: punchError }, { data: empData, error: empError }] =
        await Promise.all([
          supabase
            .from('punch_details')
            .select('*')
            .gte('punch_time', start)
            .lte('punch_time', end)
            .order('punch_time', { ascending: false }),
          supabase.from('employees').select('*').order('name', { ascending: true }),
        ]);

      if (punchError) throw punchError;
      if (empError) throw empError;

      setPunches(punchData ?? []);
      setEmployees(empData ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`punches:${date}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'punches' },
        (payload) => {
          const newPunch = payload.new as Punch;
          // Only add if punch is for the currently viewed date
          const punchDate = new Date(newPunch.punch_time)
            .toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
          if (punchDate === date) {
            setPunches((prev) => [newPunch, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  // Derived: employee summaries
  const employeeSummaries: EmployeeSummary[] = employees.map((emp) => {
    const empPunches = punches.filter((p) => p.user_id === emp.device_user_id);
    const checkIns = empPunches.filter((p) => p.punch_type === 0);
    const checkOuts = empPunches.filter((p) => p.punch_type === 1);
    return {
      ...emp,
      totalPunches: empPunches.length,
      firstIn: checkIns.at(-1)?.punch_time ?? null,
      lastOut: checkOuts.at(0)?.punch_time ?? null,
      isPresent: empPunches.length > 0,
    };
  });

  const stats = {
    total: employees.length,
    present: employeeSummaries.filter((e) => e.isPresent).length,
    absent: employees.length - employeeSummaries.filter((e) => e.isPresent).length,
    checkIns: punches.filter((p) => p.punch_type === 0).length,
    checkOuts: punches.filter((p) => p.punch_type === 1).length,
  };

  const latestPunch = punches
  .sort(
    (a, b) =>
      new Date(b.punch_time).getTime() -
      new Date(a.punch_time).getTime()
  )[0]

  return { punches, employees, employeeSummaries, stats, location:latestPunch?.location ?? null, loading, error, refetch: fetchData };
}
