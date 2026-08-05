const SUPABASE_URL = 'https://layonfapjyiupkjdswbj.supabase.co/';
const SUPABASE_SERVICE_KEY = 'sb_secret_79rVcwFLYzk18UrQXJwjig_HLSuhhYY';

// Cache for last seen updates to throttle requests (at most once every 60 seconds)
const lastSeenCache = new Map();

// Helper to update last_seen timestamp in the devices table with throttling
function performDeviceHeartbeat(sn, ctx) {
    if (!sn || sn === 'UNKNOWN') return;

    const now = Date.now();
    const lastUpdated = lastSeenCache.get(sn) || 0;

    // Only update Supabase if the last update was more than 60 seconds ago
    if (now - lastUpdated < 60000) {
        return;
    }

    // Update cache immediately to prevent concurrent requests from triggering writes
    lastSeenCache.set(sn, now);

    const promise = (async () => {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/devices?serial_no=eq.${encodeURIComponent(sn)}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    last_seen: new Date().toISOString()
                })
            });
            if (!response.ok) {
                console.error('Supabase heartbeat PATCH failed:', await response.text());
                // Clear cache entry on failure so we can retry on next request
                lastSeenCache.delete(sn);
            }
        } catch (err) {
            console.error('Failed to update device heartbeat:', err);
            // Clear cache entry on failure so we can retry
            lastSeenCache.delete(sn);
        }
    })();

    if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(promise);
    }
}


async function insertPunches(punches) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/punches`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(punches)
    });
    return response;
}

// Helper to parse tab-separated parameter strings (e.g. PIN=123\tName=John)
function parseTabParams(line) {
    const params = {};
    const parts = line.split('\t');
    for (const part of parts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx !== -1) {
            const key = part.slice(0, eqIdx).trim();
            const val = part.slice(eqIdx + 1).trim();
            params[key] = val;
        }
    }
    return params;
}

// Helper to parse query parameter strings that could be tab or ampersand separated
function parseParameters(str) {
    const params = {};
    let parts = str.split('\t');
    if (parts.length <= 1) {
        parts = str.split('&');
    }
    for (const part of parts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx !== -1) {
            const key = part.slice(0, eqIdx).trim();
            const val = part.slice(eqIdx + 1).trim();
            params[key] = val;
        }
    }
    return params;
}

// Helper to patch multiple commands status
async function patchCommands(ids, updates) {
    if (!ids || ids.length === 0) return false;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=in.(${ids.join(',')})`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updates)
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to patch commands:', err);
        return false;
    }
}

// Helper to patch single command status
async function updateSingleCommand(id, updates) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updates)
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to update single command:', err);
        return false;
    }
}

// Helper to retrieve other device serial numbers
async function getOtherDevices(sn) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/devices?serial_no=neq.${encodeURIComponent(sn)}&select=serial_no`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (res.ok) {
            const devices = await res.json();
            return devices.map(d => d.serial_no);
        }
    } catch (err) {
        console.error('Error fetching other devices:', err);
    }
    return [];
}

// Helper to retrieve command by ID
async function getCommandById(id) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${id}&select=command,command_type`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (res.ok) {
            const cmds = await res.json();
            if (cmds && cmds.length > 0) return cmds[0];
        }
    } catch (err) {
        console.error('Error fetching command by ID:', err);
    }
    return null;
}

// Helper to insert commands
async function insertDeviceCommands(commands) {
    if (!commands || commands.length === 0) return;
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/device_commands`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(commands)
        });
        if (!res.ok) {
            console.error('Failed to insert commands:', await res.text());
        }
    } catch (err) {
        console.error('Error inserting commands:', err);
    }
}

// Helper to search employee ID by device user ID
async function findEmployeeId(pin) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?device_user_id=eq.${encodeURIComponent(pin)}&select=id`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (res.ok) {
            const emps = await res.json();
            if (emps && emps.length > 0) return emps[0].id;
        }
    } catch (err) {
        console.error('Error finding employee id:', err);
    }
    return null;
}

// Helper to upsert employee details
async function upsertEmployee(pin, name) {
    try {
        const getRes = await fetch(`${SUPABASE_URL}/rest/v1/employees?device_user_id=eq.${encodeURIComponent(pin)}&select=id,name`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (getRes.ok) {
            const emps = await getRes.json();
            if (emps && emps.length > 0) {
                const emp = emps[0];
                if (emp.name !== name) {
                    await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${emp.id}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name })
                    });
                }
                return emp.id;
            } else {
                const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        device_user_id: pin,
                        name: name,
                        emp_type: 'staff'
                    })
                });
                if (insertRes.ok) {
                    const data = await insertRes.json();
                    if (data && data.length > 0) return data[0].id;
                }
            }
        }
    } catch (err) {
        console.error('Error upserting employee:', err);
    }
    return null;
}

