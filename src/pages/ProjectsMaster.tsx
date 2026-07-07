import { useAuth } from '@/components/AuthProvider';
import CustomDropDown from '@/components/custom-dropdown';
import { ResponsiveModal } from '@/components/responsive-modal';
import {
  Check,
  ChevronDown,
  Compass,
  FolderKanban,
  Laptop2,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Scan,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatLocationGeofence, parseLocationGeofence } from '../lib/geofence';
import { supabase } from '../lib/supabase';

interface Project {
  id: number;
  project_code: string;
  project_name: string;
  project_location: string | null;
  project_in_time: string | null;
  project_out_time: string | null;
  focal_point_id: string | null;
  focal_point_name: string | null;
  focal_point_email: string | null;
}

interface Device {
  id: number;
  serial_no: string;
  location: string | null;
  project_code: string | null;
}

interface ProjectForm {
  project_code: string;
  project_name: string;
  project_location: string;
  project_in_time: string;
  project_out_time: string;
  geofence_enabled: boolean;
  geofence_lat: string;
  geofence_lng: string;
  geofence_radius: string;
  focal_point_id: string;
  focal_point_name: string;
  focal_point_email: string;
}

const defaultForm: ProjectForm = {
  project_code: '',
  project_name: '',
  project_location: '',
  project_in_time: '08:00',
  project_out_time: '17:00',
  geofence_enabled: false,
  geofence_lat: '',
  geofence_lng: '',
  geofence_radius: '',
  focal_point_id: '',
  focal_point_name: '',
  focal_point_email: ''
};

const toISOString = (timeStr: string | null): string | null => {
  if (!timeStr) return null;
  try {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date.toISOString();
  } catch (err) {
    console.error("Error parsing time to ISO:", err);
    return null;
  }
};

