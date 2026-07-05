import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Punch, Employee, EmployeeSummary } from '../types/attendance';
import { parsePunchLocation } from './geofence';

export function useAttendance(date: string) {
  const [useFirstLast, setUseFirstLast] = useState<boolean>(true);
  const [punches, setPunches] = useState<Punch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [primaryLocations, setPrimaryLocations] = useState<Record<string, string>>({});
  const [devicesMap, setDevicesMap] = useState<Record<string, { serial_no?: string; start_time: string | null; end_time: string | null; location: string | null }>>({});
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
        supabase.from('devices').select('serial_no, location, start_time, end_time')
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

      const devMap = Object.fromEntries(
        (devData ?? []).map(d => [d.serial_no, d])
      );
      setDevicesMap(devMap);

      const punchesWithLocation = (punchData ?? []).map(p => {
        const devLoc = devMap[p.device_serial]?.location;
        const { location, coordinates } = parsePunchLocation(p.mobile_location, devLoc);
        return {
          ...p,
          location,
          coordinates
        };
      });

      // Count location frequencies for the current month
      const userLocationCounts: Record<string, Record<string, number>> = {};
      (historicalPunchData ?? []).forEach(p => {
        const loc = devMap[p.device_serial]?.location;
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
              .select('location, start_time, end_time')
              .eq('serial_no', newPunch.device_serial)
              .maybeSingle();

            if (dev) {
              setDevicesMap(prev => ({
                ...prev,
                [newPunch.device_serial]: {
                  serial_no: newPunch.device_serial,
                  location: dev.location,
                  start_time: dev.start_time,
                  end_time: dev.end_time
                }
              }));
            }

            const { location, coordinates } = parsePunchLocation(newPunch.mobile_location, dev?.location);
            const punchWithLoc = {
              ...newPunch,
              location,
              coordinates
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

    // Sort oldest to newest
    const chronologicalPunches = [...empPunches].sort(
      (a, b) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime()
    );

    let firstInPunch: Punch | undefined = undefined;
    let lastOutPunch: Punch | undefined = undefined;

    if (useFirstLast) {
      if (chronologicalPunches.length > 0) {
        firstInPunch = chronologicalPunches[0];
        if (chronologicalPunches.length > 1) {
          const last = chronologicalPunches[chronologicalPunches.length - 1];
          const diffMs = new Date(last.punch_time).getTime() - new Date(firstInPunch.punch_time).getTime();
          if (diffMs > 5 * 60 * 1000) { // 5 minutes threshold
            lastOutPunch = last;
          }
        }
      }
    } else {
      const checkIns = chronologicalPunches.filter((p) => p.punch_type === 0);
      const checkOuts = chronologicalPunches.filter((p) => p.punch_type === 1);
      firstInPunch = checkIns[0];
      const last = checkOuts[checkOuts.length - 1];
      if (firstInPunch && last) {
        const diffMs = Math.abs(new Date(last.punch_time).getTime() - new Date(firstInPunch.punch_time).getTime());
        if (diffMs > 5 * 60 * 1000) { // 5 minutes threshold
          lastOutPunch = last;
        }
      } else {
        lastOutPunch = last;
      }
    }

    const latestLocation = chronologicalPunches[chronologicalPunches.length - 1]?.location ?? null;
    const primaryLocation = primaryLocations[emp.device_user_id] ?? null;

    const firstInDevice = firstInPunch ? devicesMap[firstInPunch.device_serial] : null;
    const lastOutDevice = lastOutPunch ? devicesMap[lastOutPunch.device_serial] : null;

    const remarks: string[] = [];

    if (firstInPunch && firstInDevice?.start_time && firstInDevice.start_time.includes(':')) {
      const punchTimeParts = getLocalTimeParts(firstInPunch.punch_time);
      const [startHour, startMin] = firstInDevice.start_time.split(':').map(Number);
      if (punchTimeParts) {
        const punchMins = punchTimeParts.hour * 60 + punchTimeParts.minute;
        const startMins = startHour * 60 + startMin;
        const diff = punchMins - startMins;
        if (diff > 20) {
          remarks.push(`Late in by ${formatDuration(diff)}`);
        }
      }
    }

    if (lastOutPunch && lastOutDevice?.end_time && lastOutDevice.end_time.includes(':')) {
      const punchTimeParts = getLocalTimeParts(lastOutPunch.punch_time);
      const [endHour, endMin] = lastOutDevice.end_time.split(':').map(Number);
      if (punchTimeParts) {
        const punchMins = punchTimeParts.hour * 60 + punchTimeParts.minute;
        const endMins = endHour * 60 + endMin;
        const diff = endMins - punchMins;
        if (diff > 10) {
          remarks.push(`Early out by ${formatDuration(diff)}`);
        }
      }
    }

    return {
      ...emp,
      totalPunches: empPunches.length,
      firstIn: firstInPunch?.punch_time ?? null,
      lastOut: lastOutPunch?.punch_time ?? null,
      isPresent: empPunches.length > 0,
      location: latestLocation || primaryLocation || emp.location || null,
      remarks,
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

  return { punches, employees, employeeSummaries, stats, location: latestPunch?.location ?? null, loading, error, refetch: fetchData, useFirstLast, setUseFirstLast };
}

function getLocalTimeParts(iso: string): { hour: number; minute: number } | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: 'Asia/Muscat'
    });
    const parts = formatter.formatToParts(new Date(iso));
    const hourPart = parts.find(p => p.type === 'hour')?.value;
    const minutePart = parts.find(p => p.type === 'minute')?.value;
    if (hourPart && minutePart) {
      return {
        hour: parseInt(hourPart, 10),
        minute: parseInt(minutePart, 10)
      };
    }
  } catch (e) {
    console.error('Error parsing local time parts:', e);
  }
  return null;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}
