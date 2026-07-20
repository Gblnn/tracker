import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Check, ChevronDown, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface LeaveRecord {
  id: number;
  emp_id: string;
  from: string;
  till: string | null;
  status: string;
  created_at: string;
  employee_name?: string;
}

interface Employee {
  device_user_id: string;
  name: string;
  emp_id: string;
  email?: string;
  id?: number;
}

interface LeaveLogProps {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}

export default function LeaveLog({ refreshTrigger, onLoadingChange }: LeaveLogProps = {}) {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Log Dialog
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    emp_id: '',
    from: '',
    till: '',
    status: 'Annual Leave'
  });
  const [addError, setAddError] = useState<string | null>(null);

  // Searchable Employee Select Dropdown States
  const [openEmpSelect, setOpenEmpSelect] = useState(false);
  const [empSearch, setEmpSearch] = useState('');

  const { userData } = useAuth();

  const canEditLeaves = useMemo(() => {
    try {
      const permissions = JSON.parse(userData?.clearance || "{}") as Record<string, boolean>;
      const hasStructuredClearance = Object.keys(permissions).length > 0;
      const hasAttendanceModule = permissions.attendance === true;
      const hasLeaveLogClearance = permissions.attendance_leave_log === true;
      const hasExplicitEditBlock = permissions.attendance_leave_log === false;

      if (hasAttendanceModule) {
        return hasLeaveLogClearance;
      }

      if (permissions.attendance === false || hasExplicitEditBlock) {
        return false;
      }

      if (userData?.role === "admin" || userData?.role === "site_admin") {
        return !hasStructuredClearance;
      }

      return false;
    } catch {
      return userData?.role === "admin" || userData?.role === "site_admin";
    }
  }, [userData]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (onLoadingChange) onLoadingChange(true);

    try {
      const [
        { data: empData, error: empErr },
        { data: leaveData, error: leaveErr }
      ] = await Promise.all([
        supabase.from('employees').select('device_user_id, name, emp_id').or('status.ilike.active,status.is.null').order('name'),
        supabase.from('leave_log').select('*').order('created_at', { ascending: false })
      ]);

      if (empErr) throw empErr;
      if (leaveErr) throw leaveErr;

      const empMap = new Map((empData || []).map(e => [e.device_user_id, e.name]));
      const resolvedLeaves = (leaveData || []).map((l: any) => ({
        ...l,
        employee_name: empMap.get(l.emp_id) || 'Unknown'
      }));

      setLeaves(resolvedLeaves);
      setEmployees(empData || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load leave logs.');
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }, [onLoadingChange]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Click Outside Handler for Searchable Employee Select
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (openEmpSelect && !target.closest('.employee-dropdown-container')) {
        setOpenEmpSelect(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openEmpSelect]);

  const handleAdd = async () => {
    if (!canEditLeaves) {
      toast.error('You do not have permission to log leaves.');
      return;
    }
    if (!addForm.emp_id) {
      setAddError('Please select an employee.');
      return;
    }
    if (!addForm.from) {
      setAddError('Please select a start date.');
      return;
    }
    if (addForm.till && addForm.till < addForm.from) {
      setAddError('Return date cannot be earlier than start date.');
      return;
    }

    setSaving(true);
    setAddError(null);
    try {
      const payload = {
        emp_id: addForm.emp_id,
        from: addForm.from,
        till: addForm.till || null,
        status: addForm.status
      };

      const { error: insErr } = await supabase
        .from('leave_log')
        .insert(payload);

      if (insErr) throw insErr;

      toast.success('Leave log recorded successfully.');
      setIsAdding(false);
      setAddForm({ emp_id: '', from: '', till: '', status: 'Annual Leave' });
      loadData();
    } catch (err: any) {
      console.error(err);
      setAddError(err.message || 'Failed to create leave log.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!canEditLeaves) {
      toast.error('You do not have permission to delete leave logs.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this leave log?')) {
      return;
    }

    toast.loading('Deleting leave log...', { id: `delete-leave-${id}` });
    try {
      const { error: delErr } = await supabase
        .from('leave_log')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;

      toast.success('Leave log deleted.', { id: `delete-leave-${id}` });
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete leave log.', { id: `delete-leave-${id}` });
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchesSearch = l.employee_name?.toLowerCase().includes(search.toLowerCase()) || 
        l.emp_id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || statusFilter === 'ALL_TYPES' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leaves, search, statusFilter]);

  const selectableEmployees = useMemo(() => {
    if (!empSearch.trim()) return employees;
    const q = empSearch.toLowerCase().trim();
    return employees.filter(emp =>
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.emp_id && emp.emp_id.toLowerCase().includes(q)) ||
      (emp.device_user_id && emp.device_user_id.toLowerCase().includes(q))
    );
  }, [employees, empSearch]);

  const selectedEmp = useMemo(() => {
    if (!addForm.emp_id) return null;
    return employees.find(emp =>
      emp.device_user_id === addForm.emp_id ||
      emp.emp_id === addForm.emp_id
    );
  }, [employees, addForm.emp_id]);

  const leaveTypes = ['Annual Leave', 'Sick Leave', 'Unpaid Leave', 'Casual Leave', 'Emergency Leave'];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
      className="p-6"
    >
      
      {/* Header and Controls */}
      {/* <div style={{ width: '100%', minWidth: 0 }} className="flex justify-between items-center mb-5 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Leave Logs</h2>
          <p className="text-sm text-slate-500">Log and manage employee leaves and returns</p>
        </div>

        
      </div> */}

      {/* Filters Bar */}
      <div style={{ width: '100%', minWidth: 0 }} className="flex gap-3 mb-4 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
          style={{ paddingLeft: '2.25rem', background:"rgba(100 100 100/ 0.05)", border:"none" }}
            type="text"
            placeholder="Search employee name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
          />
        </div>

        

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200">
            <SelectItem value="ALL_TYPES">All</SelectItem>
            {leaveTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canEditLeaves && (
          <Button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Log Leave
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 shrink-0">
          {error}
        </div>
      )}

      {/* Main Table List */}
      <div style={{ width: '100%', minWidth: 0 }} className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 min-h-0">
        {loading ? (
          <div className="flex justify-center items-center h-48 gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin w-4 h-4 text-slate-400" />
            Loading leaves logs...
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-slate-500 text-sm">
            No leave logs found.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Employee</TableHead>
                <TableHead className="font-semibold text-slate-700">Leave Type</TableHead>
                <TableHead className="font-semibold text-slate-700">From</TableHead>
                <TableHead className="font-semibold text-slate-700">Till (Return)</TableHead>
                {canEditLeaves && <TableHead className="font-semibold text-slate-700 text-center w-[80px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map(record => (
                <TableRow key={record.id} className="hover:bg-slate-50/50">
                  <TableCell className="py-3">
                    <div className="font-medium text-slate-900">{record.employee_name}</div>
                    <div className="text-xs text-slate-500 font-mono">Code: {record.emp_id}</div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'Sick Leave' ? 'bg-red-50 text-red-700 border border-red-100' :
                      record.status === 'Annual Leave' ? 'bg-green-50 text-green-700 border border-green-100' :
                      'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-slate-600">{record.from}</TableCell>
                  <TableCell className="py-3">
                    {record.till ? (
                      <span className="text-slate-600">{record.till}</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-orange-50 text-orange-800 text-[10px] font-semibold border border-orange-100">
                        Perpetual Leave
                      </span>
                    )}
                  </TableCell>
                  {canEditLeaves && (
                    <TableCell className="py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record.id)}
                        className="h-8 w-8 hover:text-red-650 hover:bg-red-50 text-slate-500 transition-colors"
                        title="Delete leave log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Log Leave Modal using Shadcn Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl">
          <DialogHeader className="border-b border-slate-100 px-6 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-slate-900">
                  Log Leave
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Record an employee leave period and return timeline.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            {addError && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {addError}
              </div>
            )}

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Employee</p>
                <p className="text-xs text-slate-400">Choose the employee you want to place on leave.</p>
              </div>

              <div className="relative employee-dropdown-container">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setOpenEmpSelect(!openEmpSelect)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm shadow-sm transition-colors hover:bg-slate-50"
                >
                  <span className="truncate text-slate-700 capitalize">
                    {selectedEmp ? `${selectedEmp.name.toLowerCase()} (${selectedEmp.device_user_id})` : 'Choose employee...'}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </button>

                {openEmpSelect && (
                  <div className="absolute left-0 right-0 z-[100] mt-2 flex max-h-[320px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <div style={{border:"", width:"100%"}} className="border-b border-slate-100 bg-slate-50/70 p-2.5">
                      <div  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search name or ID..."
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          className="w-full border-0 bg-transparent p-0 text-xs outline-none placeholder:text-slate-400 normal-case"
                          autoFocus
                        />
                        {empSearch && (
                          <button
                            type="button"
                            onClick={() => setEmpSearch('')}
                            className="text-slate-400 transition-colors hover:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{width:"100%"}} className="max-h-[220px] overflow-y-auto py-1.5">
                      {selectableEmployees.length === 0 ? (
                        <div className="px-3 py-5 text-center text-xs font-medium text-slate-400">
                          No results found
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            style={{marginBottom:"0.5rem", borderRadius:"0"}}
                            onClick={() => {
                              setAddForm(f => ({ ...f, emp_id: '' }));
                              setOpenEmpSelect(false);
                              setEmpSearch('');
                            }}
                            className="w-full bg-transparent px-3 py-2 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            Clear selection
                          </button>
                          {selectableEmployees.map((emp) => {
                            const isSelected = addForm.emp_id === emp.device_user_id;
                            const empVal = emp.device_user_id || emp.emp_id;
                            return (
                              <div
                                key={emp.device_user_id}
                          
                                onClick={() => {
                                  setAddForm(f => ({ ...f, emp_id: empVal }));
                                  setOpenEmpSelect(false);
                                  setEmpSearch('');
                                }}
                                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium capitalize transition-colors ${
                                  isSelected ? 'bg-slate-100 text-slate-900' : 'bg-transparent hover:bg-slate-50'
                                }`}
                              >
                                <div style={{width:"100%"}} className="min-w-0 truncate text-left">
                                  <div className="truncate">{emp.name.toLowerCase()}</div>
                                  <div className="truncate text-[10px] font-normal text-slate-400 normal-case">
                                    Device ID: {emp.device_user_id}
                                  </div>
                                </div>
                                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" />}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Leave Type <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={addForm.status}
                  onValueChange={(val) => setAddForm(f => ({ ...f, status: val }))}
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border-slate-200 bg-white text-sm shadow-sm">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent className="border border-slate-200 bg-white">
                    {leaveTypes.map(t => (
                      <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={addForm.from}
                    onChange={(e) => setAddForm(f => ({ ...f, from: e.target.value }))}
                    className="h-10 rounded-lg border-slate-200 text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Return Date <span className="text-slate-400">(Optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={addForm.till}
                    onChange={(e) => setAddForm(f => ({ ...f, till: e.target.value }))}
                    className="h-10 rounded-lg border-slate-200 text-sm shadow-sm"
                  />
                  <span className="mt-1.5 block text-[10px] leading-none text-slate-400">
                    Leave blank if the employee is on open-ended leave.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:justify-end">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsAdding(false)}
              className="h-10 flex-1 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving}
              className="h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Logging…' : 'Log Leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