// Async logic to process and propagate USERINFO to other devices
async function handleUserInfoUpload(body, sn) {
    const lines = body.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    // 1. Extract all pin/name pairs
    const pinToNameMap = [];
    for (const line of lines) {
        const params = parseTabParams(line);
        const pin = params.PIN || params.Pin || params.pin;
        const name = params.Name || params.name;
        if (pin && name) {
            pinToNameMap.push({ pin, name, params });
        }
    }

    if (pinToNameMap.length === 0) return;

    const uniquePins = Array.from(new Set(pinToNameMap.map(item => item.pin)));

    // 2. Fetch existing employees matching these pins in one query
    const employeesMap = new Map();
    try {
        const queryPins = uniquePins.map(p => encodeURIComponent(p)).join(',');
        const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?device_user_id=in.(${queryPins})&select=id,device_user_id,name`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (res.ok) {
            const emps = await res.json();
            for (const emp of emps) {
                employeesMap.set(emp.device_user_id, {
                    id: emp.id,
                    name: emp.name
                });
            }
        } else {
            console.error('Failed to fetch employees for userinfo upload:', await res.text());
        }
    } catch (err) {
        console.error('Error fetching employees for userinfo upload:', err);
    }

    // 3. Process each employee
    for (const { pin, name, params } of pinToNameMap) {
        let employeeDbId = null;
        const existing = employeesMap.get(pin);

        if (existing) {
            employeeDbId = existing.id;
            // If name changed, update it in Supabase
            if (existing.name !== name) {
                try {
                    await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${employeeDbId}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name })
                    });
                    console.log(`Updated name for employee ${pin} to ${name}`);
                } catch (err) {
                    console.error(`Error updating name for employee ID ${employeeDbId}:`, err);
                }
            }
        } else {
            // Create new employee
            try {
                const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        device_user_id: pin,
                        name: name,
                        emp_type: 'staff'
                    })
                });
                if (insertRes.ok) {
                    const data = await insertRes.json();
                    if (data && data.length > 0) {
                        employeeDbId = data[0].id;
                        console.log(`Created employee for PIN ${pin}: ${name} with ID ${employeeDbId}`);
                        // Add to map in case there are duplicates in the payload
                        employeesMap.set(pin, { id: employeeDbId, name });
                    }
                } else {
                    console.error(`Failed to insert employee ${pin}:`, await insertRes.text());
                }
            } catch (err) {
                console.error(`Error creating employee for PIN ${pin}:`, err);
            }
        }
    }
}

// Helper to get employee's existing biometrics JSON data
async function getEmployeeBiometrics(id) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${id}&select=fingerprint_templates,face_templates`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) return data[0];
        }
    } catch (err) {
        console.error('Error fetching employee biometrics:', err);
    }
    return null;
}

// Helper to patch employee's biometrics JSON data
async function updateEmployeeBiometrics(id, updates, sn) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Failed to update employee biometrics:', res.status, errorText);
            if (sn) await logToCommand(sn, `Failed to update employee biometrics: Status=${res.status}, Error=${errorText}`);
        } else {
            if (sn) await logToCommand(sn, `Successfully patched employee biometrics in Supabase!`);
        }
    } catch (err) {
        console.error('Error updating employee biometrics:', err);
        if (sn) await logToCommand(sn, `Exception in updateEmployeeBiometrics: ${err.message}`);
    }
}

