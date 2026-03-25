const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const TIMETAAG_BASE_URL = "https://app.timetaag.com/api/v1";

async function getAuthToken(): Promise<string> {
  // If TIMETAAG_API_KEY is set, use it as the Bearer token directly (no login needed)
  const apiKey = process.env.TIMETAAG_API_KEY?.trim();
  if (apiKey) {
    return apiKey;
  }
  // Fallback to legacy token or login
  const directToken = process.env.TIMETAAG_AUTH_KEY?.trim();
  if (directToken) {
    return directToken.replace(/^Bearer\s+/i, "").trim();
  }
  const email = process.env.TIMETAAG_ADMIN_EMAIL?.trim();
  const password = process.env.TIMETAAG_ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    throw new Error(
      "Missing credentials: set TIMETAAG_API_KEY, TIMETAAG_AUTH_KEY, or both TIMETAAG_ADMIN_EMAIL and TIMETAAG_ADMIN_PASSWORD environment variables."
    );
  }
  let loginRes: Response;
  try {
    loginRes = await fetch(`${TIMETAAG_BASE_URL}/AdminLogin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw new Error(
      `Network error reaching Timetaag login: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  let loginData: unknown;
  try {
    loginData = await loginRes.json();
  } catch {
    throw new Error(`AdminLogin failed (${loginRes.status}): response was not valid JSON`);
  }
  if (!loginRes.ok) {
    const d = loginData as Record<string, unknown> | null;
    const msg =
      d && typeof d.message === "string" && d.message.trim()
        ? d.message
        : `AdminLogin failed with status ${loginRes.status}`;
    throw new Error(msg);
  }
  const d = loginData as Record<string, unknown>;
  const nested = (d.data ?? d.result) as Record<string, unknown> | undefined;
  const token =
    (typeof d.token === "string" && d.token.trim() ? d.token.trim() : undefined) ??
    (typeof d.access_token === "string" && d.access_token.trim() ? d.access_token.trim() : undefined) ??
    (nested && typeof nested.token === "string" && nested.token.trim() ? nested.token.trim() : undefined) ??
    (nested && typeof nested.access_token === "string" && nested.access_token.trim() ? nested.access_token.trim() : undefined);
  if (!token) {
    throw new Error(
      `AdminLogin succeeded (${loginRes.status}) but no token was found in the response: ${JSON.stringify(loginData)}`
    );
  }
  return token;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: jsonHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: jsonHeaders }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const { fdate, tdate } = body;
  if (!fdate || !tdate) {
    return new Response(
      JSON.stringify({ success: false, error: "fdate and tdate are required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  let token: string;
  try {
    token = await getAuthToken();
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Authentication failed",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }

  const clientDbName = process.env.TIMETAAG_CLIENT_DB_NAME?.trim() ?? "tt_10000";

  // Build the GetProcessData payload.
  // Only include the core pagination/grouping fields with sensible defaults.
  // Optional filter fields (emp_code, emp_ids, etc.) are forwarded ONLY if the
  // caller explicitly provided them – sending hardcoded IDs like emp_code=1
  // against a different client database causes a 500 from the API.
  const payload: Record<string, unknown> = {
    fdate,
    tdate,
    calculate: body.calculate ?? 0,
    report: body.report ?? "basic",
    group1: body.group1 ?? 0,
    group2: body.group2 ?? "LocationId",
    sort_column: body.sort_column ?? 0,
    client_db_name: body.client_db_name ?? clientDbName,
    page: body.page ?? 1,
    per_page: body.per_page ?? 10,
  };

  // Forward optional filters only when the caller provided them.
  for (const field of [
    "emp_code",
    "emp_ids",
    "designation",
    "location",
    "att_set",
    "department",
    "branch",
  ]) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`${TIMETAAG_BASE_URL}/GetProcessData`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Network error calling Timetaag API: ${err instanceof Error ? err.message : String(err)}`,
      }),
      { status: 502, headers: jsonHeaders }
    );
  }

  const responseText = await upstreamRes.text();
  let responseData: unknown = responseText;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    // Keep raw text when the API returns non-JSON.
  }

  if (!upstreamRes.ok) {
    return new Response(
      JSON.stringify({
        success: false,
        status: upstreamRes.status,
        error: `Timetaag API returned ${upstreamRes.status}`,
        data: responseData,
      }),
      { status: upstreamRes.status, headers: jsonHeaders }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: responseData }),
    { status: 200, headers: jsonHeaders }
  );
};
