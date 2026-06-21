import { Laptop2, Loader2, MapPin, Monitor, Pencil, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Device {
  id: number;
  serial_no: string;
  location: string | null;
  item_code: string | null;
  last_stamp: number | null;
  last_seen: string | null;
  start_time: string | null; // Added for timing range
  end_time: string | null;   // Added for timing range
}

interface EditForm {
  serial_no: string;
  location: string;
  item_code: string;
  start_time: string; // Added for timing range
  end_time: string;   // Added for timing range
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form, setForm] = useState<EditForm>({ serial_no: '', location: '', item_code: '', start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add Device state
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<EditForm>({ serial_no: '', location: '', item_code: '', start_time: '', end_time: '' });
  const [addError, setAddError] = useState<string | null>(null);

  function openAdd() {
    setIsAdding(true);
    setAddForm({ serial_no: '', location: '', item_code: '', start_time: '', end_time: '' });
    setAddError(null);
  }

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
      });

    setSaving(false);

    if (err) {
      setAddError(err.message);
      return;
    }

    closeAdd();
    fetchDevices();
  }

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('devices') // Assuming 'timing' column exists in 'devices' table
      .select('*')
      .order('id', { ascending: true });
    if (err) setError(err.message);
    else setDevices(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDevices();

    // Refresh every 30s to update last_seen status
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  function openEdit(device: Device) {
    setEditingDevice(device);
    setForm({
      serial_no: device.serial_no,
      location: device.location ?? '',
      item_code: device.item_code ?? '',
      start_time: device.start_time ?? '', // Populate start_time field
      end_time: device.end_time ?? '',     // Populate end_time field
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
        start_time: form.start_time.trim() || null, // Update start_time field
        end_time: form.end_time.trim() || null,     // Update end_time field
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8" style={{ width: "100%" }}>

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            {devices.length} registered device(s)
          </span>
          <button
            onClick={openAdd}
            className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Device
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No devices found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Device</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Item Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Last Log</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Start Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">End Time</th>
                  {/* <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th> */}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {devices.map((device) => {

                  return (
                    <tr key={device.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
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
                          <div className="flex items-center gap-1.5 text-gray-700">
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
                        {formatLastSeen(device.last_seen)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {device.start_time ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {device.end_time ?? '—'}
                      </td>
                      {/* <td className="px-4 py-3">
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
                      </td> */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(device)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Status refreshes every 30 seconds · Online = seen within last 60 seconds
        </p>
      </div>

      {/* Edit Modal */}
      {editingDevice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
                onClick={closeEdit}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
                onClick={closeAdd}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
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
