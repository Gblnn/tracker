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

export default {
  async fetch(request, env, ctx) { // ctx included for background tasks
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    // Retrieve SN case-insensitively using standard, safe get() calls
    const sn = url.searchParams.get('SN') || url.searchParams.get('sn') || 'UNKNOWN';

    // Heartbeat — device polls every 10s-30s
    if (path === '/iclock/getrequest' || path === '/iclock/getrequest.aspx') {
      performDeviceHeartbeat(sn, ctx);
      return new Response('OK', { status: 200 });
    }

    // GET — device registration ping, respond with ADMS handshake
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

    // POST — actual punch data, parse and insert into Supabase
    if (
      (path === '/iclock/cdata' || path === '/iclock/cdata.aspx')
      && request.method === 'POST'
    ) {
      performDeviceHeartbeat(sn, ctx);

      const table = url.searchParams.get('table');
      if (table && table !== 'ATTLOG') return new Response('OK', { status: 200 });
      const body = await request.text();

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
          console.error('Supabase error:', error);
          return new Response('ERROR', { status: 500 });
        }
        console.log(`Inserted ${punches.length} punches from ${sn}`);
      }

      return new Response('OK', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }
};