// Telemetry helper to write logs to the active command row in Supabase
async function logToCommand(sn, text) {
    try {
        const resCmds = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?device_serial=eq.${encodeURIComponent(sn)}&order=id.desc&limit=1`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (resCmds.ok) {
            const cmds = await resCmds.json();
            if (cmds && cmds.length > 0) {
                await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${cmds[0].id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        command: `${cmds[0].command}\nWORKER_LOG: ${text}`
                    })
                });
            }
        }
    } catch (err) {
        // Ignore logging errors
    }
}

// Async logic to process and propagate TEMPLATE (fingerprint) to other devices
async function handleTemplateUpload(body, sn) {
    await logToCommand(sn, `Starting handleTemplateUpload with sn ${sn}, body len ${body.length}`);
    console.log(`Received TEMPLATE/FINGERTMP upload from SN ${sn}. Length: ${body.length}`);
    const lines = body.split('\n').filter(l => l.trim());
    if (lines.length === 0) {
        await logToCommand(sn, `Lines length is 0, returning.`);
        return;
    }

    // 1. Extract all unique PINs
    const pinToLineMap = [];
    for (const line of lines) {
        const params = parseTabParams(line);
        let pin = params.PIN || params.Pin || params.pin;
        let tmp = params.TMP || params.Tmp || params.tmp;
        let fid = params.FID || params.Fid || params.fid || '0';
        let size = params.Size || params.size || (tmp ? tmp.length : 0);
        let valid = params.Valid || params.valid || 1;

        // Fallback to positional parsing if PIN or TMP is not found
        if (!pin || !tmp) {
            const parts = line.split('\t');
            let startIndex = 0;
            if (parts[0] && (parts[0].trim() === 'TEMPLATE' || parts[0].trim() === 'FINGERTMP')) {
                startIndex = 1;
            }
            if (parts.length - startIndex >= 5) {
                pin = parts[startIndex].trim();
                fid = parts[startIndex + 1].trim();
                size = parseInt(parts[startIndex + 2].trim()) || parts[startIndex + 4].trim().length;
                valid = parseInt(parts[startIndex + 3].trim()) || 1;
                tmp = parts[startIndex + 4].trim();
            } else if (parts.length - startIndex >= 2) {
                const maybePin = parts[startIndex].trim();
                const maybeTmp = parts[parts.length - 1].trim();
                if (/^\d+$/.test(maybePin) && maybeTmp.length > 50) {
                    pin = maybePin;
                    tmp = maybeTmp;
                    fid = parts[startIndex + 1] ? parts[startIndex + 1].trim() : '0';
                    size = maybeTmp.length;
                    valid = 1;
                }
            }
        }

        if (pin && tmp) {
            pinToLineMap.push({ pin, tmp, fid, size, valid, params });
        } else {
            await logToCommand(sn, `Skipped line due to missing PIN or TMP: ${line.slice(0, 100)}`);
        }
    }

    if (pinToLineMap.length === 0) {
        await logToCommand(sn, `pinToLineMap is empty, returning.`);
        return;
    }

    const uniquePins = Array.from(new Set(pinToLineMap.map(item => item.pin)));
    await logToCommand(sn, `Found unique pins: ${uniquePins.join(', ')}`);

    // 2. Fetch all matching employees in a single request
    const employeesMap = new Map();
    try {
        const queryPins = uniquePins.map(p => encodeURIComponent(p)).join(',');
        const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?device_user_id=in.(${queryPins})&select=id,device_user_id,fingerprint_templates`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (res.ok) {
            const emps = await res.json();
            await logToCommand(sn, `Supabase returned ${emps.length} matching employees.`);
            for (const emp of emps) {
                employeesMap.set(emp.device_user_id, {
                    id: emp.id,
                    fingerprint_templates: emp.fingerprint_templates || {},
                    original_templates_str: JSON.stringify(emp.fingerprint_templates || {})
                });
            }
        } else {
            const errorText = await res.text();
            console.error('Failed to fetch employees for template upload:', errorText);
            await logToCommand(sn, `Failed to fetch employees: Status=${res.status}, Error=${errorText}`);
            return;
        }
    } catch (err) {
        console.error('Error fetching employees for template upload:', err);
        await logToCommand(sn, `Exception fetching employees: ${err.message}`);
        return;
    }

    const updatedEmployees = new Map(); // employeeDbId -> new fingerprint_templates

    // 3. Process each line using cached employees
    for (const { pin, tmp, fid, size, valid, params } of pinToLineMap) {
        const empData = employeesMap.get(pin);
        if (!empData) {
            await logToCommand(sn, `Employee PIN ${pin} NOT found in database mapping!`);
            continue;
        }

        const employeeDbId = empData.id;

        // Get currently accumulated/updated templates for this employee
        const accumulated = updatedEmployees.get(employeeDbId) || { ...empData.fingerprint_templates };

        accumulated[fid] = {
            template: tmp,
            size: parseInt(size) || 0,
            valid: parseInt(valid) || 1
        };

        updatedEmployees.set(employeeDbId, accumulated);
    }

    // 4. Batch patch updated biometrics to Supabase
    for (const [employeeDbId, fingerTemplates] of updatedEmployees.entries()) {
        let originalStr = '';
        for (const empVal of employeesMap.values()) {
            if (empVal.id === employeeDbId) {
                originalStr = empVal.original_templates_str;
                break;
            }
        }
        if (originalStr === JSON.stringify(fingerTemplates)) {
            await logToCommand(sn, `No changes in fingerprint templates for Employee ID ${employeeDbId}. Skipping patch.`);
            continue;
        }

        console.log(`Saving fingerprint template updates for Employee ID ${employeeDbId}`);
        await logToCommand(sn, `Saving template updates to Supabase for Employee ID ${employeeDbId}`);
        await updateEmployeeBiometrics(employeeDbId, { fingerprint_templates: fingerTemplates }, sn);
    }
}

