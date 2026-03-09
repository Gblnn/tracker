import Back from "@/components/back";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";
import { Loader2, Package } from "lucide-react";

export default function Projects() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const col = collection(db, "projects");
      const q = query(col, orderBy("name"));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setItems(list);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div style={{ padding: "1.25rem", height: "100svh" }}>
      <Back title="Projects" />

      <div style={{ marginTop: "1rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <Loader2 className="animate-spin" style={{ color: "dodgerblue" }} />
          </div>
        ) : items.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
            {items.map((p) => (
              <div key={p.id} style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(100,100,100,0.04)" }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{p.description || "No description"}</div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Package />
              </EmptyMedia>
              <EmptyTitle>No projects found</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