const formatISOToTime = (isoStr: string | null): string => {
  if (!isoStr) return '';
  try {
    const date = new Date(isoStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (err) {
    console.error("Error parsing ISO to time:", err);
    return '';
  }
};

interface ProjectsMasterProps {
  refreshTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}

export default function ProjectsMaster({ refreshTrigger, onLoadingChange }: ProjectsMasterProps = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Dialog States
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion Confirm States
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Focal Point Dialog States
  const [focalPointProject, setFocalPointProject] = useState<Project | null>(null);
  const [focalForm, setFocalForm] = useState({
    focal_point_id: '',
    focal_point_name: '',
    focal_point_email: ''
  });

  // Focal Point Popover Search States
  const [openEmpSelect, setOpenEmpSelect] = useState(false);
  const [empSearch, setEmpSearch] = useState("");

  const selectableEmployees = useMemo(() => {
    if (!empSearch.trim()) return employeesList;
    const q = empSearch.toLowerCase().trim();
    return employeesList.filter(emp =>
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.emp_id && emp.emp_id.toLowerCase().includes(q)) ||
      (emp.device_user_id && emp.device_user_id.toLowerCase().includes(q))
    );
  }, [employeesList, empSearch]);

  const selectedEmp = useMemo(() => {
    if (!focalForm.focal_point_id) return null;
    return employeesList.find(emp =>
      emp.emp_id === focalForm.focal_point_id ||
      emp.device_user_id === focalForm.focal_point_id ||
      String(emp.id) === focalForm.focal_point_id
    );
  }, [employeesList, focalForm.focal_point_id]);

  // Geofence Dialog States
  const [geofenceProject, setGeofenceProject] = useState<Project | null>(null);
  const [isEditingGeofence, setIsEditingGeofence] = useState(false);

  // Device Allocation States
  const [allocatingProjectId, setAllocatingProjectId] = useState<string | null>(null);
  const [selectedDeviceSerial, setSelectedDeviceSerial] = useState<string>('');
  const [allocating, setAllocating] = useState<string | null>(null);

  const { userData } = useAuth();

  const canEditAttendance = useMemo(() => {
    try {
      const permissions = JSON.parse(userData?.clearance || "{}") as Record<string, boolean>;
      const hasStructuredClearance = Object.keys(permissions).length > 0;
      const hasAttendanceModule = permissions.attendance === true;
      const hasAttendanceEdit = permissions.attendance_edit === true;
      const hasExplicitEditBlock = permissions.attendance_edit === false;

      if (hasAttendanceModule) {
        return hasAttendanceEdit;
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

  const previewLat = parseFloat(form.geofence_lat);
  const previewLng = parseFloat(form.geofence_lng);
  const showMapPreview = !isNaN(previewLat) && previewLat >= -90 && previewLat <= 90 && !isNaN(previewLng) && previewLng >= -180 && previewLng <= 180;

  const loadData = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch projects
      const { data: projData, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .order('project_code', { ascending: true });
      if (projErr) throw projErr;

      // Fetch devices
      const { data: devData, error: devErr } = await supabase
        .from('devices')
        .select('id, serial_no, location, project_code')
        .order('serial_no', { ascending: true });
      if (devErr) throw devErr;

      // Fetch employees for focal point assignment
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('id, name, email, emp_id, device_user_id')
        .order('name', { ascending: true });
      if (empErr) console.warn("Could not load employees for focal point:", empErr.message);

      setProjects(projData || []);
      setDevices(devData || []);
      setEmployeesList(empData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects and devices data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadData(false);
    }
  }, [refreshTrigger, loadData]);

  useEffect(() => {
    onLoadingChange?.(loading || refreshing);
  }, [loading, refreshing, onLoadingChange]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (openEmpSelect && !target.closest('.employee-dropdown-container')) {
        setOpenEmpSelect(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openEmpSelect]);

  // Group devices by project_code for easier lookup
  const devicesByProject = useMemo(() => {
    const map: Record<string, Device[]> = {};
    devices.forEach(d => {
      if (d.project_code) {
        if (!map[d.project_code]) {
          map[d.project_code] = [];
        }
        map[d.project_code].push(d);
      }
    });
    return map;
  }, [devices]);

  // Devices that are not allocated to any project
  const unallocatedDevices = useMemo(() => {
    return devices.filter(d => !d.project_code);
  }, [devices]);

  function openAdd() {
    setIsAdding(true);
    setForm(defaultForm);
    setFormError(null);
  }

  function closeAdd() {
    setIsAdding(false);
    setFormError(null);
  }

  async function handleAdd() {
    if (!form.project_code.trim()) {
      setFormError('Project code is required.');
      return;
    }
    if (!form.project_name.trim()) {
      setFormError('Project name is required.');
      return;
    }

    // Check duplicate code locally
    const duplicate = projects.some(p => p.project_code.toLowerCase() === form.project_code.trim().toLowerCase());
    if (duplicate) {
      setFormError(`Project code "${form.project_code}" already exists.`);
      return;
    }

    // Validate geofence parameters
    let finalLocation = form.project_location.trim();
    const latStr = form.geofence_lat.trim();
    const lngStr = form.geofence_lng.trim();
    const radStr = form.geofence_radius.trim();
    const hasGeofenceInput = latStr !== '' || lngStr !== '' || radStr !== '';

    if (hasGeofenceInput) {
      const latVal = parseFloat(latStr);
      const lngVal = parseFloat(lngStr);
      const radVal = parseFloat(radStr);
      if (isNaN(latVal) || latVal < -90 || latVal > 90) {
        setFormError('Please enter a valid Latitude (-90 to 90).');
        return;
      }
      if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
        setFormError('Please enter a valid Longitude (-180 to 180).');
        return;
      }
      if (isNaN(radVal) || radVal <= 0) {
        setFormError('Please enter a valid Radius in meters (> 0).');
        return;
      }
      finalLocation = formatLocationGeofence(finalLocation, latVal, lngVal, radVal);
    }

    setSaving(true);
    setFormError(null);

    try {
      const inTimeISO = toISOString(form.project_in_time);
      const outTimeISO = toISOString(form.project_out_time);

      const { error: err } = await supabase
        .from('projects')
        .insert({
          project_code: form.project_code.trim(),
          project_name: form.project_name.trim(),
          project_location: finalLocation || null,
          project_in_time: inTimeISO,
          project_out_time: outTimeISO,
          focal_point_id: form.focal_point_id.trim() || null,
          focal_point_name: form.focal_point_name.trim() || null,
          focal_point_email: form.focal_point_email.trim() || null
        });

      if (err) throw err;

      toast.success('Project created successfully!');
      closeAdd();
      loadData(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    const { name: displayName, geofence } = parseLocationGeofence(project.project_location);
    setForm({
      project_code: project.project_code,
      project_name: project.project_name,
      project_location: displayName,
      project_in_time: formatISOToTime(project.project_in_time) || '08:00',
      project_out_time: formatISOToTime(project.project_out_time) || '17:00',
      geofence_enabled: !!geofence,
      geofence_lat: geofence ? String(geofence.lat) : '',
      geofence_lng: geofence ? String(geofence.lng) : '',
      geofence_radius: geofence ? String(geofence.radius) : '',
      focal_point_id: project.focal_point_id || '',
      focal_point_name: project.focal_point_name || '',
      focal_point_email: project.focal_point_email || ''
    });
    setFormError(null);
  }

  function closeEdit() {
    setEditingProject(null);
    setFormError(null);
  }

  async function handleEdit() {
    if (!editingProject) return;
    if (!form.project_name.trim()) {
      setFormError('Project name is required.');
      return;
    }

    // Validate geofence parameters
    let finalLocation = form.project_location.trim();
    const latStr = form.geofence_lat.trim();
    const lngStr = form.geofence_lng.trim();
    const radStr = form.geofence_radius.trim();
    const hasGeofenceInput = latStr !== '' || lngStr !== '' || radStr !== '';

    if (hasGeofenceInput) {
      const latVal = parseFloat(latStr);
      const lngVal = parseFloat(lngStr);
      const radVal = parseFloat(radStr);
      if (isNaN(latVal) || latVal < -90 || latVal > 90) {
        setFormError('Please enter a valid Latitude (-90 to 90).');
        return;
      }
      if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
        setFormError('Please enter a valid Longitude (-180 to 180).');
        return;
      }
      if (isNaN(radVal) || radVal <= 0) {
        setFormError('Please enter a valid Radius in meters (> 0).');
        return;
      }
      finalLocation = formatLocationGeofence(finalLocation, latVal, lngVal, radVal);
    }

    setSaving(true);
    setFormError(null);

    try {
      const inTimeISO = toISOString(form.project_in_time);
      const outTimeISO = toISOString(form.project_out_time);

      const { data, error: err } = await supabase
        .from('projects')
        .update({
          project_name: form.project_name.trim(),
          project_location: finalLocation || null,
          project_in_time: inTimeISO,
          project_out_time: outTimeISO,
          focal_point_id: form.focal_point_id.trim() || null,
          focal_point_name: form.focal_point_name.trim() || null,
          focal_point_email: form.focal_point_email.trim() || null
        })
        .eq('project_code', editingProject.project_code)
        .select();

      if (err) throw err;
      if (!data || data.length === 0) {
        throw new Error('Update failed. This may be due to Row Level Security (RLS) policies blocking updates on the projects table.');
      }

      toast.success('Project updated successfully!');
      closeEdit();
      loadData(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm(project: Project) {
    setDeletingProject(project);
  }

  async function handleDelete() {
    if (!deletingProject) return;
    setDeleting(true);

    try {
      // 1. De-allocate devices first to maintain RLS / constraints
      const assigned = devicesByProject[deletingProject.project_code] || [];
      if (assigned.length > 0) {
        const { error: devErr } = await supabase
          .from('devices')
          .update({ project_code: null })
          .eq('project_code', deletingProject.project_code);
        if (devErr) throw devErr;
      }

      // 2. Delete the project
      const { error: projErr } = await supabase
        .from('projects')
        .delete()
        .eq('project_code', deletingProject.project_code);
      if (projErr) throw projErr;

      toast.success('Project deleted successfully!');
      setDeletingProject(null);
      loadData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
    }
  }

  function openFocalPointModal(project: Project) {
    setFocalPointProject(project);
    setFocalForm({
      focal_point_id: project.focal_point_id || '',
      focal_point_name: project.focal_point_name || '',
      focal_point_email: project.focal_point_email || ''
    });
    setFormError(null);
  }

  function closeFocalPointModal() {
    setFocalPointProject(null);
    setFormError(null);
  }

  async function handleSaveFocalPoint() {
    if (!focalPointProject) return;
    setSaving(true);
    setFormError(null);

    try {
      const { data, error: err } = await supabase
        .from('projects')
        .update({
          focal_point_id: focalForm.focal_point_id.trim() || null,
          focal_point_name: focalForm.focal_point_name.trim() || null,
          focal_point_email: focalForm.focal_point_email.trim() || null
        })
        .eq('project_code', focalPointProject.project_code)
        .select();

      if (err) throw err;
      if (!data || data.length === 0) {
        throw new Error('Update failed. This may be due to Row Level Security (RLS) policies blocking updates on the projects table.');
      }

      toast.success('Focal point updated successfully!');
      closeFocalPointModal();
      loadData(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update focal point.');
    } finally {
      setSaving(false);
    }
  }

  function openGeofenceModal(project: Project) {
    setGeofenceProject(project);
    const { geofence, name: displayName } = parseLocationGeofence(project.project_location);
    setForm({
      project_code: project.project_code,
      project_name: project.project_name,
      project_location: displayName || '',
      project_in_time: project.project_in_time || '',
      project_out_time: project.project_out_time || '',
      geofence_enabled: !!geofence,
      geofence_lat: geofence?.lat ? String(geofence.lat) : '',
      geofence_lng: geofence?.lng ? String(geofence.lng) : '',
      geofence_radius: geofence?.radius ? String(geofence.radius) : '100',
      focal_point_id: project.focal_point_id || '',
      focal_point_name: project.focal_point_name || '',
      focal_point_email: project.focal_point_email || ''
    });
    setFormError(null);
    setIsEditingGeofence(true);
  }

  function closeGeofenceModal() {
    setIsEditingGeofence(false);
    setGeofenceProject(null);
    setFormError(null);
    setForm(defaultForm);
  }

  async function handleSaveGeofence() {
    if (!geofenceProject) return;

    let finalLocation = form.project_location.trim();
    const latVal = parseFloat(form.geofence_lat);
    const lngVal = parseFloat(form.geofence_lng);
    const radVal = parseFloat(form.geofence_radius);

    if (form.geofence_lat || form.geofence_lng || form.geofence_radius) {
      if (isNaN(latVal) || latVal < -90 || latVal > 90) {
        setFormError('Please enter a valid Latitude (-90 to 90).');
        return;
      }
      if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
        setFormError('Please enter a valid Longitude (-180 to 180).');
        return;
      }
      if (isNaN(radVal) || radVal <= 0) {
        setFormError('Please enter a valid Radius in meters (> 0).');
        return;
      }
      finalLocation = formatLocationGeofence(finalLocation, latVal, lngVal, radVal);
    }

    setSaving(true);
    setFormError(null);

    try {
      const { data, error: err } = await supabase
        .from('projects')
        .update({
          project_location: finalLocation || null
        })
        .eq('project_code', geofenceProject.project_code)
        .select();

      if (err) throw err;
      if (!data || data.length === 0) {
        throw new Error('Update failed. This may be due to Row Level Security (RLS) policies blocking updates on the projects table.');
      }

      toast.success('Geofence settings updated successfully!');
      closeGeofenceModal();
      loadData(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update geofence.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAllocateDevice(projectCode: string) {
    if (!selectedDeviceSerial) return;
    setAllocating(selectedDeviceSerial);

    try {
      const { error: err } = await supabase
        .from('devices')
        .update({ project_code: projectCode })
        .eq('serial_no', selectedDeviceSerial);

      if (err) throw err;

      toast.success(`Device ${selectedDeviceSerial} allocated successfully.`);
      setSelectedDeviceSerial('');
      setAllocatingProjectId(null);
      loadData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to allocate device.');
    } finally {
      setAllocating(null);
    }
  }

  async function handleDeallocateDevice(serialNo: string) {
    setAllocating(serialNo);

    try {
      const { error: err } = await supabase
        .from('devices')
        .update({ project_code: null })
        .eq('serial_no', serialNo);

      if (err) throw err;

      toast.success(`Device ${serialNo} unallocated.`);
      loadData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to unallocate device.');
    } finally {
      setAllocating(null);
    }
  }

  return (
    <div className="bg-white flex flex-col animate-fade-in" style={{ width: "100%", height: "82vh", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out forwards;
        }
        .project-card {
          background: #ffffff;
          border: 1px solid #f1f5f9;
        
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 270px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
       
        .project-title {
          font-size: 15px;
          font-weight: 500;
          color: #0f172a;
          margin-top: 4px;
          line-height: 1.4;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #475569;
        }
        .meta-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
        }
        .device-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 11px;
          font-family: monospace;
          color: #334155;
          font-weight: 500;
        }
        .device-badge:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        .link-btn {
          font-size: 11px;
          font-weight: 500;
          color: #4f46e5;
          background: #f5f3ff;
          border: 1px solid #e0e7ff;
          
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .link-btn:hover {
          background: #ede9fe;
          color: #4338ca;
        }
        .action-btn {
          padding: 6px;
          border-radius: 6px;
          color: #94a3b8;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn:hover {
          color: #475569;
          background: #f1f5f9;
        }
        .delete-btn:hover {
          color: #dc2626;
          background: #fef2f2;
        }
      `}</style>
      <div className="w-full px-4 sm:px-6 py-8 flex flex-col flex-1 overflow-hidden">

        {/* Header Toolbar */}
        <div style={{ width: "100%", justifyContent: "space-between", padding: "0rem 1rem" }} className="flex justify-between items-center mb-6" >
          <div className="flex items-center gap-2">
            <h2>All Projects</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {projects.length} project(s)
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
            {canEditAttendance && (
              <button
                onClick={openAdd}
                className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Project
              </button>
            )}

            <button
              onClick={() => loadData(true)}
              disabled={loading || refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Project Content / Loading */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-sm bg-white">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : projects.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm m-4">
            No projects registered. Click "Add Project" to register one.
          </div>
        ) : (
          <div style={{ border: "1px solid rgba(100 100 100/ 0.1)", width: "100%", borderRadius: "0.5rem", paddingTop: "1rem" }} className="flex-1 overflow-y-auto px-4 pb-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
              {projects.map((project) => {
                const assignedDevices = devicesByProject[project.project_code] || [];
                const isAllocatingThis = allocatingProjectId === project.project_code;

                return (
                  <div key={project.id} className="project-card">
                    {/* Top Part: Info & Actions */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{
                          fontSize: '12px',

                          fontWeight: 500,
                          background: 'rgba(100 100 100/ 0.1)',

                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {project.project_code}
                        </span>

                        {canEditAttendance && (
                          <CustomDropDown
                            trigger={<button className="action-btn" onClick={(e) => e.stopPropagation()}><MoreVertical size={14} /></button>}
                            option1Text="Edit"
                            option1Icon={<Pencil className="w-3.5 h-3.5 mr-2 " />}
                            onOption1={() => openEdit(project)}
                            option2Text="Delete"
                            option2Icon={<Trash2 className="w-3.5 h-3.5 mr-2 " />}
                            onOption2={() => handleDeleteConfirm(project)}
                          />
                        )}
                      </div>

                      <h3 className="project-title">{project.project_name}</h3>
                    </div>

                    {/* Middle Part: Metadata Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
                      <div style={{ justifyContent: "space-between", alignItems: "center", width: "100%" }} className="meta-item flex items-center justify-between flex-wrap gap-2">
                        {(() => {
                          const { name: displayName, geofence } = parseLocationGeofence(project.project_location);
                          return (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                              <span className="truncate max-w-[150px]" title={displayName || "No location set"}>
                                {displayName || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 300 }}>No location set</span>}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {geofence ? (
                                  <button
                                    onClick={() => openGeofenceModal(project)}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                                    title={`Geofence Active:\nLat: ${geofence.lat}\nLng: ${geofence.lng}\nRadius: ${geofence.radius}m\nClick to modify.`}
                                  >
                                    <Scan className="w-2.5 h-2.5 text-emerald-600" />
                                    Active
                                  </button>
                                ) : (
                                  canEditAttendance && (
                                    <button
                                      onClick={() => openGeofenceModal(project)}
                                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer bg-transparent border-0 outline-none p-0"
                                    >
                                      Set Geofence
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="meta-item">

                        <span>
                          Shift:{' '}
                          <strong style={{ color: '#0f172a' }}>
                            {project.project_in_time ? formatISOToTime(project.project_in_time) : '08:00'}
                          </strong>
                          {' '}-{' '}
                          <strong style={{ color: '#0f172a' }}>
                            {project.project_out_time ? formatISOToTime(project.project_out_time) : '17:00'}
                          </strong>
                        </span>
                      </div>

                      {/* Focal Point Information */}
                      <div className="meta-item flex flex-col gap-0.5 border-t border-gray-100/80 pt-2 mt-1">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Timesheet Focal Point</span>
                          {canEditAttendance && (
                            <button
                              onClick={() => openFocalPointModal(project)}
                              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer bg-transparent border-0 outline-none p-0"
                            >
                              {project.focal_point_name ? 'Edit' : 'Assign'}
                            </button>
                          )}
                        </div>
                        {project.focal_point_name ? (
                          <div className="flex flex-col text-xs text-gray-700">
                            <span className="font-semibold text-gray-900">{project.focal_point_name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {project.focal_point_id && <span className="text-[10px] text-gray-400 font-mono bg-gray-100/60 px-1 py-0.2 rounded">{project.focal_point_id}</span>}
                              {project.focal_point_email && <span className="text-[10px] text-gray-500 truncate" title={project.focal_point_email}>{project.focal_point_email}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic font-light">Not Assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Part: Devices list */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Laptop2 className="w-3.5 h-3.5 text-gray-400" />
                          Devices ({assignedDevices.length})
                        </span>

                        {canEditAttendance && !isAllocatingThis && (
                          <button
                            style={{ padding: "0.1rem 0.5rem", display: "flex" }}
                            onClick={() => {
                              setAllocatingProjectId(project.project_code);
                              setSelectedDeviceSerial('');
                            }}
                            className="link-btn"
                          >
                            Link
                          </button>
                        )}
                      </div>

                      {/* Allocate dropdown */}
                      {isAllocatingThis && (
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '6px',
                          display: 'flex',
                          gap: '6px',
                          marginBottom: '8px',
                          alignItems: 'center'
                        }}>
                          <select
                            value={selectedDeviceSerial}
                            onChange={(e) => setSelectedDeviceSerial(e.target.value)}
                            style={{
                              flex: 1,
                              fontSize: '11px',
                              padding: '4px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              background: '#fff',
                              fontFamily: 'monospace',
                              outline: 'none'
                            }}
                          >
                            <option value="">-- Select --</option>
                            {unallocatedDevices.map(d => (
                              <option key={d.id} value={d.serial_no}>
                                {d.serial_no}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAllocateDevice(project.project_code)}
                            disabled={!selectedDeviceSerial || allocating !== null}
                            style={{
                              background: '#4f46e5',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 8px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                          >
                            {allocating === selectedDeviceSerial ? 'Linking…' : 'Link'}
                          </button>
                          <button
                            onClick={() => setAllocatingProjectId(null)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Device tags */}
                      {assignedDevices.length === 0 ? (
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                          No devices linked.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '60px', overflowY: 'auto' }}>
                          {assignedDevices.map(d => (
                            <span key={d.id} className="device-badge">
                              <span>{d.serial_no}</span>
                              {canEditAttendance && (
                                <button
                                  onClick={() => handleDeallocateDevice(d.serial_no)}
                                  disabled={allocating !== null}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Unlink Device"
                                >
                                  <X className="w-2.5 h-2.5 hover:text-red-500" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ResponsiveModal
        open={isAdding}
        onOpenChange={(open) => { if (!open) closeAdd(); }}
        title=""
        description=""
        hideHeader
        contentStyle={{ padding: 0 }}
      >
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }} className="overflow-hidden">
          <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Add Project</h2>
                <p className="text-xs text-gray-400">Register a new project site</p>
              </div>
            </div>
            <button onClick={closeAdd} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-4 space-y-3">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Project Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.project_code}
                onChange={(e) => setForm(f => ({ ...f, project_code: e.target.value }))}
                placeholder="e.g. VALE-01, MED#198"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.project_name}
                onChange={(e) => setForm(f => ({ ...f, project_name: e.target.value }))}
                placeholder="e.g. Vale Jetty Port Site"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Project Location
              </label>
              <input
                type="text"
                value={form.project_location}
                onChange={(e) => setForm(f => ({ ...f, project_location: e.target.value }))}
                placeholder="e.g. Sohar Industrial Port, Oman"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
              <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Geofence Settings</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error("Geolocation is not supported by this browser.");
                      return;
                    }
                    toast.loading("Fetching coordinates...", { id: "gps-fetch" });
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setForm(f => ({
                          ...f,
                          geofence_lat: pos.coords.latitude.toFixed(6),
                          geofence_lng: pos.coords.longitude.toFixed(6)
                        }));
                        toast.success("Coordinates filled!", { id: "gps-fetch" });
                      },
                      (err) => {
                        toast.error(`GPS Error: ${err.message}`, { id: "gps-fetch" });
                      },
                      { enableHighAccuracy: true }
                    );
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-gray-200 shadow-sm transition-all"
                >
                  <Compass className="w-3 h-3 text-indigo-500" />
                  Get Current Location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Latitude <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.geofence_lat}
                    onChange={(e) => setForm(f => ({ ...f, geofence_lat: e.target.value }))}
                    placeholder="e.g. 23.614328"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Longitude <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.geofence_lng}
                    onChange={(e) => setForm(f => ({ ...f, geofence_lng: e.target.value }))}
                    placeholder="e.g. 58.545284"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">
                  Radius (meters) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.geofence_radius}
                  onChange={(e) => setForm(f => ({ ...f, geofence_radius: e.target.value }))}
                  placeholder="e.g. 100"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
                />
              </div>
              {showMapPreview && (
                <div style={{ height: '180px', width: '100%', position: 'relative', marginTop: '12px' }} className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <iframe
                    src={`https://maps.google.com/maps?q=${previewLat},${previewLng}&z=16&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Geofence Preview Map"
                  />
                  <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-semibold text-gray-600 border border-gray-100 shadow-xs pointer-events-none">
                    Radius: {form.geofence_radius || '100'}m
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Shift In Time
                </label>
                <input
                  type="time"
                  value={form.project_in_time}
                  onChange={(e) => setForm(f => ({ ...f, project_in_time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Shift Out Time
                </label>
                <input
                  type="time"
                  value={form.project_out_time}
                  onChange={(e) => setForm(f => ({ ...f, project_out_time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button
              style={{ flex: 1 }}
              onClick={closeAdd}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              style={{ flex: 1 }}
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Adding…' : 'Add Project'}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        open={!!editingProject}
        onOpenChange={(open) => { if (!open) closeEdit(); }}
        title=""
        description=""
        hideHeader
        contentStyle={{ padding: 0 }}
      >
        {editingProject && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }} className="overflow-hidden">
            <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Edit Project</h2>
                  <p className="text-xs text-gray-400 font-mono">{editingProject.project_code}</p>
                </div>
              </div>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Project Code (Read-Only)
                </label>
                <input
                  type="text"
                  value={form.project_code}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.project_name}
                  onChange={(e) => setForm(f => ({ ...f, project_name: e.target.value }))}
                  placeholder="e.g. Vale Jetty Port Site"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Project Location
                </label>
                <input
                  type="text"
                  value={form.project_location}
                  onChange={(e) => setForm(f => ({ ...f, project_location: e.target.value }))}
                  placeholder="e.g. Sohar Industrial Port, Oman"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Shift In Time
                  </label>
                  <input
                    type="time"
                    value={form.project_in_time}
                    onChange={(e) => setForm(f => ({ ...f, project_in_time: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Shift Out Time
                  </label>
                  <input
                    type="time"
                    value={form.project_out_time}
                    onChange={(e) => setForm(f => ({ ...f, project_out_time: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button
                style={{ flex: 1 }}
                onClick={closeEdit}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                style={{ flex: 1 }}
                onClick={handleEdit}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Focal Point Assignment Dialog */}
      <ResponsiveModal
        open={!!focalPointProject}
        onOpenChange={(open) => { if (!open) closeFocalPointModal(); }}
        title=""
        description=""
        hideHeader
        contentStyle={{ padding: 0 }}
      >
        {focalPointProject && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }} className="overflow-hidden">
            <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Assign Focal Point</h2>
                  <p className="text-xs text-gray-400 font-mono">{focalPointProject.project_name} ({focalPointProject.project_code})</p>
                </div>
              </div>
              <button onClick={closeFocalPointModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="relative employee-dropdown-container">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Select Employee
                </label>
                <button
                  type="button"
                  onClick={() => setOpenEmpSelect(!openEmpSelect)}
                  className="h-10 text-sm w-full bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between shadow-xs hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="truncate text-gray-700 capitalize">
                    {selectedEmp ? selectedEmp.name.toLowerCase() : "Select Employee (Autofills below)"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                </button>

                {openEmpSelect && (
                  <div className="absolute left-0 right-0 mt-1 p-0 bg-white border border-gray-200 shadow-md rounded-md z-[100]">
                    {/* Search Input Area */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search name or ID..."
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          className="text-xs bg-transparent border-0 outline-none w-full p-0 focus:ring-0 placeholder:text-gray-400 normal-case"
                          autoFocus
                        />
                        {empSearch && (
                          <button
                            type="button"
                            onClick={() => setEmpSearch("")}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List Area */}
                    <div className="max-h-[220px] overflow-y-auto py-1">
                      {selectableEmployees.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-gray-400 font-medium">
                          No results found
                        </div>
                      ) : (
                        <>
                          <button
                            style={{ justifyContent: "space-between" }}
                            type="button"
                            onClick={() => {
                              setFocalForm({
                                focal_point_id: '',
                                focal_point_name: '',
                                focal_point_email: ''
                              });
                              setOpenEmpSelect(false);
                              setEmpSearch("");
                            }}
                            className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 bg-transparent text-red-600 font-semibold"
                          >
                            -- Clear Selection --
                          </button>
                          {selectableEmployees.map((emp) => {
                            const isSelected = selectedEmp?.device_user_id === emp.device_user_id || selectedEmp?.emp_id === emp.emp_id;
                            const empVal = emp.emp_id || emp.device_user_id || String(emp.id);
                            return (
                              <button
                                style={{ justifyContent: "space-between" }}
                                key={emp.id}
                                type="button"
                                onClick={() => {
                                  setFocalForm({
                                    focal_point_id: empVal,
                                    focal_point_name: emp.name || '',
                                    focal_point_email: emp.email || ''
                                  });
                                  setOpenEmpSelect(false);
                                  setEmpSearch("");
                                }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between capitalize font-medium ${isSelected
                                  ? "bg-indigo-50 text-indigo-900"
                                  : "hover:bg-gray-50 bg-transparent"
                                  }`}
                              >
                                <div className="truncate">
                                  <div>{emp.name.toLowerCase()}</div>
                                  {emp.emp_id && (
                                    <div className="text-[10px] text-gray-400 font-normal normal-case">
                                      ID: {emp.emp_id}
                                    </div>
                                  )}
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

              <div className="border-t border-gray-100 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-650 mb-1.5">
                      Focal Point Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={focalForm.focal_point_name}
                      onChange={(e) => setFocalForm(f => ({ ...f, focal_point_name: e.target.value }))}
                      placeholder="No Employee Selected"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-650 mb-1.5">
                      Focal Point Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={focalForm.focal_point_email}
                      onChange={(e) => setFocalForm(f => ({ ...f, focal_point_email: e.target.value }))}
                      placeholder="No Employee Selected"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-650 mb-1.5">
                    Focal Point ID / Employee ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={focalForm.focal_point_id}
                    onChange={(e) => setFocalForm(f => ({ ...f, focal_point_id: e.target.value }))}
                    placeholder="No Employee Selected"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button
                style={{ flex: 1 }}
                onClick={closeFocalPointModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                style={{ flex: 1 }}
                onClick={handleSaveFocalPoint}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : 'Save Focal Point'}
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Geofence Settings Dialog */}
      <ResponsiveModal
        open={isEditingGeofence}
        onOpenChange={(open) => { if (!open) closeGeofenceModal(); }}
        title=""
        description=""
        hideHeader
        contentStyle={{ padding: 0 }}
      >
        {geofenceProject && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }} className="overflow-hidden">
            <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Geofence Settings</h2>
                  <p className="text-xs text-gray-400 font-mono">{geofenceProject.project_name} ({geofenceProject.project_code})</p>
                </div>
              </div>
              <button onClick={closeGeofenceModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Geofence Settings</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        toast.error("Geolocation is not supported by this browser.");
                        return;
                      }
                      toast.loading("Fetching coordinates...", { id: "gps-fetch" });
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setForm(f => ({
                            ...f,
                            geofence_lat: pos.coords.latitude.toFixed(6),
                            geofence_lng: pos.coords.longitude.toFixed(6)
                          }));
                          toast.success("Coordinates filled!", { id: "gps-fetch" });
                        },
                        (err) => {
                          toast.error(`GPS Error: ${err.message}`, { id: "gps-fetch" });
                        },
                        { enableHighAccuracy: true }
                      );
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-gray-200 shadow-sm transition-all"
                  >
                    <Compass className="w-3 h-3 text-indigo-500" />
                    Get Current Location
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">
                      Latitude <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.geofence_lat}
                      onChange={(e) => setForm(f => ({ ...f, geofence_lat: e.target.value }))}
                      placeholder="e.g. 23.614328"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">
                      Longitude <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.geofence_lng}
                      onChange={(e) => setForm(f => ({ ...f, geofence_lng: e.target.value }))}
                      placeholder="e.g. 58.545284"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    Radius (meters) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.geofence_radius}
                    onChange={(e) => setForm(f => ({ ...f, geofence_radius: e.target.value }))}
                    placeholder="e.g. 100"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white"
                  />
                </div>
                {showMapPreview && (
                  <div style={{ height: '180px', width: '100%', position: 'relative', marginTop: '12px' }} className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    <iframe
                      src={`https://maps.google.com/maps?q=${previewLat},${previewLng}&z=16&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      title="Geofence Preview Map"
                    />
                    <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-semibold text-gray-600 border border-gray-100 shadow-xs pointer-events-none">
                      Radius: {form.geofence_radius || '100'}m
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button
                style={{ flex: 1 }}
                onClick={closeGeofenceModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                style={{ flex: 1 }}
                onClick={handleSaveGeofence}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* Delete Confirmation Dialog */}
      {deletingProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingProject(null); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Delete Project?</h3>
              <p className="text-xs text-gray-400 mt-1">
                Are you sure you want to delete project <strong>{deletingProject.project_name}</strong> ({deletingProject.project_code})?
              </p>
              <p className="text-xs text-red-500 font-medium mt-2">
                Note: All allocated devices will be unallocated. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingProject(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
