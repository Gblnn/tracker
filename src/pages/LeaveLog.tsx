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
        supabase.from('employees').select('device_user_id, name, emp_id').order('name'),
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
    <div className="p-6 flex flex-col flex-1 overflow-hidden">
      
      {/* Header and Controls */}
      <div className="flex justify-between items-center mb-5 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Leave Logs</h2>
          <p className="text-sm text-slate-500">Log and manage employee leaves and returns</p>
        </div>

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

      {/* Filters Bar */}
      <div className="flex gap-3 mb-4 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search employee name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="All Leave Types" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200">
            <SelectItem value="ALL_TYPES">All Leave Types</SelectItem>
            {leaveTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4 shrink-0">
          {error}
        </div>
      )}

      {/* Main Table List */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 min-h-0">
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
        <DialogContent className="sm:max-w-md bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-650" />
              Log Employee Leave
            </DialogTitle>
            <DialogDescription>
              Record leave parameters and dates for the employee.
            </DialogDescription>
          </DialogHeader>

          {addError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5">
              {addError}
            </div>
          )}

          <div className="space-y-4 py-2">
            
            {/* Searchable Employee Selector */}
            <div className="relative employee-dropdown-container">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Employee <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setOpenEmpSelect(!openEmpSelect)}
                className="h-9 text-xs w-full bg-white border border-slate-200 rounded-md px-3 flex items-center justify-between shadow-sm hover:bg-slate-50 transition-colors text-left"
              >
                <span className="truncate text-slate-700 capitalize">
                  {selectedEmp ? `${selectedEmp.name.toLowerCase()} (Code: ${selectedEmp.device_user_id})` : "Choose Employee..."}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {openEmpSelect && (
                <div className="absolute left-0 right-0 mt-1 p-0 bg-white border border-slate-200 shadow-md rounded-md z-[100] max-h-[300px] overflow-hidden flex flex-col">
                  {/* Search Input Area */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search name or ID..."
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        className="text-xs bg-transparent border-0 outline-none w-full p-0 focus:ring-0 placeholder:text-slate-400 normal-case"
                        autoFocus
                      />
                      {empSearch && (
                        <button
                          type="button"
                          onClick={() => setEmpSearch("")}
                          className="text-slate-400 hover:text-slate-650"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List Area */}
                  <div className="overflow-y-auto py-1 max-h-[200px]">
                    {selectableEmployees.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-slate-400 font-medium">
                        No results found
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAddForm(f => ({ ...f, emp_id: '' }));
                            setOpenEmpSelect(false);
                            setEmpSearch("");
                          }}
                          className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 bg-transparent text-red-600 font-semibold"
                        >
                          -- Clear Selection --
                        </button>
                        {selectableEmployees.map((emp) => {
                          const isSelected = addForm.emp_id === emp.device_user_id;
                          const empVal = emp.device_user_id || emp.emp_id;
                          return (
                            <button
                              key={emp.device_user_id}
                              type="button"
                              onClick={() => {
                                setAddForm(f => ({ ...f, emp_id: empVal }));
                                setOpenEmpSelect(false);
                                setEmpSearch("");
                              }}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between capitalize font-medium ${
                                isSelected ? "bg-indigo-50 text-indigo-900" : "hover:bg-slate-50 bg-transparent"
                              }`}
                            >
                              <div className="truncate text-left">
                                <div>{emp.name.toLowerCase()}</div>
                                <div className="text-[10px] text-slate-400 font-normal normal-case">
                                  ID: {emp.device_user_id}
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Leave Type Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Leave Type / Status <span className="text-red-500">*</span>
              </label>
              <Select
                value={addForm.status}
                onValueChange={(val) => setAddForm(f => ({ ...f, status: val }))}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  {leaveTypes.map(t => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={addForm.from}
                  onChange={(e) => setAddForm(f => ({ ...f, from: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Return Date <span className="text-slate-400">(Optional)</span>
                </label>
                <Input
                  type="date"
                  value={addForm.till}
                  onChange={(e) => setAddForm(f => ({ ...f, till: e.target.value }))}
                  className="h-9 text-xs"
                />
                <span className="block mt-1 text-[9px] text-slate-450 leading-none">
                  Leave blank for perpetual leave
                </span>
              </div>
            </div>

          </div>

          <DialogFooter className="border-t border-slate-100 pt-3 flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAdding(false)}
              className="h-9 text-xs border border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving}
              className="h-9 text-xs bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Logging…' : 'Log Leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
