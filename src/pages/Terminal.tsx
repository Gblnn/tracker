import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CommandTask {
  id: number;
  device_serial: string;
  command_type: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'error' | 'cancelled';
  created_at: string;
  employees: {
    name: string;
    device_user_id: string;
  } | null;
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  } catch (e) {
    return isoString;
  }
}

export default function Terminal() {
  const [tasks, setTasks] = useState<CommandTask[]>([]);
  const [deviceLocationMap, setDeviceLocationMap] = useState<Record<string, string>>({});
  const [clearing, setClearing] = useState(false);

  const fetchTasks = async () => {
    try {
      // Fetch devices to build location lookup map
      const { data: devicesData } = await supabase
        .from('devices')
        .select('serial_no, location');

      const locMap: Record<string, string> = {};
      if (devicesData) {
        devicesData.forEach(d => {
          if (d.location) {
            locMap[d.serial_no] = d.location;
          }
        });
      }
      setDeviceLocationMap(locMap);

      // Fetch active tasks with employee details
      const { data } = await supabase
        .from('device_commands')
        .select('id, device_serial, command_type, status, created_at, employees(name, device_user_id)')
        .neq('status', 'cancelled')
        .order('id', { ascending: true });

      setTasks((data as any) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const clearCompletedTasks = async () => {
    const completedIds = tasks
      .filter(t => t.status === 'acknowledged' || t.status === 'error')
      .map(t => t.id);

    if (completedIds.length === 0) {
      toast.error('No completed or failed tasks to clear.');
      return;
    }

    setClearing(true);
    try {
      const { error } = await supabase
        .from('device_commands')
        .delete()
        .in('id', completedIds);

      if (error) throw error;
      toast.success(`Successfully cleared ${completedIds.length} completed tasks.`);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear completed tasks.');
      console.error('Failed to clear completed tasks:', err.message);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('device_commands_minimal')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'device_commands' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    // Fallback polling interval every 3 seconds to guarantee updates
    const intervalId = setInterval(() => {
      fetchTasks();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, []);

  if (tasks.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: "flex-start", justifyContent: "flex-start", fontSize: "0.8rem", userSelect: "text", WebkitUserSelect: "text" }} className="w-full h-full flex-1 bg-[#090d10] text-gray-300 p-6 text-left select-text">
        no active tasks.
      </div>
    );
  }

  const hasCompleted = tasks.some(t => t.status === 'acknowledged' || t.status === 'error');

  return (
    <div style={{ border: "", alignItems: "flex-start", justifyContent: "flex-start", fontSize: "0.8rem", userSelect: "text", WebkitUserSelect: "text" }} className="w-full h-full flex-1 bg-[#090d10] text-gray-300 p-6 text-left flex flex-col gap-2 overflow-hidden select-text font-mono">
      {/* Clear Terminal action bar */}
      <div style={{ justifyContent: "space-between" }} className="flex justify-between items-center w-full border-b border-gray-800 pb-3 mb-2 shrink-0">
        <span style={{ border: "1px solid rgba(100 100 100/ 0.5)", padding: "0.1rem 0.35rem", borderRadius: "0.25rem" }} className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Active Sync Queue</span>
        <button
          onClick={clearCompletedTasks}
          disabled={!hasCompleted || clearing}
          className="px-3 py-1.5 text-[11px] font-semibold bg-gray-900 border border-gray-800 disabled:opacity-30 disabled:hover:border-gray-800 disabled:hover:text-gray-400 hover:border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all disabled:cursor-not-allowed"
        >
          {clearing ? 'Clearing...' : 'Clear Terminal'}
        </button>
      </div>

      {/* Scrollable tasks list */}
      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start", userSelect: "text", WebkitUserSelect: "text" }} className="flex-1 w-full overflow-y-auto flex flex-col gap-2 pr-1 select-text">
        {tasks.map((task) => {
          let statusTag = '';
          let colorClass = '';

          if (task.status === 'pending') {
            statusTag = '[PENDING]';
            colorClass = 'text-amber-500';
          } else if (task.status === 'sent') {
            statusTag = '[DISPATCH]';
            colorClass = 'text-blue-400';
          } else if (task.status === 'acknowledged') {
            statusTag = '[SUCCESS]';
            colorClass = 'text-emerald-400';
          } else if (task.status === 'error') {
            statusTag = '[FAILED]  ';
            colorClass = 'text-rose-500';
          }

          const employeeInfo = task.employees
            ? `for ${task.employees.name} (${task.employees.device_user_id})`
            : '';

          const deviceLocation = deviceLocationMap[task.device_serial]
            ? `(${deviceLocationMap[task.device_serial]})`
            : '';

          return (
            <div key={task.id} className="flex gap-2 font-mono select-text" style={{ userSelect: "text", WebkitUserSelect: "text" }}>
              <span className="text-gray-500 shrink-0 select-text font-normal" style={{ color: "#556877", userSelect: "text", WebkitUserSelect: "text" }}>
                [{formatTime(task.created_at)}]
              </span>
              <span className={`${colorClass} font-semibold shrink-0 select-text`} style={{ userSelect: "text", WebkitUserSelect: "text" }}>{statusTag}</span>
              <span className="select-text" style={{ userSelect: "text", WebkitUserSelect: "text" }}>
                Task #{task.id}: {task.command_type} {employeeInfo} on device {task.device_serial} {deviceLocation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
