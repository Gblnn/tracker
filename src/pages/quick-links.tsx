import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/firebase";
import { toast } from "sonner";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { Link, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function Index() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({ title: "", url: "", visibility: "everyone", allowed_users: [] as string[] });
  const [editLink, setEditLink] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const { userData } = useAuth();

  const LINKS_CACHE_KEY = "quick_links_cache";

  // Load cached links from localStorage (robust, always set array)
  useEffect(() => {
    let loadedFromCache = false;
    try {
      const cached = localStorage.getItem(LINKS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setLinks(parsed);
          loadedFromCache = true;
        }
      }
    } catch (e) {
      // fallback: clear bad cache
      localStorage.removeItem(LINKS_CACHE_KEY);
    }
    // If no cache, set empty array to avoid undefined state
    if (!loadedFromCache) setLinks([]);
    // Always fetch in background
    fetchLinks();
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  // Fetch users for access control
  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // Fetch links from Firestore and update cache
  const fetchLinks = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "quick-links"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLinks(data);
      // Write to localStorage robustly
      try {
        localStorage.setItem(LINKS_CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        // If quota exceeded or other error, clear cache
        localStorage.removeItem(LINKS_CACHE_KEY);
      }
    } catch (err) {
      toast.error("Failed to fetch links");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error("Please enter both title and link");
      return;
    }
    if (newLink.visibility === "select" && newLink.allowed_users.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "quick-links"), {
        title: newLink.title,
        url: newLink.url,
        visibility: newLink.visibility,
        allowed_users: newLink.allowed_users,
        created_by: userData?.email || "",
        created_at: Timestamp.now(),
      });
      toast.success("Link added");
      setAddModalOpen(false);
      setNewLink({ title: "", url: "", visibility: "everyone", allowed_users: [] });
      await fetchLinks();
    } catch (err) {
      toast.error("Failed to add link");
    } finally {
      setSaving(false);
    }
  };

  const handleEditLink = (link: any) => {
    setEditLink({ ...link });
    setEditModalOpen(true);
  };

  const handleUpdateLink = async () => {
    if (!editLink.title.trim() || !editLink.url.trim()) {
      toast.error("Please enter both title and link");
      return;
    }
    if (editLink.visibility === "select" && (!editLink.allowed_users || editLink.allowed_users.length === 0)) {
      toast.error("Please select at least one user");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "quick-links", editLink.id), {
        title: editLink.title,
        url: editLink.url,
        visibility: editLink.visibility,
        allowed_users: editLink.allowed_users || [],
      });
      toast.success("Link updated");
      setEditModalOpen(false);
      setEditLink(null);
      await fetchLinks();
    } catch (err) {
      toast.error("Failed to update link");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, "quick-links", id));
      toast.success("Link deleted");
      setDeleteId(null);
      await fetchLinks();
    } catch (err) {
      toast.error("Failed to delete link");
    } finally {
      setSaving(false);
    }
  };

  // Shared Add Link Content Component
  const AddLinkContent = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem", paddingTop: "0", width: "100%", boxSizing: "border-box" }}>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>Title</label>
        <input
          value={newLink.title}
          onChange={(e) =>
            setNewLink((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter Title"
          style={{ width: "100%" }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>URL</label>
        <input
          value={newLink.url}
          onChange={(e) =>
            setNewLink((prev) => ({ ...prev, url: e.target.value }))
          }
          placeholder="Enter link URL"
          style={{ width: "100%" }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>Visibility</label>
        <Select value={newLink.visibility} onValueChange={(value) => setNewLink((prev) => ({ ...prev, visibility: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="everyone">Everyone</SelectItem>
            <SelectItem value="select">Select Users</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {newLink.visibility === "select" && (
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>Select Users</label>
          <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(100, 100, 100, 0.2)", borderRadius: "0.5rem", padding: "0.5rem" }}>
            {users.map((user) => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem" }}>
                <Checkbox
              
                  checked={newLink.allowed_users.includes(user.email)}
                  onCheckedChange={(checked) => {
                    setNewLink((prev) => ({
                      ...prev,
                      allowed_users: checked
                        ? [...prev.allowed_users, user.email]
                        : prev.allowed_users.filter((e) => e !== user.email)
                    }));
                  }}
                />
                <label style={{ fontSize: "0.875rem", cursor: "pointer" }}>{user.name || user.email}</label>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "1rem" }}>
        <Button variant="outline" onClick={() => setAddModalOpen(false)} disabled={saving} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button onClick={handleAddLink} disabled={saving} style={{ flex: 1 }}>
          {saving ? "Adding..." : "Add"}
        </Button>
      </div>
    </div>
  );

  // Shared Edit Link Content Component
  const EditLinkContent = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem", paddingTop: "0", width: "100%", boxSizing: "border-box" }}>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>Title</label>
        <input
          value={editLink?.title || ""}
          onChange={(e) =>
            setEditLink((prev: any) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter Title"
          style={{ width: "100%" }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>URL</label>
        <input
          value={editLink?.url || ""}
          onChange={(e) =>
            setEditLink((prev: any) => ({ ...prev, url: e.target.value }))
          }
          placeholder="Enter link URL"
          style={{ width: "100%" }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>Visibility</label>
        <Select value={editLink?.visibility || "everyone"} onValueChange={(value) => setEditLink((prev: any) => ({ ...prev, visibility: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="everyone">Everyone</SelectItem>
            <SelectItem value="select">Select Users</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {editLink?.visibility === "select" && (
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>Select Users</label>
          <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(100, 100, 100, 0.2)", borderRadius: "0.5rem", padding: "0.5rem" }}>
            {users.map((user) => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem" }}>
                <Checkbox
                  checked={editLink?.allowed_users?.includes(user.email) || false}
                  onCheckedChange={(checked) => {
                    setEditLink((prev: any) => ({
                      ...prev,
                      allowed_users: checked
                        ? [...(prev.allowed_users || []), user.email]
                        : (prev.allowed_users || []).filter((e: string) => e !== user.email)
                    }));
                  }}
                />
                <label style={{ fontSize: "0.875rem", cursor: "pointer" }}>{user.name || user.email}</label>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "1rem" }}>
        <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={saving} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button onClick={handleUpdateLink} disabled={saving} style={{ flex: 1 }}>
          {saving ? "Updating..." : "Update"}
        </Button>
      </div>
    </div>
  );

  // Shared Delete Confirmation Content Component
  const DeleteLinkContent = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem", width: "100%", boxSizing: "border-box" }}>
      <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>
        Are you sure you want to delete this link? This action cannot be undone.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "1rem" }}>
        <Button variant="outline" onClick={() => setDeleteId(null)} disabled={saving} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => deleteId && handleDeleteLink(deleteId)} disabled={saving} style={{ flex: 1 }}>
          {saving ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div
        style={{
          border: "",
          padding: "1.25rem",
          // background:
          //   "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
        }}
      >
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          {
            <Back
              noback={userData ? false : true}
              title="Links"
              subtitle={links.length}
              icon={
                <div style={{}}>
                  {!userData && (
                    <img src="/sohar_star_logo.png" style={{ width: "2rem" }} />
                  )}
                </div>
              }
              extra={
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <RefreshButton
                    onClick={() => {
                      fetchLinks();
                    }}
                    fetchingData={loading}
                  />
                </div>
              }
            />
          }

          <br />
          <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
            {links.length==0&&loading ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100svh",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: -1,
                }}
              >
                <LoaderCircle width={"2rem"} className="animate-spin" />
              </div>
            ) : links.length === 0 ? (
              <Empty
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100svh",
                  zIndex: -1,
                }}
              >
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Link />
                  </EmptyMedia>
                  <EmptyTitle>No links found</EmptyTitle>
                  <EmptyDescription>
                    Click the + button to add your first quick link
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              links
                .filter((link) => {
                  // Show if visibility is everyone
                  if (link.visibility === "everyone") return true;
                  // Show if user is admin
                  if (userData?.role === "admin") return true;
                  // Show if user is creator
                  if (link.created_by === userData?.email) return true;
                  // Show if user is in allowed_users
                  if (link.allowed_users?.includes(userData?.email)) return true;
                  return false;
                })
                .map((link) => (
                <Directive
                  key={link.id}
                  title={link.title}
                  onClick={() => window.open(link.url, "_blank")}
                  id_subtitle={link.url}
                  icon={
                    <Link
                      
                      style={{ width: "1.25rem" }}
                    />
                  }
                  extra={link.created_by === userData?.email || userData?.role === "admin" ? true : false}
                  extraOnEdit={(e: any) => {
                    if (e) e.stopPropagation();
                    handleEditLink(link);
                  }}
                  extraOnDelete={(e: any) => {
                    if (e) e.stopPropagation();
                    setDeleteId(link.id);
                  }}
                />
           
              ))
            )}
          </div>
          {userData?.role == "admin" && (
            <button
              onClick={() => setAddModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                position: "absolute",
                bottom: "2rem",
                right: "2rem",
                padding: "0.75rem",
              }}
            >
              <Plus />
            </button>
          )}
        </motion.div>
      </div>

      <ResponsiveModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add New Link"
        description="Create a new quick link to access frequently used resources."
      >
        <AddLinkContent />
      </ResponsiveModal>

      <ResponsiveModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        title="Edit Link"
        description="Update the details of your quick link."
      >
        <EditLinkContent />
      </ResponsiveModal>

      <ResponsiveModal
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Link"
        description="Are you sure you want to delete this link? This action cannot be undone."
      >
        <DeleteLinkContent />
      </ResponsiveModal>

      {/* <ReleaseNote /> */}
    </>
  );
}
