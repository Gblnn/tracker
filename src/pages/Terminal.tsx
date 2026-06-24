import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
  const [tasksLoading, setTasksLoading] = useState(false);

  const fetchTasks = async () => {
    setTasksLoading(true);
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
    } finally {
      setTasksLoading(false);
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
      <div style={{ display: 'flex', alignItems: "center", justifyContent: "center", fontSize: "0.8rem", userSelect: "text", WebkitUserSelect: "text" }} className="w-full h-full flex-1 bg-[#090d10] text-gray-300 p-6 text-left select-text">
        {tasksLoading ? <Loader2 className='animate-spin' /> : "no active tasks."}
      </div>
    );
  }

  const hasCompleted = tasks.some(t => t.status === 'acknowledged' || t.status === 'error');
  const completedCount = tasks.filter(t => t.status === 'acknowledged' || t.status === 'error').length;

  return (
    <div style={{ border: "", alignItems: "flex-start", justifyContent: "flex-start", fontSize: "0.8rem", userSelect: "text", WebkitUserSelect: "text" }} className="w-full h-full flex-1 bg-[#090d10] text-gray-300 p-6 text-left flex flex-col gap-2 overflow-hidden select-text font-mono">
      {/* Clear Terminal action bar */}
      <div style={{ justifyContent: "space-between" }} className="flex justify-between items-center w-full border-b border-gray-800 pb-3 mb-2 shrink-0">
        <span style={{ border: "1px solid rgba(100 100 100/ 0.5)", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", fontWeight: "500" }} className="text-gray-500 text-xs uppercase tracking-wider font-semibold">All Tasks</span>

        {/* Confirmation dialog trigger */}
        <ClearConfirmDialog
          disabled={!hasCompleted || clearing}
          clearing={clearing}
          completedCount={completedCount}
          onConfirm={clearCompletedTasks}
        />
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
            ? ` ${task.employees.name} (${task.employees.device_user_id})`
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
                Task #{task.id}: {task.command_type} {employeeInfo} to device {task.device_serial} {deviceLocation}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Clear Terminal confirmation dialog using shadcn ── */
function ClearConfirmDialog({
  disabled,
  clearing,
  completedCount,
  onConfirm,
}: {
  disabled: boolean;
  clearing: boolean;
  completedCount: number;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      {/* Trigger button */}
      <button
        id="clear-terminal-btn"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="px-3 py-1.5 text-[11px] font-semibold bg-gray-900 border border-gray-800 disabled:opacity-30 disabled:hover:border-gray-800 disabled:hover:text-gray-400 hover:border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all disabled:cursor-not-allowed"
      >
        {clearing ? 'Clearing...' : 'Clear Terminal'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[360px] bg-[#0f1419] border-gray-800 text-white p-6 rounded-xl">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <DialogTitle style={{ fontWeight: "500", fontSize: "1rem" }} className="text-sm font-semibold text-white leading-relaxed">Clear Terminal</DialogTitle>
            <DialogDescription style={{ fontSize: "0.8rem" }} className="text-xs text-gray-400 leading-relaxed text-center">
              This will permanently delete{' '}
              <span className="font-semibold text-gray-200">{completedCount}</span>{' '}
              {completedCount === 1 ? 'task' : 'tasks'} from the queue.
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 mt-4 sm:justify-center w-full">
            <Button
              id="clear-terminal-cancel-btn"
              onClick={() => setOpen(false)}
              variant="outline"
              type="button"
              className="flex-1 rounded-lg border-gray-700 bg-gray-800/60 hover:bg-gray-700 text-xs font-semibold text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              id="clear-terminal-confirm-btn"
              onClick={handleConfirm}
              variant="destructive"
              type="button"
              className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white active:scale-[0.97]"
            >
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
