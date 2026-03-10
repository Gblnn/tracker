import Back from "@/components/back";
import BottomNav from "@/components/bottom-nav";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export default function SiteAdminWorkers() {
  const { userData } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const assignedSite = (userData?.assignedSite || "").toLowerCase().trim();
      const assignedProject = (userData?.assignedProject || "").toLowerCase().trim();
      const snap = await getDocs(collection(db, "records"));

      const allWorkers = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      const filtered = allWorkers.filter((worker) => {
        if (!assignedSite && !assignedProject) return true;

        const workerSite = String(worker.site || worker.location || "").toLowerCase().trim();
        const workerProject = String(worker.project || "").toLowerCase().trim();

        const siteMatches = assignedSite ? workerSite === assignedSite : true;
        const projectMatches = assignedProject ? workerProject === assignedProject : true;

        return siteMatches && projectMatches;
      });

      filtered.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      setRecords(filtered);
    } catch (error) {
      console.error("Error fetching site workers:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [userData?.assignedSite, userData?.assignedProject]);

  const visibleWorkers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return records;

    return records.filter((worker) => {
      const name = String(worker.name || "").toLowerCase();
      const role = String(worker.role || worker.designation || "").toLowerCase();
      const email = String(worker.email || "").toLowerCase();
      return name.includes(q) || role.includes(q) || email.includes(q);
    });
  }, [records, searchQuery]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <div style={{ padding: "", position: "fixed", zIndex: 20 }}>
          <Back
            noback
            blurBG
            fixed
            title="Site Workers"
            subtitle={visibleWorkers.length}
            icon={<Users color="mediumslateblue" />}
            extra={<RefreshButton onClick={fetchWorkers} fetchingData={loading} />}
          />
        </div>

        <div
          style={{
            position: "fixed",
            top: "4.5rem",
            left: 0,
            right: 0,
            padding: "0.75rem 1.25rem",
            background: "rgba(250, 250, 250)",
            zIndex: 15,
            borderBottom: "1px solid rgba(100, 100, 100, 0.1)",
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workers"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              background: "rgba(150, 150, 150, 0.15)",
              fontSize: "1rem",
            }}
          />
        </div>

        <div
          style={{
            paddingTop: "10rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "8rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            minHeight: "100svh",
          }}
        >
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "65vh" }}>
              <Loader2 className="animate-spin" />
            </div>
          ) : visibleWorkers.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "65vh" }}>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>No Workers Found</EmptyTitle>
                  <EmptyDescription>
                    No workers are mapped to your assigned site and project.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            visibleWorkers.map((worker) => (
              <Directive
                key={worker.id}
                title={worker.name || "Unnamed"}
                id_subtitle={worker.email || worker.role || "-"}
                subtext={worker.designation || worker.project || worker.site || worker.location || ""}
                icon={<Users width={18} color="dodgerblue" />}
                noArrow
              />
            ))
          )}
        </div>
      </motion.div>
      <BottomNav />
    </>
  );
}
