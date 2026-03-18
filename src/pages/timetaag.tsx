import Back from "@/components/back";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useState } from "react";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function Timetaag() {
  const [fromDate, setFromDate] = useState(getTodayDate());
  const [toDate, setToDate] = useState(getTodayDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<unknown>(null);

  const fetchProcessData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/.netlify/functions/timetaag-process-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fdate: fromDate,
          tdate: toDate,
          calculate: 0,
          report: "basic",
          group1: 0,
          group2: "LocationId",
          sort_column: 0,
          page: 1,
          per_page: 10,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        data?: unknown;
      };

      if (!response.ok || result.success === false) {
        throw new Error(result.error ?? "Unable to fetch Timetaag data");
      }

      setData(result.data ?? null);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unexpected error while fetching Timetaag data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Back
        fixed
        title="Timetaag"
        subtitle="Module"
        icon={<img src="/timetaag.png" alt="Timetaag" style={{ width: "1.5rem", height: "1.5rem", objectFit: "contain" }} />}
      />
      <div
        style={{
          padding: "1.25rem",
          paddingTop: "5.5rem",
          paddingBottom: "1.5rem",
          minHeight: "100svh",
          boxSizing: "border-box",
        }}
      >
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <img src="/timetaag.png" alt="Timetaag" style={{ width: "2.5rem", height: "2.5rem", objectFit: "contain" }} />
            </EmptyMedia>
            <EmptyTitle>Timetaag Module</EmptyTitle>
            <EmptyDescription>
              Fetch daily process report data directly from Timetaag.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>

        <div
          style={{
            marginTop: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1rem",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>From Date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}
              />
            </label>

            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>To Date</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={fetchProcessData}
            disabled={loading}
            style={{
              marginTop: "0.9rem",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.65rem 0.95rem",
              background: loading ? "#9ca3af" : "#111827",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Fetching..." : "Fetch Daily Report"}
          </button>

          {error ? (
            <p style={{ marginTop: "0.75rem", color: "#dc2626", fontWeight: 500 }}>{error}</p>
          ) : null}

          {data ? (
            <pre
              style={{
                marginTop: "0.75rem",
                maxHeight: "50vh",
                overflow: "auto",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                padding: "0.75rem",
                fontSize: "0.78rem",
                lineHeight: 1.45,
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    </>
  );
}
