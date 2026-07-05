import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Fingerprint, Loader2, Plus, Scan, Search, SquareCheck, Upload, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Avatar } from '../components/Avatar';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../components/ui/empty';
import { supabase } from '../lib/supabase';

interface Device {
    id: number;
    serial_no: string;
    location: string | null;
    last_seen?: string | null;
}

function buildAddUserCommand(cmdId: number, pin: string, name: string): string {
    const safeName = name.replace(/\t/g, ' ').slice(0, 24);
    return `C:${cmdId}:DATA UPDATE USERINFO PIN=${pin}\tName=${safeName}\tPri=0\tPasswd=\tCard=\tGrp=1\tTZ=0000000100000000\tVerify=0\tViceCard=`;
}

function findValue(row: any, keys: string[]): string | null {
    const rowKeys = Object.keys(row);
    for (const k of keys) {
        const foundKey = rowKeys.find(rk => rk.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, ''));
        if (foundKey !== undefined && row[foundKey] !== undefined) {
            return String(row[foundKey]).trim();
        }
    }
    return null;
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
    fingerprint_templates?: Record<string, any> | null;
    face_templates?: Record<string, any> | null;
    created_at?: string;
    location?: string | null;
}

export default function EmployeeManage() {
    const [employees, setEmployees] = useState<ManageEmployee[]>([]);
    const [employeeLocations, setEmployeeLocations] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);

    // Pagination / Rendering Limit state
    const [renderLimit, setRenderLimit] = useState(100);

    useEffect(() => {
        setRenderLimit(100);
    }, [search, selectedDepartments, selectedTypes, selectedNationalities]);

    // Selection and bulk states
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
    const [isBulkDeptOpen, setIsBulkDeptOpen] = useState(false);
    const [bulkDeptValue, setBulkDeptValue] = useState('');
    const [isBulkTypeOpen, setIsBulkTypeOpen] = useState(false);
    const [bulkTypeValue, setBulkTypeValue] = useState<'staff' | 'worker'>('staff');
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    // Bulk push states
    const [isBulkPushOpen, setIsBulkPushOpen] = useState(false);
    const [selectedBulkPushDevices, setSelectedBulkPushDevices] = useState<Set<string>>(new Set());
    const [isBulkPushing, setIsBulkPushing] = useState(false);

    useEffect(() => {
        if (isBulkPushOpen) {
            setSelectedBulkPushDevices(new Set());
        }
    }, [isBulkPushOpen]);

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
    const [activeTab, setActiveTab] = useState<'profile' | 'sync'>('profile');
    const [syncAction, setSyncAction] = useState<'push' | 'fetch'>('push');
    const [editName, setEditName] = useState('');
    const [editDeviceUserId, setEditDeviceUserId] = useState('');
    const [editDept, setEditDept] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editEmpId, setEditEmpId] = useState('');
    const [editEmpType, setEditEmpType] = useState<'staff' | 'worker'>('staff');
    const [editNationality, setEditNationality] = useState('');
    const [editDesignation, setEditDesignation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selective individual push/fetch states and handler
    const [selectedPushDevices, setSelectedPushDevices] = useState<Set<string>>(new Set());
    const [isPushing, setIsPushing] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (editingEmployee) {
            setSelectedPushDevices(new Set());
            setSyncAction('push');
            setActiveTab('profile');
        }
    }, [editingEmployee]);

    const handleFetchBiometrics = async () => {
        if (!editingEmployee || selectedPushDevices.size === 0) {
            toast.error('Please select at least one device to fetch from');
            return;
        }

        setIsFetching(true);
        try {
            const empId = editingEmployee.id;

            const commandsToInsert: any[] = [];
            for (const deviceSerial of Array.from(selectedPushDevices)) {
                commandsToInsert.push(
                    {
                        device_serial: deviceSerial,
                        command: 'DATA QUERY USERINFO',
                        command_type: 'QUERY_USERINFO',
                        employee_id: empId,
                        status: 'pending'
                    },
                    {
                        device_serial: deviceSerial,
                        command: 'DATA QUERY FINGERTMP',
                        command_type: 'QUERY_FINGERTMP',
                        employee_id: empId,
                        status: 'pending'
                    },
                    {
                        device_serial: deviceSerial,
                        command: 'DATA QUERY BIODATA',
                        command_type: 'QUERY_BIODATA',
                        employee_id: empId,
                        status: 'pending'
                    },
                    {
                        device_serial: deviceSerial,
                        command: 'DATA QUERY FACE',
                        command_type: 'QUERY_FACE',
                        employee_id: empId,
                        status: 'pending'
                    }
                );
            }

            const { error: insertErr } = await supabase
                .from('device_commands')
                .insert(commandsToInsert);

            if (insertErr) throw insertErr;

            toast.success(`Successfully queued biometrics query from selected device(s). Templates will sync automatically when devices process the commands.`);
            setSelectedPushDevices(new Set());
        } catch (err: any) {
            toast.error(err.message || 'Failed to queue fetch commands.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleIndividualPush = async () => {
        if (!editingEmployee || selectedPushDevices.size === 0) {
            toast.error('Please select at least one device');
            return;
        }

        setIsPushing(true);
        try {
            const empId = editingEmployee.id;
            const pin = editDeviceUserId.trim() || editingEmployee.device_user_id;
            const name = editName.trim() || editingEmployee.name;

            // Construct user update command text
            const userCmd = `DATA UPDATE USERINFO PIN=${pin}\tName=${name.replace(/\t/g, ' ').slice(0, 24)}\tPri=0\tPasswd=\tCard=\tGrp=1\tTZ=0000000100000000`;

            const commandsToInsert: any[] = [];

            const fingerTemplates = editingEmployee.fingerprint_templates || {};
            const faceTemplates = editingEmployee.face_templates || {};

            [...selectedPushDevices].forEach(serial => {
                // User info update command
                commandsToInsert.push({
                    device_serial: serial,
                    command: userCmd,
                    command_type: 'ADD_USER',
                    employee_id: empId,
                    status: 'pending'
                });

                // Fingerprints
                Object.entries(fingerTemplates).forEach(([fid, val]: [string, any]) => {
                    if (val && val.template) {
                        commandsToInsert.push({
                            device_serial: serial,
                            command: `DATA UPDATE FINGERTMP PIN=${pin}\tFID=${fid}\tSize=${val.size ?? 0}\tValid=${val.valid ?? 1}\tTMP=${val.template}`,
                            command_type: 'UPDATE_FINGERTMP',
                            employee_id: empId,
                            status: 'pending'
                        });
                    }
                });

                // Faces
                Object.entries(faceTemplates).forEach(([key, val]: [string, any]) => {
                    if (val && val.template) {
                        if (key.startsWith('face-')) {
                            const fid = key.replace('face-', '');
                            commandsToInsert.push({
                                device_serial: serial,
                                command: `DATA UPDATE FACE PIN=${pin}\tFID=${fid}\tSize=${val.size ?? val.template.length}\tValid=${val.valid ?? 1}\tTMP=${val.template}`,
                                command_type: 'UPDATE_FACE',
                                employee_id: empId,
                                status: 'pending'
                            });
                        } else {
                            const [type, no] = key.split('-');
                            commandsToInsert.push({
                                device_serial: serial,
                                command: `DATA UPDATE BIODATA Pin=${pin}\tType=${type || 9}\tNo=${no || 0}\tIndex=${val.index ?? 0}\tFormat=${val.format ?? 0}\tMajorVer=${val.major_ver ?? 10}\tMinorVer=${val.minor_ver ?? 0}\tTmp=${val.template}`,
                                command_type: 'UPDATE_BIODATA',
                                employee_id: empId,
                                status: 'pending'
                            });
                        }
                    }
                });
            });

            const { error: insertErr } = await supabase
                .from('device_commands')
                .insert(commandsToInsert);

            if (insertErr) throw insertErr;

            toast.success(`Successfully queued profile and biometrics sync for ${name} to ${selectedPushDevices.size} device(s).`);
            setSelectedPushDevices(new Set());
        } catch (err: any) {
            toast.error(err.message || 'Failed to queue push commands.');
        } finally {
            setIsPushing(false);
        }
    };

    // Excel Upload states & handlers
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadState, setUploadState] = useState<'idle' | 'preview' | 'uploading' | 'completed'>('idle');
    const [parsedEmployees, setParsedEmployees] = useState<any[]>([]);
    const [duplicateEmployees, setDuplicateEmployees] = useState<any[]>([]);
    const [uploadPushToDevices, setUploadPushToDevices] = useState(false);
    const [uploadSelectedDevices, setUploadSelectedDevices] = useState<Set<string>>(new Set());
    const [uploadFileName, setUploadFileName] = useState('');
    const [uploadCurrentIndex, setUploadCurrentIndex] = useState(0);
    const [uploadTotalCount, setUploadTotalCount] = useState(0);

    const handleResetUpload = () => {
        setUploadState('idle');
        setParsedEmployees([]);
        setDuplicateEmployees([]);
        setUploadFileName('');
        setUploadCurrentIndex(0);
        setUploadTotalCount(0);
        setUploadPushToDevices(false);
        setUploadSelectedDevices(new Set());
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet) as any[];

                if (rows.length === 0) {
                    toast.error('The selected Excel file is empty.');
                    handleResetUpload();
                    return;
                }

                const employeesList: any[] = [];
                const localDuplicates: any[] = [];
                const seenExcelPins = new Set();

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];

                    const name = findValue(row, ['name', 'employeename', 'emp_name', 'employee_name', 'full_name', 'fullname']);
                    const pin = findValue(row, ['device_user_id', 'deviceuserid', 'pin', 'userid', 'user_id', 'device_id', 'deviceid']);

                    if (!name || !pin) {
                        continue; // Skip invalid rows
                    }

                    const emp_id = findValue(row, ['emp_id', 'empid', 'hr_id', 'hrid', 'employee_id', 'employeeid', 'id']);
                    const rawType = findValue(row, ['emp_type', 'emptype', 'employee_type', 'employeetype', 'type']) || '';
                    let emp_type: 'staff' | 'worker' = 'staff';
                    if (rawType.toLowerCase().startsWith('work')) {
                        emp_type = 'worker';
                    }

                    const department = findValue(row, ['department', 'dept', 'department_name', 'dept_name']);
                    const designation = findValue(row, ['designation', 'design', 'job_title', 'jobtitle', 'role']);
                    const nationality = findValue(row, ['nationality', 'nation', 'country']);
                    const email = findValue(row, ['email', 'email_address', 'emailaddress']);

                    const newEmp = {
                        device_user_id: pin,
                        name,
                        emp_id,
                        emp_type,
                        department,
                        designation,
                        nationality,
                        email
                    };

                    if (seenExcelPins.has(pin)) {
                        localDuplicates.push(newEmp);
                    } else {
                        seenExcelPins.add(pin);
                        employeesList.push(newEmp);
                    }
                }

                if (employeesList.length === 0) {
                    toast.error('No valid employee rows found. Each row must have a Name and Device User ID/PIN.');
                    handleResetUpload();
                    return;
                }

                // Check for duplicates locally against already loaded employees
                const existingPins = new Set(employees.map(emp => emp.device_user_id));
                const dbDuplicates = employeesList.filter(emp => existingPins.has(emp.device_user_id));
                const newEmployees = employeesList.filter(emp => !existingPins.has(emp.device_user_id));
                const allDuplicates = [...localDuplicates, ...dbDuplicates];

                if (newEmployees.length === 0) {
                    toast.error(`All ${employeesList.length} employees in the Excel file are already registered.`);
                    handleResetUpload();
                    return;
                }

                setParsedEmployees(newEmployees);
                setDuplicateEmployees(allDuplicates);
                setUploadTotalCount(newEmployees.length);
                setUploadCurrentIndex(0);
                setUploadState('preview');
            } catch (err: any) {
                toast.error(err.message || 'Failed to parse Excel file.');
                handleResetUpload();
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmUpload = async () => {
        if (parsedEmployees.length === 0) return;
        setUploadState('uploading');
        setUploadCurrentIndex(0);

        const newDuplicates: any[] = [];

        try {
            for (let i = 0; i < parsedEmployees.length; i++) {
                const emp = parsedEmployees[i];

                // 1. Double check DB duplicate before insert to avoid conflicts
                const { data: existing } = await supabase
                    .from('employees')
                    .select('id')
                    .eq('device_user_id', emp.device_user_id)
                    .maybeSingle();

                if (existing) {
                    newDuplicates.push(emp);
                    setUploadCurrentIndex(i + 1);
                    continue;
                }

                // 2. Insert employee one by one
                const { data: insertedData, error: insertErr } = await supabase
                    .from('employees')
                    .insert(emp)
                    .select('id, device_user_id, name')
                    .single();

                if (insertErr) {
                    toast.error(`Failed to import ${emp.name}: ${insertErr.message}`);
                } else if (insertedData && uploadPushToDevices && uploadSelectedDevices.size > 0) {
                    // 3. If push to devices is active, queue commands for this user
                    const commands = [...uploadSelectedDevices].map(serial => ({
                        device_serial: serial,
                        command: buildAddUserCommand(Date.now() + Math.floor(Math.random() * 100000), insertedData.device_user_id, insertedData.name),
                        command_type: 'ADD_USER',
                        employee_id: insertedData.id,
                        status: 'pending',
                    }));

                    const { error: cmdErr } = await supabase.from('device_commands').insert(commands);
                    if (cmdErr) {
                        console.error(`Failed to queue commands for ${insertedData.name}: ${cmdErr.message}`);
                    }
                }

                setUploadCurrentIndex(i + 1);
            }

            if (newDuplicates.length > 0) {
                setDuplicateEmployees(prev => [...prev, ...newDuplicates]);
            }

            setUploadState('completed');
            fetchEmployees();
        } catch (err: any) {
            toast.error(err.message || 'Failed to complete import.');
            setUploadState('preview');
        }
    };

    // Add states
    const [isAdding, setIsAdding] = useState(false);
    const [addActiveTab, setAddActiveTab] = useState<'profile' | 'sync'>('profile');
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
            const [empRes, devRes] = await Promise.all([
                supabase.from('employees').select('*').order('name', { ascending: true }),
                supabase.from('devices').select('serial_no, location')
            ]);

            if (empRes.error) throw empRes.error;
            if (devRes.error) throw devRes.error;

            const devData = devRes.data || [];
            const deviceMap = Object.fromEntries(
                devData.map(d => [d.serial_no, d.location])
            );

            // Fetch the latest 2000 punches to determine the most recent location for each employee
            const { data: punchData, error: punchError } = await supabase
                .from('punches')
                .select('user_id, device_serial')
                .order('punch_time', { ascending: false })
                .limit(2000);

            if (punchError) throw punchError;

            // Map each user to their most recent location
            const empLocs: Record<string, string> = {};
            if (punchData) {
                punchData.forEach(p => {
                    const loc = deviceMap[p.device_serial];
                    // Only set if not already set, so we keep the most recent punch location
                    if (loc && !empLocs[p.user_id]) {
                        empLocs[p.user_id] = loc;
                    }
                });
            }

            setEmployeeLocations(empLocs);

            setEmployees(empRes.data || []);
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
            .select('id, serial_no, location, last_seen')
            .order('id', { ascending: true });
        if (!err) setDevices(data ?? []);
        setLoadingDevices(false);
    }, []);



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

    const handleBulkPushSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEmployeeIds.size === 0) {
            toast.error('No employees selected');
            return;
        }
        if (selectedBulkPushDevices.size === 0) {
            toast.error('Please select at least one device');
            return;
        }

        setIsBulkPushing(true);
        try {
            const empIds = Array.from(selectedEmployeeIds);

            // Construct insert batch
            const commandsToInsert: any[] = [];

            for (const empId of empIds) {
                const emp = employees.find(e => e.id === empId);
                if (!emp) continue;

                const pin = emp.device_user_id;
                const name = emp.name;

                const userCmd = `DATA UPDATE USERINFO PIN=${pin}\tName=${name.replace(/\t/g, ' ').slice(0, 24)}\tPri=0\tPasswd=\tCard=\tGrp=1\tTZ=0000000100000000`;

                [...selectedBulkPushDevices].forEach(serial => {
                    // USERINFO update command
                    commandsToInsert.push({
                        device_serial: serial,
                        command: userCmd,
                        command_type: 'ADD_USER',
                        employee_id: empId,
                        status: 'pending'
                    });

                    // Fingerprint templates from JSONB
                    const fingerTemplates = emp.fingerprint_templates || {};
                    Object.entries(fingerTemplates).forEach(([fid, val]: [string, any]) => {
                        if (val && val.template) {
                            commandsToInsert.push({
                                device_serial: serial,
                                command: `DATA UPDATE FINGERTMP PIN=${pin}\tFID=${fid}\tSize=${val.size ?? 0}\tValid=${val.valid ?? 1}\tTMP=${val.template}`,
                                command_type: 'UPDATE_FINGERTMP',
                                employee_id: empId,
                                status: 'pending'
                            });
                        }
                    });

                    // Face templates from JSONB
                    const faceTemplates = emp.face_templates || {};
                    Object.entries(faceTemplates).forEach(([key, val]: [string, any]) => {
                        if (val && val.template) {
                            if (key.startsWith('face-')) {
                                const fid = key.replace('face-', '');
                                commandsToInsert.push({
                                    device_serial: serial,
                                    command: `DATA UPDATE FACE PIN=${pin}\tFID=${fid}\tSize=${val.size ?? val.template.length}\tValid=${val.valid ?? 1}\tTMP=${val.template}`,
                                    command_type: 'UPDATE_FACE',
                                    employee_id: empId,
                                    status: 'pending'
                                });
                            } else {
                                const [type, no] = key.split('-');
                                commandsToInsert.push({
                                    device_serial: serial,
                                    command: `DATA UPDATE BIODATA Pin=${pin}\tType=${type || 9}\tNo=${no || 0}\tIndex=${val.index ?? 0}\tFormat=${val.format ?? 0}\tMajorVer=${val.major_ver ?? 10}\tMinorVer=${val.minor_ver ?? 0}\tTmp=${val.template}`,
                                    command_type: 'UPDATE_BIODATA',
                                    employee_id: empId,
                                    status: 'pending'
                                });
                            }
                        }
                    });
                });
            }

            if (commandsToInsert.length > 0) {
                const { error: insertErr } = await supabase
                    .from('device_commands')
                    .insert(commandsToInsert);

                if (insertErr) throw insertErr;
            }

            toast.success(`Successfully queued profile and biometrics sync for ${selectedEmployeeIds.size} employee(s) to ${selectedBulkPushDevices.size} device(s).`);
            setIsBulkPushOpen(false);
            setSelectedEmployeeIds(new Set());
            setIsSelectionMode(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to bulk push to devices.');
        } finally {
            setIsBulkPushing(false);
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
                    className={`h-10 w-10 p-0 rounded-xl shrink-0 transition-all border ${isSelectionMode
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100/80 hover:text-indigo-700 shadow-xs'
                        : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700'
                        }`}
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
                <div
                    className="overflow-hidden transition-all duration-300 ease-in-out flex items-center shrink-0"
                    style={{
                        width: isSelectionMode ? "150px" : "0px",
                        opacity: isSelectionMode ? 1 : 0,
                        marginLeft: isSelectionMode ? "8px" : "0px",
                        pointerEvents: isSelectionMode ? "auto" : "none"
                    }}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                style={{ backgroundColor: "rgba(100 100 100/ 0.1)", color: "black", fontSize: "0.8rem" }}
                                disabled={selectedEmployeeIds.size === 0}
                                className="h-10 px-4 rounded-xl font-medium disabled:opacity-50 w-[150px] justify-center flex items-center gap-1.5 shrink-0"
                            >
                                <span className="truncate">Selected ({selectedEmployeeIds.size})</span>
                                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px] bg-white border border-gray-100 shadow-xl rounded-lg p-1 z-50">
                            <DropdownMenuItem
                                onClick={() => setIsBulkDeptOpen(true)}
                                className="rounded-md focus:bg-gray-50 cursor-pointer"
                            >
                                Change Department
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsBulkTypeOpen(true)}
                                className="rounded-md focus:bg-gray-50 cursor-pointer"
                            >
                                Change Employee Type
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsBulkPushOpen(true)}
                                className="rounded-md focus:bg-gray-50 cursor-pointer text-indigo-600 focus:text-indigo-700 font-semibold"
                            >
                                Push to Devices
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 border-gray-100" />
                            <DropdownMenuItem
                                style={{ fontWeight: 500 }}
                                onClick={() => setIsBulkDeleteOpen(true)}
                                className="rounded-md focus:bg-gray-50 text-red-600 focus:text-red-700 cursor-pointer"
                            >
                                Delete Selected
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>




                <Button
                    onClick={() => {
                        setIsAdding(true);
                        setAddActiveTab('profile');
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
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <Button
                    onClick={() => {
                        handleResetUpload();
                        setUploadModalOpen(true);
                    }}
                    variant="outline"
                    className="h-10 w-10 p-0 rounded-xl bg-gray-50 border-none text-gray-500 hover:bg-gray-100 transition-colors shrink-0 flex items-center justify-center"
                    title="Upload Employees from Excel"
                >
                    <Upload className="w-4 h-4" />
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
                    <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                        <thead className="sticky top-0 bg-gray-50 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                            <tr className="border-b border-gray-100">
                                <th
                                    className="transition-[width,opacity] duration-200 ease-in-out overflow-hidden text-left p-0"
                                    style={{
                                        width: isSelectionMode ? "48px" : "0px",
                                        opacity: isSelectionMode ? 1 : 0,
                                        pointerEvents: isSelectionMode ? "auto" : "none"
                                    }}
                                >
                                    <div className="w-12 h-10 flex items-center justify-center overflow-hidden">
                                        <Checkbox
                                            checked={someFilteredSelected ? 'indeterminate' : allFilteredSelected}
                                            onCheckedChange={handleSelectAllToggle}
                                            className="w-4 h-4 rounded border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white focus-visible:ring-indigo-500 cursor-pointer"
                                        />
                                    </div>
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: "240px" }}>Employee</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: "160px" }}>IDs</th>
                                <th className=" px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: "180px", border: "" }}>Biometrics</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: "180px" }}>Location</th>
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
                                        <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto p-0 z-50">
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedDepartments(uniqueDepartments);
                                                    }}
                                                    className="text-[10px] font-semibold text-gray-500 hover:text-gray-850 cursor-pointer text-left"
                                                    style={{ background: "none", flex: 1 }}
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedDepartments([]);
                                                    }}
                                                    className="text-[10px] font-semibold text-gray-500 hover:text-gray-850 cursor-pointer text-right"
                                                    style={{ background: "none", flex: 1 }}
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                            <div className="py-1">
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
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                                        >
                                                            {dept}
                                                        </DropdownMenuCheckboxItem>
                                                    );
                                                })}
                                            </div>
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
                                                <DropdownMenuContent className="w-[140px] max-h-[300px] overflow-y-auto p-0 z-50">
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setSelectedTypes(['staff', 'worker']);
                                                            }}
                                                            className="text-[10px] font-semibold text-gray-500 hover:text-gray-850 cursor-pointer text-left"
                                                            style={{ background: "none", flex: 1 }}
                                                        >
                                                            All
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setSelectedTypes([]);
                                                            }}
                                                            className="text-[10px] font-semibold text-gray-500 hover:text-gray-850 cursor-pointer text-right"
                                                            style={{ background: "none", flex: 1 }}
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                    <div className="py-1">
                                                        <DropdownMenuCheckboxItem
                                                            checked={selectedTypes.includes('staff')}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedTypes([...selectedTypes, 'staff']);
                                                                } else {
                                                                    setSelectedTypes(selectedTypes.filter(t => t !== 'staff'));
                                                                }
                                                            }}
                                                            onSelect={(e) => e.preventDefault()}
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
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="rounded-md focus:bg-gray-50 cursor-pointer text-xs"
                                                        >
                                                            WORKER
                                                        </DropdownMenuCheckboxItem>
                                                    </div>
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
                                                <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto p-0 z-50">
                                                    <div
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="sticky top-0 z-10 flex items-center justify-between px-2 py-1 border-b border-gray-100 bg-gray-50/95 backdrop-blur-xs"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setSelectedNationalities(uniqueNationalities);
                                                            }}
                                                            className="text-[10px] font-semibold text-gray-500 hover:text-gray-850 cursor-pointer text-left"
                                                            style={{ background: "none", flex: 1 }}
                                                        >
                                                            Select All
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setSelectedNationalities([]);
                                                            }}
                                                            className="text-[10px] font-semibold text-gray-500 hover:text-gray-850 cursor-pointer text-right"
                                                            style={{ background: "none", flex: 1 }}
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                    <div className="py-1">
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
                                                                    onSelect={(e) => e.preventDefault()}
                                                                    className="rounded-md focus:bg-gray-50 cursor-pointer text-xs uppercase"
                                                                >
                                                                    {nat}
                                                                </DropdownMenuCheckboxItem>
                                                            );
                                                        })}
                                                    </div>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </th>
                                {/* <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredEmployees.slice(0, renderLimit).map((emp, idx) => (
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
                                    <td
                                        className="transition-[width,opacity] duration-200 ease-in-out overflow-hidden p-0"
                                        style={{
                                            width: isSelectionMode ? "48px" : "0px",
                                            opacity: isSelectionMode ? 1 : 0,
                                            pointerEvents: isSelectionMode ? "auto" : "none"
                                        }}
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                                            <Checkbox
                                                checked={selectedEmployeeIds.has(emp.id)}
                                                onCheckedChange={() => toggleSelectEmployee(emp.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4 rounded border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white focus-visible:ring-indigo-500 cursor-pointer"
                                            />
                                        </div>
                                    </td>
                                    {/* Name and Email */}
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2.5" style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                                            <Avatar size={"md"} name={emp.name} index={idx} />
                                            <div style={{ display: "flex", flexFlow: "column" }}>
                                                <div className="font-medium text-gray-900" style={{ textAlign: "left", textTransform: "capitalize" }}>{emp.name.toLowerCase()}</div>
                                                {/* {emp.email && (
                                                    <div className="text-xs text-gray-400">{emp.email}</div>
                                                )} */}
                                            </div>
                                        </div>
                                    </td>
                                    {/* IDs */}
                                    <td className="px-4 py-3">
                                        <div style={{ display: "flex", flexFlow: "column", gap: "2px" }}>
                                            <div className="text-xs text-gray-500">ID: <span className="font-medium text-gray-800">{emp.emp_id ?? '—'}</span></div>
                                            <div className="text-xs text-gray-400">Device ID: <span className="font-mono text-gray-700">{emp.device_user_id}</span></div>
                                        </div>
                                    </td>
                                    {/* Biometrics */}
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5" style={{ border: "", justifyContent: "flex-start" }}>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium  ${(emp.fingerprint_templates && Object.keys(emp.fingerprint_templates).length > 0) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                <Fingerprint className="w-3.5 h-3.5" /> Finger
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium  ${(emp.face_templates && Object.keys(emp.face_templates).length > 0) ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                                <Scan className="w-3.5 h-3.5" /> Face
                                            </span>
                                        </div>
                                    </td>
                                    {/* Location */}
                                    <td className="px-4 py-3 text-gray-500 font-medium">
                                        {employeeLocations[emp.device_user_id] ?? emp.location ?? '—'}
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
                {filteredEmployees.length > renderLimit && (
                    <div className="p-4 border-t border-gray-50 flex items-center justify-center gap-4 bg-white/80 backdrop-blur-xs sticky bottom-0 z-10">
                        <span className="text-xs text-gray-500 font-medium text-center">
                            Showing {renderLimit} of {filteredEmployees.length} employees
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setRenderLimit(prev => prev + 100)}
                            className="text-xs font-semibold h-9 rounded-xl hover:bg-gray-50 border-gray-150 transition-colors shadow-xs px-4"
                        >
                            Load More
                        </Button>
                    </div>
                )}
            </div>

            <ResponsiveModal
                open={editingEmployee !== null}
                onOpenChange={(open) => { if (!open) setEditingEmployee(null); }}
                title="Edit Employee"
                description="Modify employee details or synchronize templates to biometric terminals."
                hideHeader
                contentStyle={{ padding: 0, width: "100%", maxWidth: "500px" }}
            >
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'profile' | 'sync')} className="flex flex-col h-full max-h-[92vh] overflow-hidden bg-white md:rounded-2xl w-full">
                    <div className="p-6 pb-4 border-b border-gray-50 shrink-0">
                        <h3 style={{ fontWeight: "600" }} className="text-lg font-bold text-gray-900">Edit Employee</h3>

                    </div>

                    {/* Tabs Header */}
                    <div style={{ width: "100%" }} className="px-6 py-3 bg-gray-50/30 border-b border-gray-100 shrink-0">
                        <TabsList className="grid grid-cols-2 bg-gray-100/80 p-1 h-9 rounded-xl w-full">
                            <TabsTrigger
                                value="profile"
                                className=" font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500"
                            >
                                Profile Details
                            </TabsTrigger>
                            <TabsTrigger
                                value="sync"
                                className=" font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500"
                            >
                                Device Sync
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 max-h-[calc(85vh-120px)] w-full">
                        <TabsContent value="profile" className="p-6 mt-0">
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Device User ID</label>
                                        <Input
                                            type="text"
                                            value={editDeviceUserId}
                                            onChange={(e) => setEditDeviceUserId(e.target.value)}
                                            className="font-mono text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Employee ID (HR)</label>
                                        <Input
                                            type="text"
                                            value={editEmpId}
                                            onChange={(e) => setEditEmpId(e.target.value)}
                                            placeholder="SS0001"
                                            className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 block">Full Name <span className="text-red-500">*</span></label>
                                    <Input
                                        type="text"
                                        required
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="e.g. John Smith"
                                        className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Department</label>
                                        <Input
                                            type="text"
                                            value={editDept}
                                            onChange={(e) => setEditDept(e.target.value)}
                                            placeholder="e.g. Operations"
                                            className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Designation</label>
                                        <Input
                                            type="text"
                                            value={editDesignation}
                                            onChange={(e) => setEditDesignation(e.target.value)}
                                            placeholder="e.g. Engineer"
                                            className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Employee Type</label>
                                        <Select value={editEmpType} onValueChange={(e) => setEditEmpType(e as 'staff' | 'worker')}>
                                            <SelectTrigger className="text-sm bg-gray-50 border-gray-100 rounded-xl">
                                                <SelectValue placeholder="Select Employee Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="staff">Staff</SelectItem>
                                                <SelectItem value="worker">Worker</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Nationality</label>
                                        <Select value={editNationality} onValueChange={(e) => setEditNationality(e)}>
                                            <SelectTrigger className="text-sm bg-gray-50 border-gray-100 rounded-xl">
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
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 block">Email</label>
                                    <Input
                                        type="email"
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        placeholder="john@company.com"
                                        className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl"
                                    />
                                </div>

                                <div className="flex gap-3 border-t border-gray-50">
                                    <Button
                                        className="flex-1 h-10 rounded-xl"
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingEmployee(null)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button className="flex-1 h-10 rounded-xl" type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent style={{ width: "100%" }} value="sync" className="p-6 mt-0 w-full">
                            <div className="space-y-5 w-full">
                                <div className="space-y-1.5 w-full">
                                    <label className="text-xs font-semibold text-gray-500 block">Device Action</label>
                                    <Select value={syncAction} onValueChange={(val) => setSyncAction(val as 'push' | 'fetch')}>
                                        <SelectTrigger className=" bg-gray-50 border-gray-105 rounded-xl h-10 w-full focus:bg-white transition-all">
                                            <SelectValue placeholder="Select Action" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-gray-100 shadow-xl rounded-lg">
                                            <SelectItem value="push" className=" rounded-md focus:bg-gray-50 cursor-pointer">
                                                Push to Device(s)
                                            </SelectItem>
                                            <SelectItem value="fetch" className=" rounded-md focus:bg-gray-50 cursor-pointer">
                                                Fetch from Device(s)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Common Device Selector */}
                                <div className="space-y-2.5 w-full">
                                    <div style={{ justifyContent: "space-between", border: "", height: "2rem" }} className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-gray-550 block">Select Devices</label>
                                        {selectedPushDevices.size > 0 && (
                                            <button
                                                style={{ padding: "0.1rem 0.5rem", borderRadius: "0.25rem" }}
                                                type="button"
                                                onClick={() => setSelectedPushDevices(new Set())}
                                                className="text-[10px] text-gray-400 hover:text-indigo-600 transition-all font-medium"
                                            >
                                                Clear Selection
                                            </button>
                                        )}
                                    </div>

                                    {loadingDevices ? (
                                        <div className="text-xs text-gray-400 flex items-center gap-2 py-4 justify-center">
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading devices...
                                        </div>
                                    ) : devices.length === 0 ? (
                                        <div className="text-xs text-gray-400 py-4 text-center">No registered devices found.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 w-full">
                                            {devices.map(device => {
                                                const isChecked = selectedPushDevices.has(device.serial_no);
                                                const isOnline = device.last_seen
                                                    ? (new Date().getTime() - new Date(device.last_seen).getTime()) < 90000
                                                    : false;
                                                return (
                                                    <div
                                                        key={device.id}
                                                        onClick={() => {
                                                            setSelectedPushDevices(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(device.serial_no)) next.delete(device.serial_no);
                                                                else next.add(device.serial_no);
                                                                return next;
                                                            });
                                                        }}
                                                        className={`flex items-center gap-2 p-2.5 px-2.5 rounded-lg border cursor-pointer select-none transition-all ${isChecked
                                                            ? ''
                                                            : 'border-gray-100 hover:border-gray-200 bg-white'
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            className="w-3.5 h-3.5 rounded border-gray-300 data-[state=checked]:bg-indigo-700 data-[state=checked]:text-white focus-visible:ring-indigo-500 cursor-pointer pointer-events-none shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                                                            <div className="min-w-0 flex-1">
                                                                <span style={{ fontWeight: 500 }} className=" text-[11px] text-gray-850 truncate block leading-tight">
                                                                    {device.serial_no}
                                                                </span>
                                                                {device.location && (
                                                                    <span className="text-[12px] text-gray-400 truncate block leading-tight">
                                                                        {device.location}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                                {/* <span className="text-[11px] text-gray-400">
                                                                    {isOnline ? 'Online' : 'Offline'}
                                                                </span> */}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {syncAction === 'push' ? (
                                    <div style={{ width: "100%" }} className="space-y-4 pt-2 border-t border-gray-50 w-full">
                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 h-10 rounded-xl"
                                                type="button"
                                                variant="outline"
                                                onClick={() => setEditingEmployee(null)}
                                                disabled={isPushing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                disabled={isPushing || selectedPushDevices.size === 0 || !editingEmployee}
                                                onClick={handleIndividualPush}
                                                className="flex-1 h-10 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                            >
                                                {isPushing ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Pushing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Push to Devices ({selectedPushDevices.size})
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ width: "100%" }} className="space-y-4 pt-2 border-t border-gray-50 w-full">


                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 h-10 rounded-xl"
                                                type="button"
                                                variant="outline"
                                                onClick={() => setEditingEmployee(null)}
                                                disabled={isFetching}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                disabled={isFetching || selectedPushDevices.size === 0 || !editingEmployee}
                                                onClick={handleFetchBiometrics}
                                                className="flex-1 h-10 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                            >
                                                {isFetching ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        Requesting Fetch...
                                                    </>
                                                ) : (
                                                    <>
                                                        Fetch Biometrics ({selectedPushDevices.size})
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </ResponsiveModal>

            {/* Add Employee Dialog */}
            <ResponsiveModal
                open={isAdding}
                onOpenChange={setIsAdding}
                title="Add Employee"
                description="Create a new employee record and optionally push it to biometric devices."
                hideHeader
                contentStyle={{ padding: 0, width: "100%", maxWidth: "500px" }}
            >
                <Tabs value={addActiveTab} onValueChange={(val) => setAddActiveTab(val as 'profile' | 'sync')} className="flex flex-col h-full max-h-[92vh] overflow-hidden bg-white md:rounded-2xl w-full">
                    <div className="p-6 pb-4 border-b border-gray-50 shrink-0 bg-white">
                        <h3 style={{ fontWeight: "600" }} className="text-lg font-bold text-gray-900">Add Employee</h3>
                    </div>

                    {/* Tabs Header */}
                    <div style={{ width: "100%" }} className="px-6 py-3 bg-gray-50/30 border-b border-gray-100 shrink-0">
                        <TabsList className="grid grid-cols-2 bg-gray-100/80 p-1 h-9 rounded-xl w-full">
                            <TabsTrigger
                                value="profile"
                                className=" font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500"
                            >
                                Profile Details
                            </TabsTrigger>
                            <TabsTrigger
                                value="sync"
                                className=" font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 text-gray-500"
                            >
                                Device Sync
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 max-h-[calc(85vh-120px)] w-full">
                        <TabsContent value="profile" className="p-6 mt-0 w-full">
                            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Device User ID <span className="text-red-500">*</span></label>
                                        <Input
                                            type="text"
                                            required
                                            value={addDeviceUserId}
                                            onChange={(e) => setAddDeviceUserId(e.target.value)}
                                            placeholder="e.g. 110525"
                                            className="font-mono text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl h-10 w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Employee ID (HR)</label>
                                        <Input
                                            type="text"
                                            value={addEmpId}
                                            onChange={(e) => setAddEmpId(e.target.value)}
                                            placeholder="e.g. EMP-045"
                                            className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl h-10 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Full Name <span className="text-red-500">*</span></label>
                                        <Input
                                            type="text"
                                            required
                                            value={addName}
                                            onChange={(e) => setAddName(e.target.value)}
                                            placeholder="e.g. John Smith"
                                            className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl h-10 w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Email</label>
                                        <Input
                                            type="email"
                                            value={addEmail}
                                            onChange={(e) => setAddEmail(e.target.value)}
                                            placeholder="john@company.com"
                                            className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl h-10 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Department</label>
                                        <Input
                                            type="text"
                                            value={addDept}
                                            onChange={(e) => setAddDept(e.target.value)}
                                            placeholder="e.g. Operations"
                                            className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl h-10 w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Designation</label>
                                        <Input
                                            type="text"
                                            value={addDesignation}
                                            onChange={(e) => setAddDesignation(e.target.value)}
                                            placeholder="e.g. Engineer"
                                            className="text-sm bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl h-10 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Employee Type</label>
                                        <Select value={addEmpType} onValueChange={(e) => setAddEmpType(e as 'staff' | 'worker')}>
                                            <SelectTrigger className="text-xs bg-gray-50 border-gray-100 rounded-xl h-10 w-full focus:bg-white transition-all">
                                                <SelectValue placeholder="Select Employee Type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border border-gray-100 shadow-xl rounded-lg">
                                                <SelectItem value="staff" className="rounded-md focus:bg-gray-50 cursor-pointer">Staff</SelectItem>
                                                <SelectItem value="worker" className="rounded-md focus:bg-gray-50 cursor-pointer">Worker</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 block">Nationality</label>
                                        <Select value={addNationality} onValueChange={(e) => setAddNationality(e)}>
                                            <SelectTrigger className="text-xs bg-gray-50 border-gray-100 rounded-xl h-10 w-full focus:bg-white transition-all">
                                                <SelectValue placeholder="Select Nationality" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border border-gray-100 shadow-xl rounded-lg">
                                                {NATIONALITIES.map((nat) => (
                                                    <SelectItem key={nat} value={nat} className="rounded-md focus:bg-gray-50 cursor-pointer">
                                                        {nat.toUpperCase()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-gray-50 w-full">
                                    <Button
                                        className="flex-1 h-10 rounded-xl"
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAdding(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 h-10 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all font-semibold"
                                        type="button"
                                        onClick={() => setAddActiveTab('sync')}
                                    >
                                        Next: Device Sync
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="sync" className="p-6 mt-0 w-full">
                            <div className="space-y-5 w-full">
                                {/* Device Selection Grid */}
                                <div className="space-y-2.5 w-full">
                                    <div style={{ justifyContent: "space-between", height: "2rem" }} className="flex justify-between items-center">
                                        <label className="text-xs font-semibold text-gray-550 block">Push to biometric devices</label>
                                        {selectedDevices.size > 0 && (
                                            <button
                                                style={{ padding: "0.1rem 0.5rem", borderRadius: "0.25rem" }}
                                                type="button"
                                                onClick={() => setSelectedDevices(new Set())}
                                                className="text-[10px] text-gray-400 hover:text-indigo-600 transition-all font-medium"
                                            >
                                                Clear Selection
                                            </button>
                                        )}
                                    </div>

                                    {loadingDevices ? (
                                        <div className="text-xs text-gray-400 flex items-center gap-2 py-4 justify-center">
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading devices...
                                        </div>
                                    ) : devices.length === 0 ? (
                                        <div className="text-xs text-gray-400 py-4 text-center">No registered devices found.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 w-full">
                                            {devices.map(device => {
                                                const isChecked = selectedDevices.has(device.serial_no);
                                                const isOnline = device.last_seen
                                                    ? (new Date().getTime() - new Date(device.last_seen).getTime()) < 90000
                                                    : false;
                                                return (
                                                    <div
                                                        key={device.id}
                                                        onClick={() => {
                                                            setSelectedDevices(prev => {
                                                                const next = new Set(prev);
                                                                if (next.has(device.serial_no)) next.delete(device.serial_no);
                                                                else next.add(device.serial_no);
                                                                return next;
                                                            });
                                                        }}
                                                        className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border cursor-pointer select-none transition-all ${isChecked
                                                            ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                                                            : 'border-gray-100 hover:border-gray-200 bg-white'
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            className="w-3.5 h-3.5 rounded border-gray-300 data-[state=checked]:bg-indigo-700 data-[state=checked]:text-white focus-visible:ring-indigo-500 cursor-pointer pointer-events-none shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                                                            <div className="min-w-0 flex-1">
                                                                <span className="font-mono text-[10px] font-semibold text-gray-850 truncate block leading-tight">
                                                                    {device.serial_no}
                                                                </span>
                                                                {device.location && (
                                                                    <span className="text-[10px] text-gray-400 font-sans truncate block leading-tight">
                                                                        {device.location}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                                <span className="text-[11px] text-gray-400">
                                                                    {isOnline ? 'Online' : 'Offline'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-gray-50 w-full">
                                    <Button
                                        className="flex-1 h-10 rounded-xl"
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAdding(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 h-10 rounded-xl"
                                        type="button"
                                        variant="secondary"
                                        onClick={(e) => handleAddSubmit(e, false)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save only'}
                                    </Button>
                                    <Button
                                        className="flex-1 h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all font-semibold"
                                        type="button"
                                        onClick={(e) => handleAddSubmit(e, true)}
                                        disabled={isSubmitting || selectedDevices.size === 0}
                                    >
                                        {isSubmitting ? 'Saving...' : `Save & Push (${selectedDevices.size})`}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </ResponsiveModal>

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

            {/* Bulk Push to Devices Dialog */}
            <Dialog open={isBulkPushOpen} onOpenChange={(open) => { if (!open) setIsBulkPushOpen(false); }}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Push Selected Employees to Devices</DialogTitle>
                        <DialogDescription>
                            You have selected {selectedEmployeeIds.size} employee(s). Choose target biometric devices to queue user profile and templates sync.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkPushSubmit} className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between" style={{ justifyContent: "space-between", padding: "0 0.5rem" }}>
                                <label className="text-xs font-semibold text-gray-500 block">Select target devices</label>
                                {devices.length > 0 && (
                                    <button
                                        style={{
                                            cursor: "pointer",
                                            padding: "0.1rem 0.45rem"
                                        }}
                                        type="button"
                                        onClick={() => {
                                            if (selectedBulkPushDevices.size === devices.length) {
                                                setSelectedBulkPushDevices(new Set());
                                            } else {
                                                setSelectedBulkPushDevices(new Set(devices.map(d => d.serial_no)));
                                            }
                                        }}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        {selectedBulkPushDevices.size === devices.length ? 'Deselect all' : 'Select all'}
                                    </button>
                                )}
                            </div>

                            {loadingDevices ? (
                                <div className="text-xs text-gray-400 flex items-center justify-center gap-1.5 py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading devices...
                                </div>
                            ) : devices.length === 0 ? (
                                <div className="text-xs text-gray-400 py-4 text-center">No registered devices found.</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                                    {devices.map(device => {
                                        const isChecked = selectedBulkPushDevices.has(device.serial_no);
                                        const isOnline = device.last_seen
                                            ? (new Date().getTime() - new Date(device.last_seen).getTime()) < 90000
                                            : false;
                                        return (
                                            <div
                                                key={device.id}
                                                onClick={() => {
                                                    setSelectedBulkPushDevices(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(device.serial_no)) next.delete(device.serial_no);
                                                        else next.add(device.serial_no);
                                                        return next;
                                                    });
                                                }}
                                                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${isChecked
                                                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                                    }`}
                                            >
                                                <div className="pt-0.5">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        className="w-4 h-4 rounded border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white focus-visible:ring-indigo-500 cursor-pointer pointer-events-none"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="font-mono text-[11px] font-semibold text-gray-800 truncate">
                                                            {device.serial_no}
                                                        </span>
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                    </div>
                                                    {device.location && (
                                                        <div className="text-[11px] text-gray-500 font-sans truncate">
                                                            {device.location}
                                                        </div>
                                                    )}
                                                    <span className="text-[9px] text-gray-400 font-sans block mt-0.5">
                                                        {isOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4 border-t border-gray-100">
                            <Button
                                style={{ flex: 1 }}
                                type="button"
                                variant="outline"
                                onClick={() => setIsBulkPushOpen(false)}
                                disabled={isBulkPushing}
                            >
                                Cancel
                            </Button>
                            <Button
                                style={{ flex: 1 }}
                                type="submit"
                                disabled={isBulkPushing || selectedBulkPushDevices.size === 0}
                                className="bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                {isBulkPushing ? 'Queuing...' : `Push to ${selectedBulkPushDevices.size} Device(s)`}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Excel Upload Confirmation Dialog */}
            <Dialog open={uploadModalOpen} onOpenChange={(open) => {
                if (uploadState === 'uploading') return; // Prevent closing while uploading
                setUploadModalOpen(open);
            }}>
                <DialogContent className="sm:max-w-[550px] bg-white border border-gray-105 shadow-2xl rounded-2xl p-6">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">

                            Import Employees from Excel
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-505">
                            {uploadState === 'idle' && "Upload a spreadsheet file to batch import employees."}
                            {uploadState === 'preview' && `Review data parsed from "${uploadFileName}".`}
                            {uploadState === 'uploading' && "Importing employees. Please do not close this window."}
                            {uploadState === 'completed' && "Import completed successfully."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step 1: Choose File */}
                    {uploadState === 'idle' && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="my-6 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50/50 hover:border-indigo-300 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                                <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-semibold text-gray-805 block mb-0.5">Click to upload or drag & drop</span>
                                <span className="text-xs text-gray-400">Excel files (.xlsx, .xls) only</span>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview & Confirm */}
                    {uploadState === 'preview' && (
                        <div className="space-y-4 my-2">
                            {/* Summary Info */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex gap-4 text-xs font-medium">
                                <div className="flex-1">
                                    <span className="text-gray-400 block mb-0.5">New Employees</span>
                                    <span className="text-gray-950 text-lg font-bold">{parsedEmployees.length}</span>
                                </div>
                                {duplicateEmployees.length > 0 && (
                                    <div className="flex-1 border-l border-slate-200 pl-4">
                                        <span className="text-amber-600 block mb-0.5">Already Registered (Skipped)</span>
                                        <span className="text-amber-700 text-lg font-bold">{duplicateEmployees.length}</span>
                                    </div>
                                )}
                            </div>

                            {/* Preview list */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-700 mb-2">Employees Preview (showing up to 5)</h4>
                                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto">
                                    <table className="w-full text-left text-xs text-gray-600">
                                        <thead className="bg-gray-50 sticky top-0 border-b border-gray-100 font-semibold text-gray-500">
                                            <tr>
                                                <th className="px-3 py-2">Device User ID</th>
                                                <th className="px-3 py-2">Name</th>
                                                <th className="px-3 py-2">Type</th>
                                                <th className="px-3 py-2">Department</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {parsedEmployees.slice(0, 5).map((emp, index) => (
                                                <tr key={index}>
                                                    <td className="px-3 py-2 font-mono text-gray-900">{emp.device_user_id}</td>
                                                    <td className="px-3 py-2 capitalize font-medium text-gray-900">{emp.name.toLowerCase()}</td>
                                                    <td className="px-3 py-2 uppercase font-semibold text-[10px] text-gray-400">{emp.emp_type}</td>
                                                    <td className="px-3 py-2">{emp.department || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Push to Devices Toggle Option */}
                            <div className="border-t border-gray-100 pt-3">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={uploadPushToDevices}
                                        onChange={(e) => setUploadPushToDevices(e.target.checked)}
                                        className="w-4 h-4 rounded accent-indigo-600"
                                    />
                                    Also push these new employees to attendance devices
                                </label>

                                {uploadPushToDevices && (
                                    <div className="mt-3 bg-gray-50/50 border border-gray-100 rounded-xl p-3.5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Select Devices</h5>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (uploadSelectedDevices.size === devices.length) {
                                                        setUploadSelectedDevices(new Set());
                                                    } else {
                                                        setUploadSelectedDevices(new Set(devices.map(d => d.serial_no)));
                                                    }
                                                }}
                                                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                                            >
                                                {uploadSelectedDevices.size === devices.length ? 'Select None' : 'Select All'}
                                            </button>
                                        </div>

                                        {devices.length === 0 ? (
                                            <div className="text-xs text-gray-400 text-center py-4 bg-white border border-gray-100 rounded-lg">
                                                No registered devices found.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                                {devices.map(device => {
                                                    const isChecked = uploadSelectedDevices.has(device.serial_no);
                                                    const isOnline = device.last_seen
                                                        ? (new Date().getTime() - new Date(device.last_seen).getTime()) < 90000
                                                        : false;
                                                    return (
                                                        <div

                                                            key={device.id}
                                                            onClick={() => {
                                                                setUploadSelectedDevices(prev => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(device.serial_no)) next.delete(device.serial_no);
                                                                    else next.add(device.serial_no);
                                                                    return next;
                                                                });
                                                            }}
                                                            className={`flex items-center gap-2.5 p-2 px-3 rounded-lg border cursor-pointer select-none transition-all ${isChecked
                                                                ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => { }} // Controlled by onClick
                                                                className="w-3.5 h-3.5 accent-indigo-600 pointer-events-none"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1 mb-0.5">
                                                                    <span className="font-mono text-[10px] font-semibold text-gray-805 truncate">
                                                                        {device.serial_no}
                                                                    </span>
                                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                                </div>
                                                                {device.location && (
                                                                    <div className="text-[9px] text-gray-500 truncate leading-none">
                                                                        {device.location}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Progress & Uploading */}
                    {uploadState === 'uploading' && (
                        <div className="my-8 space-y-4 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-1" />
                            <div className="w-full text-center">
                                <span className="text-sm font-semibold text-gray-850 block mb-1">
                                    Importing employees ({uploadCurrentIndex} of {uploadTotalCount})
                                </span>
                                <span className="text-xs text-gray-400">
                                    {uploadTotalCount - uploadCurrentIndex} remaining...
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-200 ease-out"
                                    style={{ width: `${(uploadCurrentIndex / uploadTotalCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Completed */}
                    {uploadState === 'completed' && (
                        <div className="my-8 flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 animate-bounce">
                                <SquareCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-semibold text-gray-800 block mb-0.5">Import completed successfully!</span>
                                <span className="text-xs text-gray-400">Added {uploadTotalCount} employees into the database.</span>
                            </div>
                        </div>
                    )}

                    {/* Modal Footer (conditional based on step) */}
                    <DialogFooter className="pt-4 border-t border-gray-100 flex gap-2">
                        {uploadState === 'idle' && (
                            <Button
                                style={{ flex: 1 }}
                                type="button"
                                variant="outline"
                                onClick={() => setUploadModalOpen(false)}
                            >
                                Cancel
                            </Button>
                        )}
                        {uploadState === 'preview' && (
                            <>
                                <Button
                                    style={{ flex: 1 }}
                                    type="button"
                                    variant="outline"
                                    onClick={handleResetUpload}
                                >
                                    Select Another File
                                </Button>
                                <Button
                                    style={{ flex: 1 }}
                                    type="button"
                                    onClick={handleConfirmUpload}
                                    disabled={uploadPushToDevices && uploadSelectedDevices.size === 0}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
                                >
                                    Import {parsedEmployees.length} Employees
                                </Button>
                            </>
                        )}
                        {uploadState === 'uploading' && (
                            <Button
                                style={{ flex: 1 }}
                                type="button"
                                disabled
                                className="bg-gray-100 text-gray-450 cursor-not-allowed"
                            >
                                Importing in progress...
                            </Button>
                        )}
                        {uploadState === 'completed' && (
                            <Button
                                style={{ flex: 1 }}
                                type="button"
                                onClick={() => {
                                    setUploadModalOpen(false);
                                    handleResetUpload();
                                }}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                            >
                                Close
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}