// Async logic to process and propagate BIODATA (newer biometrics/face) to other devices
async function handleBiodataUpload(body, sn) {
    console.log(`Received BIODATA upload from SN ${sn}. Length: ${body.length}`);
    const lines = body.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    // 1. Extract all unique PINs
    const pinToLineMap = [];
    for (const line of lines) {
        const params = parseTabParams(line);
        let pin = params.PIN || params.Pin || params.pin;
        let tmp = params.TMP || params.Tmp || params.tmp || params.Content || params.content;
        let type = params.Type || params.type || '9';
        let no = params.No || params.no || params.FID || params.fid || '0';
        let index = params.Index || params.index || '0';
        let format = params.Format || params.format || '0';
        let majorVer = params.MajorVer || params.majorver || '10';
        let minorVer = params.MinorVer || params.minorver || '0';

        // Fallback to positional parsing if PIN or TMP/Content is not found
        if (!pin || !tmp) {
            const parts = line.split('\t');
            let startIndex = 0;
            if (parts[0] && parts[0].trim() === 'BIODATA') {
                startIndex = 1;
            }
            if (parts.length - startIndex >= 12) {
                pin = parts[startIndex].trim();
                type = parts[startIndex + 1].trim();
                majorVer = parts[startIndex + 2].trim();
                minorVer = parts[startIndex + 3].trim();
                format = parts[startIndex + 4].trim();
                no = parts[startIndex + 6].trim();
                index = parts[startIndex + 7].trim();
                tmp = parts[startIndex + 11].trim();
            } else if (parts.length - startIndex >= 2) {
                const maybePin = parts[startIndex].trim();
                const maybeTmp = parts[parts.length - 1].trim();
                if (/^\d+$/.test(maybePin) && maybeTmp.length > 50) {
                    pin = maybePin;
                    tmp = maybeTmp;
                    type = '9';
                    no = parts[startIndex + 1] ? parts[startIndex + 1].trim() : '0';
                    index = '0';
                    format = '0';
                    majorVer = '10';
                    minorVer = '0';
                }
            }
        }

        if (pin && tmp) {
            pinToLineMap.push({ pin, tmp, type, no, index, format, majorVer, minorVer, params });
        } else {
            console.log(`Skipping biodata line due to missing PIN or TMP/Content. Line: ${line}`);
        }
    }

    if (pinToLineMap.length === 0) return;

    const uniquePins = Array.from(new Set(pinToLineMap.map(item => item.pin)));

    // 2. Fetch existing employees matching these pins in one query
    const employeesMap = new Map();
    try {
        const queryPins = uniquePins.map(p => encodeURIComponent(p)).join(',');
        const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?device_user_id=in.(${queryPins})&select=id,device_user_id,face_templates`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (res.ok) {
            const emps = await res.json();
            for (const emp of emps) {
                employeesMap.set(emp.device_user_id, {
                    id: emp.id,
                    face_templates: emp.face_templates || {},
                    original_templates_str: JSON.stringify(emp.face_templates || {})
                });
            }
        } else {
            console.error('Failed to fetch employees for biodata upload:', await res.text());
            return;
        }
    } catch (err) {
        console.error('Error fetching employees for biodata upload:', err);
        return;
    }

    const updatedEmployees = new Map(); // employeeDbId -> new face_templates

    // 3. Process each line using cached employees
    for (const { pin, tmp, type, no, index, format, majorVer, minorVer } of pinToLineMap) {
        const empData = employeesMap.get(pin);
        if (!empData) {
            console.log(`Employee not found for PIN/Pin: ${pin} in database.`);
            continue;
        }

        const employeeDbId = empData.id;
        const key = `${type}-${no}`;

        // Get currently accumulated/updated templates for this employee
        const accumulated = updatedEmployees.get(employeeDbId) || { ...empData.face_templates };

        accumulated[key] = {
            template: tmp,
            index: parseInt(index) || 0,
            format: parseInt(format) || 0,
            major_ver: parseInt(majorVer) || 10,
            minor_ver: parseInt(minorVer) || 0
        };

        updatedEmployees.set(employeeDbId, accumulated);
    }

    // 4. Batch patch updated biometrics to Supabase
    for (const [employeeDbId, faceTemplates] of updatedEmployees.entries()) {
        let originalStr = '';
        for (const empVal of employeesMap.values()) {
            if (empVal.id === employeeDbId) {
                originalStr = empVal.original_templates_str;
                break;
            }
        }
        if (originalStr === JSON.stringify(faceTemplates)) {
            continue; // no changes, skip patch
        }

        console.log(`Saving face template updates (biodata) for Employee ID ${employeeDbId}`);
        await updateEmployeeBiometrics(employeeDbId, { face_templates: faceTemplates });
    }
}

// Async logic to process and propagate FACE (older biometrics/face) to other devices
async function handleFaceUpload(body, sn) {
    console.log(`Received FACE upload from SN ${sn}. Length: ${body.length}`);
    const lines = body.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    // 1. Extract all unique PINs
    const pinToLineMap = [];
    for (const line of lines) {
        const params = parseTabParams(line);
        let pin = params.PIN || params.Pin || params.pin;
        let tmp = params.TMP || params.Template || params.Tmp || params.tmp;
        let fid = params.FID || params.Fid || params.fid || '0';
        let size = params.Size || params.size || (tmp ? tmp.length : 0);
        let valid = params.Valid || params.valid || params.Active || params.active || 1;

        // Fallback to positional parsing if PIN or TMP is not found
        if (!pin || !tmp) {
            const parts = line.split('\t');
            let startIndex = 0;
            if (parts[0] && parts[0].trim() === 'FACE') {
                startIndex = 1;
            }
            if (parts.length - startIndex >= 5) {
                pin = parts[startIndex].trim();
                fid = parts[startIndex + 1].trim();
                size = parseInt(parts[startIndex + 2].trim()) || parts[startIndex + 4].trim().length;
                valid = parseInt(parts[startIndex + 3].trim()) || 1;
                tmp = parts[startIndex + 4].trim();
            } else if (parts.length - startIndex >= 2) {
                const maybePin = parts[startIndex].trim();
                const maybeTmp = parts[parts.length - 1].trim();
                if (/^\d+$/.test(maybePin) && maybeTmp.length > 50) {
                    pin = maybePin;
                    tmp = maybeTmp;
                    fid = parts[startIndex + 1] ? parts[startIndex + 1].trim() : '0';
                    size = maybeTmp.length;
                    valid = 1;
                }
            }
        }

        if (pin && tmp) {
            pinToLineMap.push({ pin, tmp, fid, size, valid, params });
        } else {
            console.log(`Skipping face line due to missing PIN or TMP/Template. Line: ${line}`);
        }
    }

    if (pinToLineMap.length === 0) return;

    const uniquePins = Array.from(new Set(pinToLineMap.map(item => item.pin)));

    // 2. Fetch all matching employees in a single request
    const employeesMap = new Map();
    try {
        const queryPins = uniquePins.map(p => encodeURIComponent(p)).join(',');
        const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?device_user_id=in.(${queryPins})&select=id,device_user_id,face_templates`, {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        if (res.ok) {
            const emps = await res.json();
            for (const emp of emps) {
                employeesMap.set(emp.device_user_id, {
                    id: emp.id,
                    face_templates: emp.face_templates || {},
                    original_templates_str: JSON.stringify(emp.face_templates || {})
                });
            }
        } else {
            console.error('Failed to fetch employees for face upload:', await res.text());
            return;
        }
    } catch (err) {
        console.error('Error fetching employees for face upload:', err);
        return;
    }

    const updatedEmployees = new Map(); // employeeDbId -> new face_templates

    // 3. Process each line using cached employees
    for (const { pin, tmp, fid, size, valid, params } of pinToLineMap) {
        const empData = employeesMap.get(pin);
        if (!empData) {
            console.log(`Employee not found for PIN/Pin: ${pin} in database.`);
            continue;
        }

        const employeeDbId = empData.id;
        const key = `face-${fid}`;

        // Get currently accumulated/updated templates for this employee
        const accumulated = updatedEmployees.get(employeeDbId) || { ...empData.face_templates };

        accumulated[key] = {
            template: tmp,
            size: parseInt(size) || tmp.length,
            valid: parseInt(valid) || 1
        };

        updatedEmployees.set(employeeDbId, accumulated);
    }

    // 4. Batch patch updated biometrics to Supabase
    for (const [employeeDbId, faceTemplates] of updatedEmployees.entries()) {
        let originalStr = '';
        for (const empVal of employeesMap.values()) {
            if (empVal.id === employeeDbId) {
                originalStr = empVal.original_templates_str;
                break;
            }
        }
        if (originalStr === JSON.stringify(faceTemplates)) {
            continue; // no changes, skip patch
        }

        console.log(`Saving face template updates for Employee ID ${employeeDbId}`);
        await updateEmployeeBiometrics(employeeDbId, { face_templates: faceTemplates });
    }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname.toLowerCase();

        // Retrieve SN case-insensitively using standard, safe get() calls
        const sn = url.searchParams.get('SN') || url.searchParams.get('sn') || 'UNKNOWN';

        // GET /iclock/getrequest — command polling from device
        if (path === '/iclock/getrequest' || path === '/iclock/getrequest.aspx') {
            performDeviceHeartbeat(sn, ctx);

            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?device_serial=eq.${encodeURIComponent(sn)}&status=eq.pending&order=id.asc&limit=1`, {
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                    }
                });
                if (response.ok) {
                    const commands = await response.json();
                    if (commands && commands.length > 0) {
                        const ids = commands.map(c => c.id);
                        await patchCommands(ids, {
                            status: 'sent',
                            sent_at: new Date().toISOString()
                        });

                        const formatted = commands.map(c => {
                            let cmdText = c.command;
                            if (cmdText.startsWith('C:')) {
                                const parts = cmdText.split(':');
                                if (parts.length >= 3) {
                                    parts[1] = c.id.toString();
                                    cmdText = parts.join(':');
                                }
                            } else {
                                cmdText = `C:${c.id}:${cmdText}`;
                            }
                            return cmdText;
                        }).join('\n');

                        return new Response(formatted, {
                            status: 200,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching pending commands:', err);
            }

            return new Response('OK', { status: 200 });
        }

        // POST /iclock/devicecmd — command execution acknowledgment
        if (
            (path === '/iclock/devicecmd' || path === '/iclock/devicecmd.aspx')
            && request.method === 'POST'
        ) {
            performDeviceHeartbeat(sn, ctx);

            try {
                const body = await request.text();
                console.log(`POST /iclock/devicecmd from SN ${sn}. Body length: ${body.length}. Content:\n${body}`);
                const lines = body.split('\n').filter(l => l.trim());
                if (lines.length > 0) {
                    const firstLineParams = parseParameters(lines[0].trim());
                    const id = firstLineParams.ID || firstLineParams.id;
                    const returnVal = firstLineParams.Return || firstLineParams.return;

                    if (id) {
                        const status = returnVal === '0' ? 'acknowledged' : 'error';
                        const cmd = await getCommandById(id);
                        const ackBodyLog = body.slice(0, 1000);
                        await updateSingleCommand(id, {
                            status: status,
                            acknowledged_at: new Date().toISOString(),
                            command: cmd ? `${cmd.command}\nACK_BODY: ${ackBodyLog}` : `ACK_BODY: ${ackBodyLog}`
                        });

                        // If the command succeeded and there are data lines following, process them!
                        if (returnVal === '0' && lines.length > 1) {
                            const dataLines = lines.slice(1).join('\n');
                            if (cmd) {
                                const cmdType = cmd.command_type;
                                console.log(`Command ${id} is of type ${cmdType}. Parsing ${lines.length - 1} data lines.`);
                                if (cmdType === 'QUERY_USERINFO') {
                                    if (ctx && typeof ctx.waitUntil === 'function') {
                                        ctx.waitUntil(handleUserInfoUpload(dataLines, sn));
                                    } else {
                                        await handleUserInfoUpload(dataLines, sn);
                                    }
                                } else if (cmdType === 'QUERY_FINGERTMP') {
                                    if (ctx && typeof ctx.waitUntil === 'function') {
                                        ctx.waitUntil(handleTemplateUpload(dataLines, sn));
                                    } else {
                                        await handleTemplateUpload(dataLines, sn);
                                    }
                                } else if (cmdType === 'QUERY_BIODATA') {
                                    if (ctx && typeof ctx.waitUntil === 'function') {
                                        ctx.waitUntil(handleBiodataUpload(dataLines, sn));
                                    } else {
                                        await handleBiodataUpload(dataLines, sn);
                                    }
                                } else if (cmdType === 'QUERY_FACE') {
                                    if (ctx && typeof ctx.waitUntil === 'function') {
                                        ctx.waitUntil(handleFaceUpload(dataLines, sn));
                                    } else {
                                        await handleFaceUpload(dataLines, sn);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Error processing devicecmd:', err);
            }

            return new Response('OK', { status: 200 });
        }

        // GET /iclock/cdata — handshake
        if (
            (path === '/iclock/cdata' || path === '/iclock/cdata.aspx')
            && request.method === 'GET'
        ) {
            performDeviceHeartbeat(sn, ctx);

            const body = [
                `GET OPTION FROM: ${sn}`,
                `ATT,Stamp=0`,
                `ErrorDelay=30`,
                `Delay=10`,
                `TransFlag=TransData AttLog OpLog AttPhoto EnrollUser ChgUser EnrollFP ChgFP UserPic`,
                `TimeZone=4`,
                `ServerVer=2.4.1 2015-04-27`,
                `PushProtVer=2.4.1`,
                `PushOptionsFlag=1`,
            ].join('\n');

            return new Response(body, {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        // POST /iclock/cdata — data upload from device
        if (
            (path === '/iclock/cdata' || path === '/iclock/cdata.aspx')
            && request.method === 'POST'
        ) {
            performDeviceHeartbeat(sn, ctx);

            const table = (url.searchParams.get('table') || '').toUpperCase();
            const body = await request.text();
            console.log(`POST /iclock/cdata from SN ${sn}, table: ${table}. Body length: ${body.length}`);

            // Log all incoming cdata table names for debugging
            try {
                const resCmds = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?device_serial=eq.${encodeURIComponent(sn)}&order=id.desc&limit=1`, {
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                    }
                });
                if (resCmds.ok) {
                    const cmds = await resCmds.json();
                    if (cmds && cmds.length > 0) {
                        await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${cmds[0].id}`, {
                            method: 'PATCH',
                            headers: {
                                'apikey': SUPABASE_SERVICE_KEY,
                                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                command: `${cmds[0].command}\nCDATA_LOG: Table=${table}, Len=${body.length}, Preview=${body.slice(0, 200).replace(/\n/g, ' ')}`
                            })
                        });
                    }
                }
            } catch (err) {
                console.error("General cdata log failed:", err);
            }

            // Handle standard attendance punches
            if (!table || table === 'ATTLOG') {
                const lines = body.split('\n').filter(l => l.trim());
                const punches = [];

                for (const line of lines) {
                    if (line.startsWith('PUSH') || line.startsWith('ATTLOG')) continue;

                    const parts = line.trim().split('\t');
                    if (parts.length < 3) continue;

                    const userId = parts[0].trim();
                    const datetime = parts[1].trim();
                    const verify = parts[2].trim();
                    const punchType = parts[3] ? parts[3].trim() : '0';

                    if (!userId || !datetime) continue;

                    punches.push({
                        user_id: userId,
                        punch_time: new Date(`${datetime}+04:00`).toISOString(),
                        verify_type: parseInt(punchType) || 0,
                        punch_type: parseInt(verify) || 0,
                        device_serial: sn,
                        raw: line.trim()
                    });
                }

                if (punches.length > 0) {
                    const result = await insertPunches(punches);
                    if (!result.ok) {
                        const error = await result.text();
                        console.error('Supabase error inserting punches:', error);
                        return new Response('ERROR', { status: 500 });
                    }
                    console.log(`Inserted ${punches.length} punches from ${sn}`);
                }
            }

            // Handle USERINFO upload (triggers employee upsert and command sync)
            else if (table === 'USERINFO') {
                if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(handleUserInfoUpload(body, sn));
                } else {
                    await handleUserInfoUpload(body, sn);
                }
            }

            // Handle TEMPLATE (fingerprint) upload (triggers command sync)
            else if (table === 'TEMPLATE' || table === 'FINGERTMP') {
                try {
                    const resCmds = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?device_serial=eq.${encodeURIComponent(sn)}&command_type=eq.QUERY_FINGERTMP&order=id.desc&limit=1`, {
                        headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                        }
                    });
                    if (resCmds.ok) {
                        const cmds = await resCmds.json();
                        if (cmds && cmds.length > 0) {
                            const cmdId = cmds[0].id;
                            await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${cmdId}`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': SUPABASE_SERVICE_KEY,
                                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    command: `${cmds[0].command}\nCDATA_BODY: ${body.slice(0, 1000)}`
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Debug cdata log failed:", err);
                }

                if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(handleTemplateUpload(body, sn));
                } else {
                    await handleTemplateUpload(body, sn);
                }
            }

            // Handle BIODATA (newer biometrics/face) upload (triggers command sync)
            else if (table === 'BIODATA') {
                try {
                    const resCmds = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?device_serial=eq.${encodeURIComponent(sn)}&command_type=eq.QUERY_BIODATA&order=id.desc&limit=1`, {
                        headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                        }
                    });
                    if (resCmds.ok) {
                        const cmds = await resCmds.json();
                        if (cmds && cmds.length > 0) {
                            const cmdId = cmds[0].id;
                            await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${cmdId}`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': SUPABASE_SERVICE_KEY,
                                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    command: `${cmds[0].command}\nCDATA_BODY: ${body.slice(0, 1000)}`
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Debug biodata cdata log failed:", err);
                }

                if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(handleBiodataUpload(body, sn));
                } else {
                    await handleBiodataUpload(body, sn);
                }
            }

            // Handle FACE (older biometrics/face) upload (triggers command sync)
            else if (table === 'FACE') {
                try {
                    const resCmds = await fetch(`${SUPABASE_URL}/rest/v1/device_commands?device_serial=eq.${encodeURIComponent(sn)}&command_type=eq.QUERY_FACE&order=id.desc&limit=1`, {
                        headers: {
                            'apikey': SUPABASE_SERVICE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                        }
                    });
                    if (resCmds.ok) {
                        const cmds = await resCmds.json();
                        if (cmds && cmds.length > 0) {
                            const cmdId = cmds[0].id;
                            await fetch(`${SUPABASE_URL}/rest/v1/device_commands?id=eq.${cmdId}`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': SUPABASE_SERVICE_KEY,
                                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    command: `${cmds[0].command}\nCDATA_BODY: ${body.slice(0, 1000)}`
                                })
                            });
                        }
                    }
                } catch (err) {
                    console.error("Debug face cdata log failed:", err);
                }

                if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(handleFaceUpload(body, sn));
                } else {
                    await handleFaceUpload(body, sn);
                }
            }

            // Handle OPERLOG (device operation logs which carry biometrics uploads in key-value formats)
            else if (table === 'OPERLOG') {
                const lines = body.split('\n').filter(l => l.trim());
                const userLines = [];
                const fpLines = [];
                const faceLines = [];
                const biodataLines = [];

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('USER ')) {
                        userLines.push(trimmed.slice(5).trim());
                    } else if (trimmed.startsWith('USER\t')) {
                        userLines.push(trimmed.slice(5).trim());
                    } else if (trimmed.startsWith('FP ')) {
                        fpLines.push(trimmed.slice(3).trim());
                    } else if (trimmed.startsWith('FP\t')) {
                        fpLines.push(trimmed.slice(3).trim());
                    } else if (trimmed.startsWith('FACE ')) {
                        faceLines.push(trimmed.slice(5).trim());
                    } else if (trimmed.startsWith('FACE\t')) {
                        faceLines.push(trimmed.slice(5).trim());
                    } else if (trimmed.startsWith('BIODATA ')) {
                        biodataLines.push(trimmed.slice(8).trim());
                    } else if (trimmed.startsWith('BIODATA\t')) {
                        biodataLines.push(trimmed.slice(8).trim());
                    }
                }

                if (userLines.length > 0) {
                    const payload = userLines.join('\n');
                    await handleUserInfoUpload(payload, sn);
                }
                if (fpLines.length > 0) {
                    const payload = fpLines.join('\n');
                    await handleTemplateUpload(payload, sn);
                }
                if (faceLines.length > 0) {
                    const payload = faceLines.join('\n');
                    await handleFaceUpload(payload, sn);
                }
                if (biodataLines.length > 0) {
                    const payload = biodataLines.join('\n');
                    await handleBiodataUpload(payload, sn);
                }
            }

            return new Response('OK', { status: 200 });
        }

        return new Response('Not Found', { status: 404 });
    }
};
