import { useAuth } from '@/components/AuthProvider';
import CustomDropDown from '@/components/custom-dropdown';
import {
  FolderKanban,
  Laptop2,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Project {
  id: number;
  project_code: string;
  project_name: string;
  project_location: string | null;
  project_in_time: string | null;
  project_out_time: string | null;
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
}

const defaultForm: ProjectForm = {
  project_code: '',
  project_name: '',
  project_location: '',
  project_in_time: '08:00',
  project_out_time: '17:00'
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

export default function ProjectsMaster() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
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

      setProjects(projData || []);
      setDevices(devData || []);
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
          project_location: form.project_location.trim() || null,
          project_in_time: inTimeISO,
          project_out_time: outTimeISO
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
    setForm({
      project_code: project.project_code,
      project_name: project.project_name,
      project_location: project.project_location ?? '',
      project_in_time: formatISOToTime(project.project_in_time) || '08:00',
      project_out_time: formatISOToTime(project.project_out_time) || '17:00'
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

    setSaving(true);
    setFormError(null);

    try {
      const inTimeISO = toISOString(form.project_in_time);
      const outTimeISO = toISOString(form.project_out_time);

      const { error: err } = await supabase
        .from('projects')
        .update({
          project_name: form.project_name.trim(),
          project_location: form.project_location.trim() || null,
          project_in_time: inTimeISO,
          project_out_time: outTimeISO
        })
        .eq('project_code', editingProject.project_code);

      if (err) throw err;

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
    <div className="min-h-screen bg-white" style={{ width: "100%", height: "100%", overflowY: "auto" }}>
      <style>{`
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
      <div className="w-full px-4 sm:px-6 py-8">

        {/* Header Toolbar */}
        <div className="flex justify-between items-center mb-6" style={{ justifyContent: "space-between", padding: "0 1.25rem" }}>
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
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
            No projects registered. Click "Add Project" to register one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const assignedDevices = devicesByProject[project.project_code] || [];
              const isAllocatingThis = allocatingProjectId === project.project_code;

              return (
                <div key={project.id} className="project-card">
                  {/* Top Part: Info & Actions */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '10px',

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
                    <div className="meta-item">

                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={project.project_location || "No location set"}>
                        {project.project_location || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 300 }}>No location set</span>}
                      </span>
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
        )}
      </div>

      {/* Add Project Modal */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeAdd(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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

            <div className="px-6 py-5 space-y-4">
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

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
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
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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

            <div className="px-6 py-5 space-y-4">
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

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
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
        </div>
      )}

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
