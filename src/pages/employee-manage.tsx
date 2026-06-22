import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Loader2, Monitor, Plus, Search, SquareCheck, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '../components/Avatar';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../components/ui/empty';
import { supabase } from '../lib/supabase';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Device {
    id: number;
    serial_no: string;
    location: string | null;
}

function buildAddUserCommand(cmdId: number, pin: string, name: string): string {
    const safeName = name.replace(/\t/g, ' ').slice(0, 24);
    return `C:${cmdId}:DATA UPDATE USERINFO PIN=${pin}\tName=${safeName}\tPri=0\tPasswd=\tCard=\tGrp=1\tTZ=0000000100000000\tVerify=0\tViceCard=`;
}

const NATIONALITIES = [
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

interface ManageEmployee {
    id: number;
    device_user_id: string;
    name: string;
    department: string | null;
    email: string | null;
    emp_id: string | null;
    emp_type: 'staff' | 'worker' | null;
    nationality: string | null;
    designation: string | null;
    created_at?: string;
}

export default function EmployeeManage() {
    const [employees, setEmployees] = useState<ManageEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);

    // Selection and bulk states
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
    const [isBulkDeptOpen, setIsBulkDeptOpen] = useState(false);
    const [bulkDeptValue, setBulkDeptValue] = useState('');
    const [isBulkTypeOpen, setIsBulkTypeOpen] = useState(false);
    const [bulkTypeValue, setBulkTypeValue] = useState<'staff' | 'worker'>('staff');
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const toggleSelectEmployee = (id: number) => {
        setSelectedEmployeeIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Edit states
    const [editingEmployee, setEditingEmployee] = useState<ManageEmployee | null>(null);
    const [editName, setEditName] = useState('');
    const [editDeviceUserId, setEditDeviceUserId] = useState('');
    const [editDept, setEditDept] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editEmpId, setEditEmpId] = useState('');
    const [editEmpType, setEditEmpType] = useState<'staff' | 'worker'>('staff');
    const [editNationality, setEditNationality] = useState('');
    const [editDesignation, setEditDesignation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add states
    const [isAdding, setIsAdding] = useState(false);
    const [addName, setAddName] = useState('');
    const [addDeviceUserId, setAddDeviceUserId] = useState('');
    const [addDept, setAddDept] = useState('');
    const [addEmail, setAddEmail] = useState('');
    const [addEmpId, setAddEmpId] = useState('');
    const [addEmpType, setAddEmpType] = useState<'staff' | 'worker'>('staff');
    const [addNationality, setAddNationality] = useState('');
    const [addDesignation, setAddDesignation] = useState('');
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
    const [loadingDevices, setLoadingDevices] = useState(false);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('employees')
                .select('*')
                .order('name', { ascending: true });

            if (err) throw err;
            setEmployees(data || []);
        } catch (e: any) {
            setError(e.message || 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDevices = useCallback(async () => {
        setLoadingDevices(true);
        const { data, error: err } = await supabase
            .from('devices')
            .select('id, serial_no, location')
            .order('id', { ascending: true });
        if (!err) setDevices(data ?? []);
        setLoadingDevices(false);
    }, []);

    function toggleDevice(serial: string) {
        setSelectedDevices(prev => {
            const next = new Set(prev);
            if (next.has(serial)) next.delete(serial);
            else next.add(serial);
            return next;
        });
    }

    function toggleAllDevices() {
        if (selectedDevices.size === devices.length) {
            setSelectedDevices(new Set());
        } else {
            setSelectedDevices(new Set(devices.map(d => d.serial_no)));
        }
    }

    const handleAddSubmit = async (e: React.FormEvent, pushToDevices: boolean) => {
        e.preventDefault();
        if (!addName.trim()) {
            toast.error('Name is required');
            return;
        }
        if (!addDeviceUserId.trim()) {
            toast.error('Device User ID is required');
            return;
        }
        if (pushToDevices && selectedDevices.size === 0) {
            toast.error('Please select at least one device to push to');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Insert employee
            const { data: empData, error: empErr } = await supabase
                .from('employees')
                .insert({
                    device_user_id: addDeviceUserId.trim(),
                    name: addName.trim(),
                    department: addDept.trim() || null,
                    email: addEmail.trim() || null,
                    emp_id: addEmpId.trim() || null,
                    emp_type: addEmpType,
                    nationality: addNationality || null,
                    designation: addDesignation.trim() || null,
                })
                .select()
                .single();

            if (empErr) throw empErr;

            // 2. If pushToDevices is true, insert device commands
            if (pushToDevices && selectedDevices.size > 0) {
                const commands = [...selectedDevices].map(serial => ({
                    device_serial: serial,
                    command: buildAddUserCommand(Date.now() + Math.floor(Math.random() * 1000), addDeviceUserId.trim(), addName.trim()),
                    command_type: 'ADD_USER',
                    employee_id: empData.id,
                    status: 'pending',
                }));

                const { error: cmdErr } = await supabase.from('device_commands').insert(commands);
                if (cmdErr) throw new Error(`Employee added, but failed to queue device commands: ${cmdErr.message}`);
            }

            toast.success(pushToDevices
                ? `Employee added and queued for ${selectedDevices.size} device(s).`
                : 'Employee saved successfully without pushing.'
            );

            // Reset form
            setAddName('');
            setAddDeviceUserId('');
            setAddDept('');
            setAddEmail('');
            setAddEmpId('');
            setAddEmpType('staff');
            setAddNationality('');
            setAddDesignation('');
            setSelectedDevices(new Set());
            setIsAdding(false);
            fetchEmployees();
        } catch (err: any) {
            toast.error(err.message || 'Failed to add employee');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchDevices();
    }, [fetchEmployees, fetchDevices]);

    // Compile unique departments for filtering
    const uniqueDepartments = useMemo(() => {
        const depts = new Set<string>();
        employees.forEach((emp) => {
            if (emp.department) depts.add(emp.department);
        });
        return Array.from(depts).sort();
    }, [employees]);
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee) return;
        if (!editName.trim()) {
            toast.error('Name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: updateError } = await supabase
                .from('employees')
                .update({
                    device_user_id: editDeviceUserId.trim(),
                    name: editName.trim(),
                    department: editDept.trim() || null,
                    email: editEmail.trim() || null,
                    emp_id: editEmpId.trim() || null,
                    emp_type: editEmpType,
                    nationality: editNationality || null,
                    designation: editDesignation.trim() || null,
                })
                .eq('id', editingEmployee.id);

            if (updateError) throw updateError;

            toast.success('Employee updated successfully');
            setEditingEmployee(null);
            fetchEmployees(); // Refresh data
        } catch (err: any) {
            toast.error(err.message || 'Failed to update employee');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDeptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEmployeeIds.size === 0) return;
        setIsSubmitting(true);
        try {
            const { error: err } = await supabase
                .from('employees')
                .update({ department: bulkDeptValue.trim() || null })
                .in('id', Array.from(selectedEmployeeIds));

            if (err) throw err;

            toast.success(`Successfully updated department for ${selectedEmployeeIds.size} employee(s)`);
            setIsBulkDeptOpen(false);
            setBulkDeptValue('');
            setSelectedEmployeeIds(new Set());
            setIsSelectionMode(false);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.message || 'Failed to bulk update department');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEmployeeIds.size === 0) return;
        setIsSubmitting(true);
        try {
            const { error: err } = await supabase
                .from('employees')
                .update({ emp_type: bulkTypeValue })
                .in('id', Array.from(selectedEmployeeIds));

            if (err) throw err;

            toast.success(`Successfully updated employee type for ${selectedEmployeeIds.size} employee(s)`);
            setIsBulkTypeOpen(false);
            setSelectedEmployeeIds(new Set());
            setIsSelectionMode(false);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.message || 'Failed to bulk update employee type');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEmployeeIds.size === 0) return;
        setIsSubmitting(true);
        try {
            const { error: err } = await supabase
                .from('employees')
                .delete()
                .in('id', Array.from(selectedEmployeeIds));

            if (err) throw err;

            toast.success(`Successfully deleted ${selectedEmployeeIds.size} employee(s)`);
            setIsBulkDeleteOpen(false);
            setSelectedEmployeeIds(new Set());
            setIsSelectionMode(false);
            fetchEmployees();
        } catch (error: any) {
            toast.error(error.message || 'Failed to bulk delete employees');
        } finally {
            setIsSubmitting(false);
        }
    };
    // Compile unique nationalities for filtering
    const uniqueNationalities = useMemo(() => {
        const nats = new Set<string>();
        employees.forEach((emp) => {
            if (emp.nationality) nats.add(emp.nationality.toLowerCase());
        });
        return Array.from(nats).sort();
    }, [employees]);

    // Filtered employees logic
    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            const nameMatch = emp.name.toLowerCase().includes(search.toLowerCase());
            const hrIdMatch = emp.emp_id ? emp.emp_id.toLowerCase().includes(search.toLowerCase()) : false;
            const deviceIdMatch = emp.device_user_id ? emp.device_user_id.toLowerCase().includes(search.toLowerCase()) : false;
            const designationMatch = emp.designation ? emp.designation.toLowerCase().includes(search.toLowerCase()) : false;

            const matchesSearch = nameMatch || hrIdMatch || deviceIdMatch || designationMatch;

            const matchesDept =
                selectedDepartments.length === 0 ||
                (emp.department && selectedDepartments.includes(emp.department));

            const matchesType =
                selectedTypes.length === 0 ||
                (emp.emp_type && selectedTypes.includes(emp.emp_type));

            const matchesNationality =
                selectedNationalities.length === 0 ||
                (emp.nationality && selectedNationalities.includes(emp.nationality.toLowerCase()));

            return matchesSearch && matchesDept && matchesType && matchesNationality;
        });
    }, [employees, search, selectedDepartments, selectedTypes, selectedNationalities]);

    // Stats calculation commented out because cards are disabled
    /*
    const stats = useMemo(() => {
        const total = filteredEmployees.length;
        const staff = filteredEmployees.filter(emp => emp.emp_type === 'staff').length;
        const workers = filteredEmployees.filter(emp => emp.emp_type === 'worker').length;
        return { total, staff, workers };
    }, [filteredEmployees]);
    */

    const allFilteredSelected = useMemo(() => {
        return filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployeeIds.has(emp.id));
    }, [filteredEmployees, selectedEmployeeIds]);

    const someFilteredSelected = useMemo(() => {
        return filteredEmployees.some(emp => selectedEmployeeIds.has(emp.id)) && !allFilteredSelected;
    }, [filteredEmployees, selectedEmployeeIds, allFilteredSelected]);

    const handleSelectAllToggle = () => {
        if (allFilteredSelected) {
            setSelectedEmployeeIds(prev => {
                const next = new Set(prev);
                filteredEmployees.forEach(emp => next.delete(emp.id));
                return next;
            });
        } else {
            setSelectedEmployeeIds(prev => {
                const next = new Set(prev);
                filteredEmployees.forEach(emp => next.add(emp.id));
                return next;
            });
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white" style={{ width: "100%" }}>


            {/* Toolbar: Search and Filters */}
            <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 bg-white sticky top-0 z-20" style={{ width: "100%" }}>
                {/* Selection toggle button on the left */}
                <Button
                    variant="outline"
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedEmployeeIds(new Set());
                    }}
                    className={`h-10 w-10 p-0 rounded-xl transition-colors shrink-0 ${isSelectionMode ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-none'}`}
                    title="Toggle Selection Mode"
                >
                    <SquareCheck className="w-4 h-4" />
                </Button>

                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-darkblue transition-colors" />
                    <input
                        type="text"
                        placeholder="Search name, HR ID, Device ID, or designation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border-none rounded-xl outline-none focus:ring-1 focus:ring-gray-200 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* "With Selected" bulk actions button on the right */}
                {isSelectionMode && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                disabled={selectedEmployeeIds.size === 0}
                                className="h-10 px-4 rounded-xl text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5"
                            >
                                With Selected ({selectedEmployeeIds.size})
                                <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px] bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50">
                            <DropdownMenuItem
                                onClick={() => setIsBulkDeptOpen(true)}
                                className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                            >
                                Change Department
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsBulkTypeOpen(true)}
                                className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                            >
                                Change Employee Type
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 border-gray-100" />
                            <DropdownMenuItem
                                onClick={() => setIsBulkDeleteOpen(true)}
                                className="rounded-md focus:bg-gray-50 text-red-600 focus:text-red-700 cursor-pointer text-xs"
                            >
                                Delete Selected
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}


                <Button
                    onClick={() => {
                        setIsAdding(true);
                        setAddName('');
                        setAddDeviceUserId('');
                        setAddDept('');
                        setAddEmail('');
                        setAddEmpId('');
                        setAddEmpType('staff');
                        setAddNationality('');
                        setAddDesignation('');
                        setSelectedDevices(new Set());
                    }}
                    className="h-10 px-4 rounded-xl text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-1.5 shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Employee
                </Button>
            </div>

            {/* Error State */}
            {error && (
                <div className="mx-3 mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex-shrink-0">
                    {error}
                </div>
            )}

            {/* Table Section */}
            <div className="overflow-auto flex-1" style={{ width: "100%" }}>
                {loading ? (
                    <div className="flex items-center justify-center gap-2 h-full text-gray-400 text-sm">
                        <Loader2 className="w-5 h-full animate-spin" />
                        Loading employees…
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-12 text-sm" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Users />
                                </EmptyMedia>
                                <EmptyTitle>No employees found</EmptyTitle>
                                <EmptyDescription>
                                    {search || selectedDepartments.length > 0 || selectedTypes.length > 0 || selectedNationalities.length > 0
                                        ? 'No matching employees found with current filters.'
                                        : 'Get started by adding employee records.'}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                            <tr className="border-b border-gray-100">
                                {isSelectionMode && (
                                    <th className="px-4 py-3 text-left w-12">
                                        <input
                                            type="checkbox"
                                            checked={allFilteredSelected}
                                            ref={el => {
                                                if (el) {
                                                    el.indeterminate = someFilteredSelected;
                                                }
                                            }}
                                            onChange={handleSelectAllToggle}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                        />
                                    </th>
                                )}
                                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: "240px" }}>Employee</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: "160px" }}>IDs</th>
                                <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: "200px" }}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide">
                                            <span className="truncate">
                                                {selectedDepartments.length === 0
                                                    ? 'Department (All)'
                                                    : selectedDepartments.length === 1
                                                    ? selectedDepartments[0]
                                                    : `Dept (${selectedDepartments.length})`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[180px] bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50 max-h-[300px] overflow-y-auto">
                                            <DropdownMenuCheckboxItem
                                                checked={selectedDepartments.length === 0}
                                                onCheckedChange={() => setSelectedDepartments([])}
                                                className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                            >
                                                All Departments
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuSeparator className="my-1 border-gray-100" />
                                            {uniqueDepartments.map(dept => {
                                                const isChecked = selectedDepartments.includes(dept);
                                                return (
                                                    <DropdownMenuCheckboxItem
                                                        key={dept}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedDepartments([...selectedDepartments, dept]);
                                                            } else {
                                                                setSelectedDepartments(selectedDepartments.filter(item => item !== dept));
                                                            }
                                                        }}
                                                        className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                                    >
                                                        {dept}
                                                    </DropdownMenuCheckboxItem>
                                                );
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </th>
                                <th className="text-left px-1 py-1 font-medium text-xs tracking-wide" style={{ width: "280px" }}>
                                    <div className="flex gap-1 items-center w-full">
                                        <div className="flex-1 min-w-0">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide">
                                                    <span className="truncate">
                                                        {selectedTypes.length === 0
                                                            ? 'Type (All)'
                                                            : selectedTypes.length === 1
                                                            ? selectedTypes[0].toUpperCase()
                                                            : `Type (${selectedTypes.length})`}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[130px] bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50">
                                                    <DropdownMenuCheckboxItem
                                                        checked={selectedTypes.length === 0}
                                                        onCheckedChange={() => setSelectedTypes([])}
                                                        className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                                    >
                                                        All Types
                                                    </DropdownMenuCheckboxItem>
                                                    <DropdownMenuSeparator className="my-1 border-gray-100" />
                                                    <DropdownMenuCheckboxItem
                                                        checked={selectedTypes.includes('staff')}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedTypes([...selectedTypes, 'staff']);
                                                            } else {
                                                                setSelectedTypes(selectedTypes.filter(t => t !== 'staff'));
                                                            }
                                                        }}
                                                        className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                                    >
                                                        STAFF
                                                    </DropdownMenuCheckboxItem>
                                                    <DropdownMenuCheckboxItem
                                                        checked={selectedTypes.includes('worker')}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedTypes([...selectedTypes, 'worker']);
                                                            } else {
                                                                setSelectedTypes(selectedTypes.filter(t => t !== 'worker'));
                                                            }
                                                        }}
                                                        className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                                    >
                                                        WORKER
                                                    </DropdownMenuCheckboxItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="h-8 text-xs bg-transparent border-0 text-gray-500 hover:bg-gray-100 transition-colors px-2 rounded-md font-medium w-full justify-between flex items-center outline-none uppercase tracking-wide">
                                                    <span className="truncate">
                                                        {selectedNationalities.length === 0
                                                            ? 'Nationality (All)'
                                                            : selectedNationalities.length === 1
                                                            ? selectedNationalities[0].toUpperCase()
                                                            : `Nat (${selectedNationalities.length})`}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[180px] bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50 max-h-[300px] overflow-y-auto">
                                                    <DropdownMenuCheckboxItem
                                                        checked={selectedNationalities.length === 0}
                                                        onCheckedChange={() => setSelectedNationalities([])}
                                                        className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                                    >
                                                        All Nationalities
                                                    </DropdownMenuCheckboxItem>
                                                    <DropdownMenuSeparator className="my-1 border-gray-100" />
                                                    {uniqueNationalities.map(nat => {
                                                        const isChecked = selectedNationalities.includes(nat);
                                                        return (
                                                            <DropdownMenuCheckboxItem
                                                                key={nat}
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedNationalities([...selectedNationalities, nat]);
                                                                    } else {
                                                                        setSelectedNationalities(selectedNationalities.filter(item => item !== nat));
                                                                    }
                                                                }}
                                                                className="rounded-md focus:bg-gray-50 cursor-pointer text-xs uppercase"
                                                            >
                                                                {nat}
                                                            </DropdownMenuCheckboxItem>
                                                        );
                                                    })}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </th>
                                {/* <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredEmployees.map((emp, idx) => (
                                <tr
                                    onClick={() => {
                                        if (isSelectionMode) {
                                            toggleSelectEmployee(emp.id);
                                        } else {
                                            setEditingEmployee(emp);
                                            setEditName(emp.name);
                                            setEditDeviceUserId(emp.device_user_id);
                                            setEditDept(emp.department || '');
                                            setEditEmail(emp.email || '');
                                            setEditEmpId(emp.emp_id || '');
                                            setEditEmpType(emp.emp_type || 'staff');
                                            setEditNationality(emp.nationality || '');
                                            setEditDesignation(emp.designation || '');
                                        }
                                    }}
                                    key={emp.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                    {isSelectionMode && (
                                        <td className="px-4 py-3 w-12" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployeeIds.has(emp.id)}
                                                onChange={() => toggleSelectEmployee(emp.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                            />
                                        </td>
                                    )}
                                    {/* Name and Email */}
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2.5" style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                                            <Avatar size={"md"} name={emp.name} index={idx} />
                                            <div style={{ display: "flex", flexFlow: "column" }}>
                                                <div className="font-medium text-gray-900" style={{ textAlign: "left" }}>{emp.name}</div>
                                                {emp.email && (
                                                    <div className="text-xs text-gray-400">{emp.email}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    {/* IDs */}
                                    <td className="px-4 py-3">
                                        <div style={{ display: "flex", flexFlow: "column", gap: "2px" }}>
                                            <div className="text-xs text-gray-500">HR ID: <span className="font-medium text-gray-800">{emp.emp_id ?? '—'}</span></div>
                                            <div className="text-xs text-gray-400">Device ID: <span className="font-mono text-gray-700">{emp.device_user_id}</span></div>
                                        </div>
                                    </td>
                                    {/* Dept and Designation */}
                                    <td className="px-4 py-3">
                                        <div style={{ display: "flex", flexFlow: "column", gap: "2px" }}>
                                            <div className="text-sm font-medium text-gray-800">{emp.department ?? '—'}</div>
                                            <div className="text-xs text-gray-500">{emp.designation ?? '—'}</div>
                                        </div>
                                    </td>
                                    {/* Type and Nationality */}
                                    <td className="px-4 py-3">
                                        <div style={{ display: "flex", flexFlow: "column", gap: "4px" }}>
                                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-medium ${emp.emp_type === 'staff'
                                                ? 'bg-blue-50 text-blue-700'
                                                : emp.emp_type === 'worker'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {emp.emp_type ? emp.emp_type.toUpperCase() : '—'}
                                            </span>
                                            <div className="text-xs text-gray-500">{emp.nationality ?? '—'}</div>
                                        </div>
                                    </td>
                                    {/* Actions */}
                                    {/* <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => {
                                                setEditingEmployee(emp);
                                                setEditName(emp.name);
                                                setEditDeviceUserId(emp.device_user_id);
                                                setEditDept(emp.department || '');
                                                setEditEmail(emp.email || '');
                                                setEditEmpId(emp.emp_id || '');
                                                setEditEmpType(emp.emp_type || 'staff');
                                                setEditNationality(emp.nationality || '');
                                                setEditDesignation(emp.designation || '');
                                            }}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                            title="Edit Employee"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </td> */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Dialog open={editingEmployee !== null} onOpenChange={(open) => { if (!open) setEditingEmployee(null); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Modify the employee's details and save them to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Device User ID</label>
                                <Input
                                    type="text"
                                    value={editDeviceUserId}
                                    onChange={(e) => setEditDeviceUserId(e.target.value)}
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Employee ID (HR)</label>
                                <Input
                                    type="text"
                                    value={editEmpId}
                                    onChange={(e) => setEditEmpId(e.target.value)}
                                    placeholder="SS0001"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 block">Full Name <span className="text-red-500">*</span></label>
                            <Input
                                type="text"
                                required
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="e.g. John Smith"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Department</label>
                                <Input
                                    type="text"
                                    value={editDept}
                                    onChange={(e) => setEditDept(e.target.value)}
                                    placeholder="e.g. Operations"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Designation</label>
                                <Input
                                    type="text"
                                    value={editDesignation}
                                    onChange={(e) => setEditDesignation(e.target.value)}
                                    placeholder="e.g. Engineer"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Employee Type</label>
                                {/* <select
                                    value={editEmpType}
                                    onChange={(e) => setEditEmpType(e.target.value as 'staff' | 'worker')}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white"
                                >
                                    <option value="staff">Staff</option>
                                    <option value="worker">Worker</option>
                                </select> */}
                                <Select value={editEmpType} onValueChange={(e) => setEditEmpType(e as 'staff' | 'worker')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Employee Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="worker">Worker</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Nationality</label>

                                <Select value={editNationality} onValueChange={(e) => setEditNationality(e)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Nationality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NATIONALITIES.map((nat) => (
                                            <SelectItem key={nat} value={nat}>
                                                {nat.toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 block">Email</label>
                            <Input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="john@company.com"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button
                                style={{ flex: 1 }}
                                type="button"
                                variant="outline"
                                onClick={() => setEditingEmployee(null)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button style={{ flex: 1 }} type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Employee Dialog */}
            <Dialog open={isAdding} onOpenChange={(open) => { if (!open) setIsAdding(false); }}>
                <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Employee</DialogTitle>
                        <DialogDescription>
                            Create a new employee record and optionally push it to biometric devices.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Device User ID <span className="text-red-500">*</span></label>
                                <Input
                                    type="text"
                                    required
                                    value={addDeviceUserId}
                                    onChange={(e) => setAddDeviceUserId(e.target.value)}
                                    placeholder="e.g. 110525"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Employee ID (HR)</label>
                                <Input
                                    type="text"
                                    value={addEmpId}
                                    onChange={(e) => setAddEmpId(e.target.value)}
                                    placeholder="e.g. EMP-045"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 block">Full Name <span className="text-red-500">*</span></label>
                            <Input
                                type="text"
                                required
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                                placeholder="e.g. John Smith"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Department</label>
                                <Input
                                    type="text"
                                    value={addDept}
                                    onChange={(e) => setAddDept(e.target.value)}
                                    placeholder="e.g. Operations"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Designation</label>
                                <Input
                                    type="text"
                                    value={addDesignation}
                                    onChange={(e) => setAddDesignation(e.target.value)}
                                    placeholder="e.g. Engineer"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Employee Type</label>
                                <Select value={addEmpType} onValueChange={(e) => setAddEmpType(e as 'staff' | 'worker')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Employee Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="worker">Worker</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 block">Nationality</label>
                                <Select value={addNationality} onValueChange={(e) => setAddNationality(e)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Nationality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NATIONALITIES.map((nat) => (
                                            <SelectItem key={nat} value={nat}>
                                                {nat.toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 block">Email</label>
                            <Input
                                type="email"
                                value={addEmail}
                                onChange={(e) => setAddEmail(e.target.value)}
                                placeholder="john@company.com"
                            />
                        </div>

                        {/* Device Selection Checklist */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-600 block">Push to biometric devices</label>
                                {devices.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={toggleAllDevices}
                                        className="text-xs text-gray-400 hover:text-gray-700 font-medium"
                                    >
                                        {selectedDevices.size === devices.length ? 'Deselect all' : 'Select all'}
                                    </button>
                                )}
                            </div>

                            {loadingDevices ? (
                                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Loading devices…
                                </div>
                            ) : devices.length === 0 ? (
                                <div className="text-xs text-gray-400 py-1">No devices registered in the system.</div>
                            ) : (
                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                    {devices.map((d) => (
                                        <label
                                            key={d.id}
                                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors text-xs ${selectedDevices.has(d.serial_no)
                                                ? 'border-gray-900 bg-gray-50'
                                                : 'border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDevices.has(d.serial_no)}
                                                onChange={() => toggleDevice(d.serial_no)}
                                                className="w-3.5 h-3.5 accent-gray-900"
                                            />
                                            <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                                <Monitor className="w-3 h-3 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">{d.location ?? 'Unnamed location'}</div>
                                                <div className="text-[10px] text-gray-400 font-mono truncate">{d.serial_no}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4 gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAdding(false)}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={(e) => handleAddSubmit(e, false)}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save only'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={(e) => handleAddSubmit(e, true)}
                                    disabled={isSubmitting || selectedDevices.size === 0}
                                    className="w-full sm:w-auto"
                                >
                                    {isSubmitting ? 'Saving...' : `Save & Push (${selectedDevices.size})`}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Change Department Dialog */}
            <Dialog open={isBulkDeptOpen} onOpenChange={(open) => { if (!open) setIsBulkDeptOpen(false); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Bulk Update Department</DialogTitle>
                        <DialogDescription>
                            Enter a new department for the {selectedEmployeeIds.size} selected employee(s).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkDeptSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 block">New Department</label>
                            <Input
                                type="text"
                                value={bulkDeptValue}
                                onChange={(e) => setBulkDeptValue(e.target.value)}
                                placeholder="e.g. Sales, Operations"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button
                                style={{ flex: 1 }}
                                type="button"
                                variant="outline"
                                onClick={() => setIsBulkDeptOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button style={{ flex: 1 }} type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Department'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Change Employee Type Dialog */}
            <Dialog open={isBulkTypeOpen} onOpenChange={(open) => { if (!open) setIsBulkTypeOpen(false); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Bulk Update Employee Type</DialogTitle>
                        <DialogDescription>
                            Select the new employee type for the {selectedEmployeeIds.size} selected employee(s).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkTypeSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 block">Employee Type</label>
                            <Select value={bulkTypeValue} onValueChange={(e) => setBulkTypeValue(e as 'staff' | 'worker')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Employee Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="worker">Worker</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button
                                style={{ flex: 1 }}
                                type="button"
                                variant="outline"
                                onClick={() => setIsBulkTypeOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button style={{ flex: 1 }} type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Type'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Dialog */}
            <Dialog open={isBulkDeleteOpen} onOpenChange={(open) => { if (!open) setIsBulkDeleteOpen(false); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Employees in Bulk</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the {selectedEmployeeIds.size} selected employee(s)? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkDeleteSubmit} className="space-y-4">
                        <DialogFooter className="pt-4">
                            <Button
                                style={{ flex: 1 }}
                                type="button"
                                variant="outline"
                                onClick={() => setIsBulkDeleteOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button style={{ flex: 1 }} variant="destructive" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Deleting...' : `Yes, Delete ${selectedEmployeeIds.size} Employees`}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}