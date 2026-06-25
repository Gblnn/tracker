import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Punch, Employee, EmployeeSummary } from '../types/attendance';

export function useAttendance(date: string) {
  const [punches, setPunches] = useState<Punch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [primaryLocations, setPrimaryLocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const start = `${date}T00:00:00`;
      const end = `${date}T23:59:59`;

      const yearMonth = date.substring(0, 7);
      const startOfMonthStr = `${yearMonth}-01T00:00:00`;

      const [
        { data: punchData, error: punchError },
        { data: empData, error: empError },
        { data: devData, error: devError }
      ] = await Promise.all([
        supabase
          .from('punches')
          .select('*')
          .gte('punch_time', start)
          .lte('punch_time', end)
          .order('punch_time', { ascending: false }),
        supabase.from('employees').select('*').order('name', { ascending: true }),
        supabase.from('devices').select('serial_no, location')
      ]);

      if (punchError) throw punchError;
      if (empError) throw empError;
      if (devError) throw devError;

      // Fetch all historical punches for the month with pagination (capped at max 10 pages / 10000 records)
      let historicalPunchData: any[] = [];
      let from = 0;
      let to = 999;
      let finished = false;
      let page = 0;

      while (!finished && page < 10) {
        const { data, error: historicalError } = await supabase
          .from('punches')
          .select('user_id, device_serial')
          .gte('punch_time', startOfMonthStr)
          .order('punch_time', { ascending: false })
          .range(from, to);

        if (historicalError) throw historicalError;

        if (data && data.length > 0) {
          historicalPunchData = [...historicalPunchData, ...data];
          if (data.length < 1000) {
            finished = true;
          } else {
            from += 1000;
            to += 1000;
            page++;
          }
        } else {
          finished = true;
        }
      }

      const deviceMap = Object.fromEntries(
        (devData ?? []).map(d => [d.serial_no, d.location])
      );

      const punchesWithLocation = (punchData ?? []).map(p => ({
        ...p,
        location: deviceMap[p.device_serial] ?? '—'
      }));

      // Count location frequencies for the current month
      const userLocationCounts: Record<string, Record<string, number>> = {};
      (historicalPunchData ?? []).forEach(p => {
        const loc = deviceMap[p.device_serial];
        if (loc) {
          if (!userLocationCounts[p.user_id]) {
            userLocationCounts[p.user_id] = {};
          }
          userLocationCounts[p.user_id][loc] = (userLocationCounts[p.user_id][loc] || 0) + 1;
        }
      });

      const primLocs: Record<string, string> = {};
      Object.entries(userLocationCounts).forEach(([userId, counts]) => {
        let mostFrequentLoc = '';
        let maxCount = 0;
        Object.entries(counts).forEach(([loc, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mostFrequentLoc = loc;
          }
        });
        if (mostFrequentLoc) {
          primLocs[userId] = mostFrequentLoc;
        }
      });

      setPrimaryLocations(primLocs);
      setPunches(punchesWithLocation);
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
        async (payload) => {
          const newPunch = payload.new as Punch;
          // Only add if punch is for the currently viewed date
          const punchDate = new Date(newPunch.punch_time)
            .toLocaleDateString('en-CA', { timeZone: 'Asia/Muscat' });
          if (punchDate === date) {
            const { data: dev } = await supabase
              .from('devices')
              .select('location')
              .eq('serial_no', newPunch.device_serial)
              .maybeSingle();

            const punchWithLoc = {
              ...newPunch,
              location: dev?.location ?? '—'
            };
            setPunches((prev) => [punchWithLoc, ...prev]);
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

    const sortedEmpPunches = [...empPunches].sort(
      (a, b) => new Date(b.punch_time).getTime() - new Date(a.punch_time).getTime()
    );
    const latestLocation = sortedEmpPunches[0]?.location ?? null;
    const primaryLocation = primaryLocations[emp.device_user_id] ?? null;

    return {
      ...emp,
      totalPunches: empPunches.length,
      firstIn: checkIns.at(-1)?.punch_time ?? null,
      lastOut: checkOuts.at(0)?.punch_time ?? null,
      isPresent: empPunches.length > 0,
      location: latestLocation || primaryLocation || emp.location || null,
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

  return { punches, employees, employeeSummaries, stats, location: latestPunch?.location ?? null, loading, error, refetch: fetchData };
}
