import { useAuth } from '@/components/AuthProvider';
import { Laptop2, Loader2, MapPin, Monitor, Pencil, Plus, RotateCw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Device {
  id: number;
  serial_no: string;
  location: string | null;
  item_code: string | null;
  last_stamp: number | null;
  last_seen: string | null;
  start_time: string | null;
  end_time: string | null;
  project_code: string | null;
}

interface EditForm {
  serial_no: string;
  location: string;
  item_code: string;
  start_time: string;
  end_time: string;
  project_code: string;
}


function formatLastSeen(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString('en-OM', { day: 'numeric', month: 'short', timeZone: 'Asia/Muscat' });
}



export default function DevicesMaster() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [projects, setProjects] = useState<Array<{ project_code: string; project_name: string }>>([]);
  const [lastPunchMap, setLastPunchMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form, setForm] = useState<EditForm>({ serial_no: '', location: '', item_code: '', start_time: '', end_time: '', project_code: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add Device state
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<EditForm>({ serial_no: '', location: '', item_code: '', start_time: '', end_time: '', project_code: '' });
  const [addError, setAddError] = useState<string | null>(null);

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


  // async function handleImportDeviceData() {
  //   if (devices.length === 0) {
  //     toast.error('No devices registered.');
  //     return;
  //   }
  //   setImporting(true);
  //   try {
  //     const commandsToInsert = devices.flatMap(device => [
  //       {
  //         device_serial: device.serial_no,
  //         command: 'DATA QUERY USERINFO',
  //         command_type: 'QUERY_USERINFO',
  //         status: 'pending',
  //         employee_id: null
  //       },
  //       {
  //         device_serial: device.serial_no,
  //         command: 'DATA QUERY FINGERTMP',
  //         command_type: 'QUERY_FINGERTMP',
  //         status: 'pending',
  //         employee_id: null
  //       },
  //       {
  //         device_serial: device.serial_no,
  //         command: 'DATA QUERY BIODATA\tType=9',
  //         command_type: 'QUERY_BIODATA',
  //         status: 'pending',
  //         employee_id: null
  //       },
  //       {
  //         device_serial: device.serial_no,
  //         command: 'DATA QUERY FACE',
  //         command_type: 'QUERY_FACE',
  //         status: 'pending',
  //         employee_id: null
  //       }
  //     ]);

  //     const { error: err } = await supabase
  //       .from('device_commands')
  //       .insert(commandsToInsert);

  //     if (err) throw err;

  //     toast.success(`Queued user and biometric templates queries for ${devices.length} device(s).`);
  //   } catch (err: any) {
  //     toast.error(err.message || 'Failed to queue import commands.');
  //   } finally {
  //     setImporting(false);
  //   }
  // }

  function openAdd() {
    setIsAdding(true);
    setAddForm({ serial_no: '', location: '', item_code: '', start_time: '', end_time: '', project_code: '' });
    setAddError(null);
  }

  // ...
  function closeAdd() {
    setIsAdding(false);
    setAddError(null);
  }

  async function handleAdd() {
    if (!addForm.serial_no.trim()) {
      setAddError('Serial number is required.');
      return;
    }

    setSaving(true);
    setAddError(null);

    const { error: err } = await supabase
      .from('devices')
      .insert({
        serial_no: addForm.serial_no.trim(),
        location: addForm.location.trim() || null,
        item_code: addForm.item_code.trim() || null,
        start_time: addForm.start_time.trim() || null,
        end_time: addForm.end_time.trim() || null,
        project_code: addForm.project_code || null,
      });

    setSaving(false);

    if (err) {
      setAddError(err.message);
      return;
    }

    closeAdd();
    fetchDevices();
  }

  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const { data: devicesData, error: devicesErr } = await supabase
        .from('devices')
        .select('*')
        .order('id', { ascending: true });
      if (devicesErr) throw devicesErr;

      // Fetch projects list
      const { data: projectsData, error: projectsErr } = await supabase
        .from('projects')
        .select('project_code, project_name')
        .order('project_code', { ascending: true });
      if (projectsErr) throw projectsErr;
      setProjects(projectsData || []);

      const { data: punchesData, error: punchesErr } = await supabase
        .from('punches')
        .select('device_serial, punch_time')
        .order('punch_time', { ascending: false })
        .limit(1000);
      if (punchesErr) throw punchesErr;

      const map: Record<string, string> = {};
      if (punchesData) {
        punchesData.forEach((p) => {
          if (p.device_serial && !map[p.device_serial]) {
            map[p.device_serial] = p.punch_time;
          }
        });
      }

      setLastPunchMap(map);
      setDevices(devicesData ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices(false);

    // Refresh every 30s silently to update last_seen status in the background
    const interval = setInterval(() => {
      fetchDevices(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  function openEdit(device: Device) {
    setEditingDevice(device);
    setForm({
      serial_no: device.serial_no,
      location: device.location ?? '',
      item_code: device.item_code ?? '',
      start_time: device.start_time ?? '',
      end_time: device.end_time ?? '',
      project_code: device.project_code ?? '',
    });
    setEditError(null);
  }

  function closeEdit() {
    setEditingDevice(null);
    setEditError(null);
  }

  async function handleSave() {
    if (!editingDevice) return;
    if (!form.serial_no.trim()) {
      setEditError('Serial number is required.');
      return;
    }

    setSaving(true);
    setEditError(null);

    const { error: err } = await supabase
      .from('devices')
      .update({
        serial_no: form.serial_no.trim(),
        location: form.location.trim() || null,
        item_code: form.item_code.trim() || null,
        start_time: form.start_time.trim() || null,
        end_time: form.end_time.trim() || null,
        project_code: form.project_code || null,
      })
      .eq('id', editingDevice.id);

    setSaving(false);

    if (err) {
      setEditError(err.message);
      return;
    }

    closeEdit();
    fetchDevices();
  }

  return (
    <div className="min-h-screen bg-white" style={{ width: "100%" }}>
      <div className="w-full px-4 sm:px-6 py-8">

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4" style={{ justifyContent: "space-between", padding: "0 1.25rem" }}>
          <div className="flex items-center gap-2">
            <h2>All Devices</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
              {devices.length} registered device(s)
            </span>

          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>

            {/* <button
              onClick={handleImportDeviceData}
              disabled={importing || devices.length === 0}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Import user and biometric templates from all registered devices"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Import Device Data
                </>
              )}
            </button> */}

            {canEditAttendance && (
              <button
                onClick={openAdd}
                className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Device
              </button>
            )}

            <button
              onClick={() => fetchDevices(true)}
              disabled={loading || refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              title="Refresh Status"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="border border-gray-100 rounded-2xl overflow-auto shadow-sm flex flex-col bg-white" style={{ height: "70vh" }}>
          {loading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : devices.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No devices found.
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-50 z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ width: 50 }}>#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Device</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Item Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Ping</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Last Log</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Start Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">End Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide" style={{ display: 'flex', justifyContent: "center" }}>Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {devices.map((device, idx) => {
                  const online = device.last_seen
                    ? (new Date().getTime() - new Date(device.last_seen).getTime()) < 90000
                    : false;

                  return (
                    <tr key={device.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 text-center text-xs text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3" >
                        <div className="flex gap-2.5" style={{ border: "", justifyContent: "flex-start" }}>
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Laptop2 className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 font-mono text-xs">
                              {device.serial_no}
                            </div>
                            <div className="text-xs text-gray-400">
                              Stamp: {device.last_stamp ?? 0}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {device.location ? (
                          <div className="flex gap-1.5 text-gray-700" style={{ justifyContent: "flex-start" }}>
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {device.location}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {device.item_code ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {device.project_code ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[14px] bg-gray-50 text-gray-700 font-mono uppercase">
                            {device.project_code}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">Unallocated</span>
                        )}
                      </td>
                      <td style={{ gap: "0.025rem", justifyContent: "flex-start" }} className="flex px-4 py-3 text-gray-500 text-xs">
                        {/* {
                          online &&
                          <>
                            <Dot style={{ opacity: 0.4 }} className='animate-ping relative z-10' />
                            <Dot style={{ opacity: 0.6 }} className='absolute' />
                          </>

                        } */}

                        {formatLastSeen(device.last_seen)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatLastSeen(lastPunchMap[device.serial_no] || null)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {device.start_time ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {device.end_time ?? '—'}
                      </td>
                      <td className="px-4 py-4" style={{ border: '', display: "flex", justifyContent: "center" }}>
                        {online ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEditAttendance && (
                            <button
                              onClick={() => openEdit(device)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>


      </div>

      {/* Edit Modal */}
      {editingDevice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">

            {/* Modal header */}
            <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Edit Device</h2>
                  <p className="text-xs text-gray-400 font-mono">{editingDevice.serial_no}</p>
                </div>
              </div>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Serial Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.serial_no}
                  onChange={(e) => setForm(f => ({ ...f, serial_no: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Main Entrance, Office Floor 2"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Item Code
                </label>
                <input
                  type="text"
                  value={form.item_code}
                  onChange={(e) => setForm(f => ({ ...f, item_code: e.target.value }))}
                  placeholder="e.g. ZK-001"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Allocate to Project
                </label>
                <select
                  value={form.project_code}
                  onChange={(e) => setForm(f => ({ ...f, project_code: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-white"
                >
                  <option value="">-- Unallocated / None --</option>
                  {projects.map(p => (
                    <option key={p.project_code} value={p.project_code}>
                      {p.project_code} - {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    End Time
                  </label>
                  <input type="time"
                    value={form.end_time}
                    onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
                </div>
              </div>
            </div>

            {/* Modal footer */}
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
                onClick={handleSave}
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
      {/* Add Modal */}
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeAdd(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">

            {/* Modal header */}
            <div style={{ justifyContent: "space-between" }} className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Add Device</h2>
                  <p className="text-xs text-gray-400">Register a new device in the system</p>
                </div>
              </div>
              <button onClick={closeAdd} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {addError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Serial Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.serial_no}
                  onChange={(e) => setAddForm(f => ({ ...f, serial_no: e.target.value }))}
                  placeholder="e.g. ZK-123456"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={addForm.location}
                  onChange={(e) => setAddForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Main Entrance, Office Floor 2"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Item Code
                </label>
                <input
                  type="text"
                  value={addForm.item_code}
                  onChange={(e) => setAddForm(f => ({ ...f, item_code: e.target.value }))}
                  placeholder="e.g. ZK-001"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Allocate to Project
                </label>
                <select
                  value={addForm.project_code}
                  onChange={(e) => setAddForm(f => ({ ...f, project_code: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-white"
                >
                  <option value="">-- Unallocated / None --</option>
                  {projects.map(p => (
                    <option key={p.project_code} value={p.project_code}>
                      {p.project_code} - {p.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={addForm.start_time}
                    onChange={(e) => setAddForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={addForm.end_time}
                    onChange={(e) => setAddForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
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
                {saving ? 'Saving…' : 'Add Device'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
