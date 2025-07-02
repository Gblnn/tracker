import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import { db } from "@/firebase";
import { message, Modal } from "antd";
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
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [editLink, setEditLink] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { userData } = useAuth();

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "quick-links"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLinks(data);
    } catch (err) {
      message.error("Failed to fetch links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      message.error("Please enter both title and link");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "quick-links"), {
        title: newLink.title,
        url: newLink.url,
        created_at: Timestamp.now(),
      });
      message.success("Link added");
      setAddModalOpen(false);
      setNewLink({ title: "", url: "" });
      fetchLinks();
    } catch (err) {
      message.error("Failed to add link");
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
      message.error("Please enter both title and link");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "quick-links", editLink.id), {
        title: editLink.title,
        url: editLink.url,
      });
      message.success("Link updated");
      setEditModalOpen(false);
      setEditLink(null);
      fetchLinks();
    } catch (err) {
      message.error("Failed to update link");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, "quick-links", id));
      message.success("Link deleted");
      setDeleteId(null);
      fetchLinks();
    } catch (err) {
      message.error("Failed to delete link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        style={{
          border: "",
          padding: "1.25rem",
          background:
            "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
        }}
      >
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          {
            <Back
              noback={userData ? false : true}
              title="Quick Links"
              icon={
                <div style={{}}>
                  {!userData ? (
                    <img src="/sohar_star_logo.png" style={{ width: "2rem" }} />
                  ) : (
                    <Link style={{ width: "1.25rem" }} />
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
            {loading ? (
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
              <div
                style={{
                  border: "",
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
                No links found.
              </div>
            ) : (
              links.map((link) => (
                <Directive
                  key={link.id}
                  title={link.title}
                  onClick={() => window.open(link.url, "_blank")}
                  id_subtitle={link.url}
                  icon={
                    <Link
                      color="mediumslateblue"
                      style={{ width: "1.25rem" }}
                    />
                  }
                  extra={true}
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
        </motion.div>
      </div>

      <Modal
        title="Add New Link"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddLink}
        confirmLoading={saving}
        okText="Add"
        cancelText="Cancel"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label>Title</label>
            <input
              value={newLink.title}
              onChange={(e) =>
                setNewLink((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter Title"
            />
          </div>
          <div>
            <label>URL</label>
            <input
              value={newLink.url}
              onChange={(e) =>
                setNewLink((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="Enter link URL"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Edit Link"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleUpdateLink}
        confirmLoading={saving}
        okText="Update"
        cancelText="Cancel"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label>Title</label>
            <input
              value={editLink?.title || ""}
              onChange={(e) =>
                setEditLink((prev: any) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter Title"
            />
          </div>
          <div>
            <label>URL</label>
            <input
              value={editLink?.url || ""}
              onChange={(e) =>
                setEditLink((prev: any) => ({ ...prev, url: e.target.value }))
              }
              placeholder="Enter link URL"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Delete Link"
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onOk={() => deleteId && handleDeleteLink(deleteId)}
        confirmLoading={saving}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete this link? This action cannot be
          undone.
        </p>
      </Modal>

      {/* <ReleaseNote /> */}
    </>
  );
}
