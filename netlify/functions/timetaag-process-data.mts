const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type TimetaagRequestBody = {
  fdate?: string;
  tdate?: string;
  calculate?: number;
  report?: string;
  group1?: number;
  group2?: string;
  sort_column?: number;
  client_db_name?: string;
  emp_code?: number;
  emp_ids?: string;
  designation?: number;
  location?: number;
  att_set?: number;
  department?: number;
  branch?: number;
  page?: number;
  per_page?: number;
};

const TIMETAAG_BASE_URL = "https://app.timetaag.com/api/v1";

function getIdempotencyKey(payload: unknown) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function findTokenInUnknown(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const token = findTokenInUnknown(item);
      if (token) {
        return token;
      }
    }
    return null;
  }

  if (!isRecord(data)) {
    return null;
  }

  const tokenKeys = ["token", "access_token", "accessToken", "auth_key", "authKey", "bearer"];
  for (const key of tokenKeys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  const nestedKeys = ["data", "result", "payload", "response"];
  for (const key of nestedKeys) {
    const nested = data[key];
    const nestedToken = findTokenInUnknown(nested);
    if (nestedToken) {
      return nestedToken;
    }
  }

  return null;
}

async function getAuthTokenFromLogin() {
  const loginEmail = process.env.TIMETAAG_ADMIN_EMAIL;
  const loginPassword = process.env.TIMETAAG_ADMIN_PASSWORD;

  if (!loginEmail || !loginPassword) {
    throw new Error(
      "Set TIMETAAG_AUTH_KEY or provide TIMETAAG_ADMIN_EMAIL and TIMETAAG_ADMIN_PASSWORD"
    );
  }

  const loginPayload = {
    email: loginEmail,
    password: loginPassword,
  };

  const loginResponse = await fetch(`${TIMETAAG_BASE_URL}/AdminLogin`, {
    method: "POST",
    headers: {
      "Idempotency-Key": getIdempotencyKey(loginPayload),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(loginPayload),
  });

  const loginText = await loginResponse.text();
  let loginData: unknown = loginText;

  try {
    loginData = JSON.parse(loginText);
  } catch {
    // Keep text response.
  }

  if (!loginResponse.ok) {
    throw new Error(`AdminLogin failed (${loginResponse.status})`);
  }

  const token = findTokenInUnknown(loginData);
  if (!token) {
    throw new Error("AdminLogin succeeded but token was not found in response");
  }

  return token;
}

async function resolveAuthToken() {
  const directToken = process.env.TIMETAAG_AUTH_KEY;
  if (directToken) {
    return directToken;
  }

  return getAuthTokenFromLogin();
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

  let authKey = "";
  const apiKey = process.env.TIMETAAG_API_KEY;
  const defaultDbName = process.env.TIMETAAG_CLIENT_DB_NAME ?? "tt_10000";

  try {
    authKey = await resolveAuthToken();
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to resolve Timetaag auth token",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }

  let incomingBody: TimetaagRequestBody;

  try {
    incomingBody = (await req.json()) as TimetaagRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON payload" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  if (!incomingBody.fdate || !incomingBody.tdate) {
    return new Response(
      JSON.stringify({ success: false, error: "fdate and tdate are required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const payload = {
    fdate: incomingBody.fdate,
    tdate: incomingBody.tdate,
    calculate: incomingBody.calculate ?? 0,
    report: incomingBody.report ?? "basic",
    group1: incomingBody.group1 ?? 0,
    group2: incomingBody.group2 ?? "LocationId",
    sort_column: incomingBody.sort_column ?? 0,
    client_db_name: incomingBody.client_db_name ?? defaultDbName,
    emp_code: incomingBody.emp_code ?? 1,
    emp_ids: incomingBody.emp_ids ?? "1,2",
    designation: incomingBody.designation ?? 1,
    location: incomingBody.location ?? 1,
    att_set: incomingBody.att_set ?? 1,
    department: incomingBody.department ?? 1,
    branch: incomingBody.branch ?? 1,
    page: incomingBody.page ?? 1,
    per_page: incomingBody.per_page ?? 10,
  };

  const idempotencyKey = getIdempotencyKey(payload);

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${authKey}`,
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
    Accept: "application/json",
  };

  if (apiKey) {
    requestHeaders["BioTaag-API-Key"] = apiKey;
  }

  const upstreamResponse = await fetch(`${TIMETAAG_BASE_URL}/GetProcessData`, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(payload),
  });

  const responseText = await upstreamResponse.text();
  let responseData: unknown = responseText;

  try {
    responseData = JSON.parse(responseText);
  } catch {
    // Keep plain text response if not valid JSON.
  }

  if (!upstreamResponse.ok) {
    return new Response(
      JSON.stringify({
        success: false,
        status: upstreamResponse.status,
        error: "Timetaag API request failed",
        data: responseData,
      }),
      { status: upstreamResponse.status, headers: jsonHeaders }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      status: upstreamResponse.status,
      data: responseData,
    }),
    { status: 200, headers: jsonHeaders }
  );
};
