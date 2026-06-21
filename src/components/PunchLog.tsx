import { useMemo, useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import type { Punch, Employee } from '../types/attendance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTime, VERIFY_LABELS, PUNCH_TYPE_LABELS } from '../lib/utilis';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';

const NATIONALITIES = [
  'nigerian',
  'omani',
  'indian',
  'pakistani',
  'bangladeshi',
  'nepalese',
  'sri lankan',
  'filipino',
  'egyptian',
  'sudanese',
  'yemeni',
  'jordanian',
  'syrian',
  'iraqi',
  'american',
  'british',
  'saudi',
  'emirati',
  'kuwaiti',
  'qatari',
  'bahraini',
];

interface PunchLogProps {
  punches: Punch[];
  employees: Employee[];
  onFilteredPunchesChange?: (punches: Punch[]) => void;
  onEmployeeAdded?: () => void;
}

export function PunchLog({ punches, employees, onFilteredPunchesChange, onEmployeeAdded }: PunchLogProps) {
  const [search, setSearch] = useState('');
  const [punchTypeFilter, setPunchTypeFilter] = useState<'all' | 0 | 1>('all');
  const [punchLocationFilter, setPunchLocationFilter] = useState('all');

  // Registration Dialog state
  const [registerUserId, setRegisterUserId] = useState<string | null>(null);
  const [registerName, setRegisterName] = useState('');
  const [registerDept, setRegisterDept] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerEmpId, setRegisterEmpId] = useState('');
  const [registerEmpType, setRegisterEmpType] = useState<'staff' | 'worker'>('staff');
  const [registerNationality, setRegisterNationality] = useState('');
  const [registerDesignation, setRegisterDesignation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const empMap = Object.fromEntries(employees.map((e) => [e.device_user_id, e]));
  const empIndex = Object.fromEntries(employees.map((e, i) => [e.device_user_id, i]));

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    punches.forEach(p => {
      if (p.location) locations.add(p.location);
    });
    return Array.from(locations).sort();
  }, [punches]);

  const filtered = punches.filter((p) => {
    const emp = empMap[p.user_id];
    const name = emp?.name ?? p.user_id; // Fallback to user_id if name is not available

    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesPunchType = punchTypeFilter === 'all' || p.punch_type === punchTypeFilter;
    const matchesLocation = punchLocationFilter === 'all' || p.location === punchLocationFilter;


    return matchesSearch && matchesPunchType && matchesLocation;
  });

  // Call the callback whenever filtered punches change
  useEffect(() => {
    if (onFilteredPunchesChange) {
      onFilteredPunchesChange(filtered);
    }
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUserId) return;
    if (!registerName.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from('employees')
        .insert({
          device_user_id: registerUserId.trim(),
          name: registerName.trim(),
          department: registerDept.trim() || null,
          email: registerEmail.trim() || null,
          emp_id: registerEmpId.trim() || null,
          emp_type: registerEmpType,
          nationality: registerNationality || null,
          designation: registerDesignation.trim() || null,
        });

      if (insertError) throw insertError;

      toast.success(`${registerName} added to employees successfully.`);
      setRegisterUserId(null);
      if (onEmployeeAdded) {
        onEmployeeAdded();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ width: "100%", height: '100%', border: "", display: "flex", flexFlow: "column", justifyContent: "flex-start" }}> {/* Make PunchLog itself a flex container that takes full height and hides overflow */}
      <div className="flex items-center gap-5 px-2 py-3 border-b border-gray-100 bg-white sticky top-0 z-20" style={{ border: "", width: "100%" }}> {/* Search bar is sticky relative to this parent */}
        <i className="ti ti-search text-gray-400 text-base" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search employee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none text-gray-700 bg-gray-50 placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
            <i className="ti ti-x text-sm" aria-hidden="true" />
          </button>
        )}

        <Select value={punchTypeFilter.toString()} onValueChange={(value) => setPunchTypeFilter(value === 'all' ? 'all' : parseInt(value) as 0 | 1)}>
          <SelectTrigger style={{ width: "fit-content" }} className=" h-9 text-sm bg-gray-50 border-gray-100 rounded-lg focus:ring-offset-0 focus:ring-gray-200">
            <SelectValue placeholder="Punch Type" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-gray-100 shadow-xl">
            <SelectItem value="all" className="rounded-md focus:bg-gray-50">
              All Types
            </SelectItem>
            <SelectItem value="0" className="rounded-md focus:bg-gray-50">
              Check-in
            </SelectItem>
            <SelectItem value="1" className="rounded-md focus:bg-gray-50">
              Check-out
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={punchLocationFilter} onValueChange={setPunchLocationFilter}>
          <SelectTrigger style={{ width: "fit-content" }} className=" h-9 text-sm bg-gray-50 border-gray-100 rounded-lg focus:ring-offset-0 focus:ring-gray-200">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="rounded-lg border-gray-100 shadow-xl">
            <SelectItem value="all" className="rounded-md focus:bg-gray-50">
              All Locations
            </SelectItem>
            {uniqueLocations.map(loc => (
              <SelectItem key={loc} value={loc} className="rounded-md focus:bg-gray-50">{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {search ? 'No results found.' : 'No punches recorded for this date.'}
        </div>
      ) : (
        <div className="overflow-auto flex-1" style={{ border: "", width: "100%" }}> {/* This div now handles both vertical and horizontal scrolling, taking remaining height */}
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10"> {/* Sticky relative to its new scrollable parent */}
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Verify</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((punch) => {
                const emp = empMap[punch.user_id];
                const name = emp?.name ?? punch.user_id;
                const idx = empIndex[punch.user_id] ?? 0;
                const isIn = punch.punch_type === 0;

                return (
                  <tr key={punch.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5" style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                        <Avatar size={"md"} name={name} index={idx} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{name}</span>
                            {!emp && (
                              <button
                                style={{ padding: "0.25rem" }}
                                onClick={() => {
                                  setRegisterUserId(punch.user_id);
                                  setRegisterName('');
                                  setRegisterDept('');
                                  setRegisterEmail('');
                                  setRegisterEmpId('');
                                  setRegisterEmpType('staff');
                                  setRegisterNationality('');
                                  setRegisterDesignation('');
                                }}
                                className=""
                              >
                                <UserPlus size={15} />
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">
                      {formatTime(punch.punch_time)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isIn
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                          }`}
                      >
                        <i
                          className={`ti ${isIn ? 'ti-login' : 'ti-logout'} text-[11px]`}
                          aria-hidden="true"
                        />
                        {PUNCH_TYPE_LABELS[punch.punch_type] ?? punch.punch_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">

                      {VERIFY_LABELS[punch.verify_type] ?? punch.verify_type}
                    </td>
                    <td className="px-4 py-3 text-gray-400 ">
                      {punch.location ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={registerUserId !== null} onOpenChange={(open) => { if (!open) setRegisterUserId(null); }}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>
              Register this employee in the system. Since they already punched on the device, they will be saved to the database.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterSubmit} className="space-y-4 ">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">Device User ID</label>
                <Input
                  type="text"
                  value={registerUserId || ''}
                  disabled
                  className="bg-gray-50 text-gray-500 font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">Employee ID (HR)</label>
                <Input
                  type="text"
                  value={registerEmpId}
                  onChange={(e) => setRegisterEmpId(e.target.value)}
                  placeholder="SS0001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 block">Full Name <span className="text-red-500">*</span></label>
              <Input
                type="text"
                required
                value={registerName.toLowerCase()}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="e.g. John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">Department</label>
                <Input
                  type="text"
                  value={registerDept}
                  onChange={(e) => setRegisterDept(e.target.value)}
                  placeholder="e.g. Operations"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">Designation</label>
                <Input
                  type="text"
                  value={registerDesignation}
                  onChange={(e) => setRegisterDesignation(e.target.value)}
                  placeholder="e.g. Engineer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">Employee Type</label>
                <select
                  value={registerEmpType}
                  onChange={(e) => setRegisterEmpType(e.target.value as 'staff' | 'worker')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white"
                >
                  <option value="staff">Staff</option>
                  <option value="worker">Worker</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 block">Nationality</label>
                <select
                  value={registerNationality}
                  onChange={(e) => setRegisterNationality(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white"
                >
                  <option value="">Select Nationality</option>
                  {NATIONALITIES.map((nat) => (
                    <option key={nat} value={nat.toLowerCase()}>
                      {nat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 block">Email</label>
              <Input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="john@company.com"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                style={{ flex: 1 }}
                type="button"
                variant="outline"
                onClick={() => setRegisterUserId(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button style={{ flex: 1 }} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
