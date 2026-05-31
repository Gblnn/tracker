import React, { useEffect, useMemo, useRef, useState } from "react";
import JavascriptTimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { auth, db } from "@/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getCountFromServer } from "firebase/firestore";
import { ArrowUp, Loader2, MoreVertical, Reply, Ticket } from "lucide-react";
import { toast } from "sonner";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import AddRecordButton from "@/components/add-record-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import CustomDropDown from '@/components/custom-dropdown';
import ReactTimeAgo from "react-time-ago";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  createdBy: string;
  createdAt: any;
  lastMessage?: string;
  lastMessageAt?: any;
}

interface Message {
  id: string;
  text: string;
  createdBy: string;
  createdAt: any;
  parentId?: string | null;
}

export default function Tickets() {
  const { userData } = useAuth();
  const user = auth.currentUser;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [newTicket, setNewTicket] = useState({ title: "", description: "" });
  const [showNewModal, setShowNewModal] = useState(false);
  const [isCardClosing, setIsCardClosing] = useState(false);
  const newCardRef = useRef<HTMLDivElement | null>(null);
  const [sending, setSending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [profileDialogEmail, setProfileDialogEmail] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editTicketData, setEditTicketData] = useState({ title: '', description: '' });
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string; ticketId: string } | null>(null);

  

  const avatarColor = (seed?: string) => {
    const palette = ["#6b73ff", "#34d399", "#f59e0b", "#fb7185", "#60a5fa", "#a78bfa"];
    if (!seed) return palette[0];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
    return palette[Math.abs(h) % palette.length];
  };

  // tickets listener
  useEffect(() => {
    setLoadingTickets(true);
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Ticket));
      setTickets(docs);
      setLoadingTickets(false);
    }, (err) => {
      console.error(err); setLoadingTickets(false);
    });
    return unsub;
  }, []);

  // when a ticket is selected, stream its messages
  useEffect(() => {
    if (!selectedTicket) return;
    const q = query(collection(db, `tickets/${selectedTicket.id}/messages`), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map(d => {
        const data = d.data();
        // normalize parentId to string or null
        const rawParent = (data as any).parentId;
        let parentId: string | null = null;
        if (rawParent) {
          if (typeof rawParent === 'string') parentId = rawParent;
          else if ((rawParent as any).id) parentId = (rawParent as any).id;
        }
        return { id: d.id, ...(data as any), parentId } as Message;
      });
      setMessages(msgs);
    }, (err) => console.error(err));
    return unsub;
  }, [selectedTicket]);

  // fetch message counts for each ticket (uses aggregation count API)
  useEffect(() => {
    if (!tickets || tickets.length === 0) return;
    let mounted = true;
    (async () => {
      try {
        const entries = await Promise.all(tickets.map(async (t) => {
          try {
            const q = query(collection(db, `tickets/${t.id}/messages`));
            const snap = await getCountFromServer(q);
            return [t.id, snap.data().count] as [string, number];
          } catch (e) {
            console.error('count error', e);
            return [t.id, 0] as [string, number];
          }
        }));
        if (!mounted) return;
        const map: Record<string, number> = {};
        entries.forEach(([id, count]) => { map[id] = count; });
        setMessageCounts(map);
      } catch (err) { console.error(err); }
    })();
    return () => { mounted = false; };
  }, [tickets]);

  // scroll new-ticket card into view when opened
  useEffect(() => {
    if (!showNewModal) return;
    // slight delay to allow DOM to render
    const t = setTimeout(() => {
      try { newCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* ignore */ }
    }, 60);
    return () => clearTimeout(t);
  }, [showNewModal]);

  // helper: build message tree (roots array) from flat messages
  const messageRoots = useMemo(() => {
    const byId = new Map<string, Message & { children: Message[] }>();
    messages.forEach(m => byId.set(m.id, { ...m, children: [] }));
    const roots: (Message & { children: Message[] })[] = [];
    // ensure chronological order
    const sorted = Array.from(byId.values()).sort((a, b) => {
      const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime());
      const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime());
      return ta - tb;
    });
    sorted.forEach(node => {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [messages]);

  // post message with explicit string parentId (or null)
  const postMessage = async (ticketId: string, text: string, parentId?: string | null) => {
    if (!text?.trim() || !user) return;
    setSending(true);
    try {
      // always store parentId as plain string or null
      await addDoc(collection(db, `tickets/${ticketId}/messages`), {
        text: text.trim(),
        createdBy: user.email,
        createdAt: serverTimestamp(),
        parentId: parentId || null,
      });
      // update ticket preview
      await updateDoc(doc(db, "tickets", ticketId), { lastMessage: text.trim(), lastMessageAt: serverTimestamp() });
      // optimistically update message count for the ticket
      setMessageCounts(prev => ({ ...prev, [ticketId]: (prev[ticketId] || 0) + 1 }));
    } catch (err) {
      console.error(err); toast.error("Failed to post message");
    } finally { setSending(false); }
  };

  const handleCreateTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTicket.title || !newTicket.description || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, "tickets"), {
        title: newTicket.title,
        description: newTicket.description,
        status: "open",
        createdBy: user.email,
        createdAt: serverTimestamp(),
        lastMessage: newTicket.description,
        lastMessageAt: serverTimestamp(),
      });
      setNewTicket({ title: "", description: "" });
      // play exit animation then hide
      setIsCardClosing(true);
      setTimeout(() => { setShowNewModal(false); setIsCardClosing(false); }, 320);
      toast.success("Ticket created");
    } catch (err) { console.error(err); toast.error("Failed to create ticket"); }
    finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDoc(doc(db, "tickets", id)); toast.success("Ticket deleted"); }
    catch (err) { console.error(err); toast.error("Failed to delete ticket"); }
    finally { setDeleteDialogOpen(null); }
  };

  // UI render helpers
  const RenderNode: React.FC<{ node: Message & { children: Message[] }, depth?: number, ticketId: string }> = ({ node, depth = 0, ticketId }) => {
    const [openReply, setOpenReply] = useState(false);
    const [text, setText] = useState("");
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div style={{ marginLeft: depth * 16, padding: "8px 0", borderBottom: "1px solid #f6f6f6" }}>
        <div style={{ display: 'flex', gap: 8}}>

          

          <div style={{ flex: 1, }}>

            <div style={{display:"flex", gap: 8, alignItems:"center"}}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: avatarColor(node.createdBy), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{node.createdBy ? node.createdBy.split('@')[0].slice(0,2).toUpperCase() : 'U'}</div>
              <div style={{ fontSize: 13, fontWeight: 600, display:"flex", alignItems:"", gap:"", border:"", flexFlow:"column" }}>{node.createdBy} <span style={{ fontSize: 12, fontWeight: 500, color: '#666' }}> 

              </span>
              <div style={{fontSize:"0.7rem", fontWeight:"500"}}>
                <ReactTimeAgo timeStyle={"twitter"} date={getDate(node.createdAt)} />
              </div>
              
            </div>
            

            {(() => {
                const canEdit = !!(userData?.role === 'admin' || (user && node.createdBy === user.email));
                return (
                  <CustomDropDown
                    className=""
                    trigger={<MoreVertical onClick={(e:any) => e.stopPropagation()} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 18, padding: 6, borderRadius: 6 }}/>}
                    option1Text={canEdit ? 'Edit' : (selectedTicket?.status === 'open' ? 'Reply' : 'View')}
                    onOption1={() => { if (canEdit) { setEditingMessage({ id: node.id, text: node.text, ticketId }); } else if (selectedTicket?.status === 'open') { setOpenReply(v => !v); } }}
                    option2Text={canEdit ? 'Delete' : ''}
                    onOption2={async () => {
                      if (!canEdit) return;
                      if (!confirm('Delete this reply?')) return;
                      try {
                        await deleteDoc(doc(db, 'tickets', ticketId, 'messages', node.id));
                        // update local count
                        setMessageCounts(prev => ({ ...prev, [ticketId]: Math.max(0, (prev[ticketId] || 1) - 1) }));
                        toast.success('Reply deleted');
                      } catch (err) { console.error(err); toast.error('Failed to delete reply'); }
                    }}
                    onClear={undefined}
                  />
                );
              }
              )()}
            
            </div>
            <div style={{ marginTop: 6, fontSize: 13 }}>{node.text}</div>
            
            <div style={{ marginTop: 8 }}>
              
              {node.children && node.children.length > 0 && (
                <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', color: '#666', marginLeft: 8 }}>{collapsed ? `Show ${node.children.length} replies` : `Hide ${node.children.length} replies`}</button>
              )}
            </div>
            {openReply && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Reply..." style={{ flex: 1, minHeight: 64, padding: 8 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={async () => { if (!text.trim()) return; await postMessage(ticketId, text, node.id); setText(''); setOpenReply(false); }} disabled={sending || !text.trim()} style={{ padding: '0.5rem 0.8rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8 }}>Post</button>
                  <button onClick={() => { setOpenReply(false); setText(''); }} style={{ padding: '0.4rem 0.6rem', background: '#eee', border: 'none', borderRadius: 8 }}>Cancel</button>
                </div>
              </div>
            )}
            {node.children && node.children.length > 0 && !collapsed && (
              <div style={{ marginTop: 8 }}>
                {node.children.map((c:any) => <RenderNode key={c.id} node={c} depth={(depth||0)+1} ticketId={ticketId} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Back blurBG fixed title="Issues" extra={<div style={{ display: 'flex', gap: 8 }}><RefreshButton onClick={() => { /* rely on snapshot */ }} fetchingData={loadingTickets} refreshCompleted={false} /></div>} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
            {tickets.length === 0 && !loadingTickets ? (
              <Empty style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  <EmptyHeader>
                  <EmptyMedia variant="icon"><Ticket size={36} /></EmptyMedia>
                  <EmptyTitle>No Tickets</EmptyTitle>
                  <EmptyDescription>Create a new ticket to start a thread.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : loadingTickets ? (
              <div style={{ display: 'flex', justifyContent: 'center',border:"", position:"absolute", width: '100%', height: '100%', left:0, top:0, alignItems:"center" }}><Loader2 className="animate-spin" /></div>
            ) : (
              <div style={{ marginTop: '4.5rem' }}>
                {showNewModal && (
                  <div ref={newCardRef} style={{ marginBottom: 12 }}>
                    <div className={isCardClosing ? 'card-exit' : 'card-enter'} style={{
                      display: 'flex',
                      gap: 12,
                      padding: 14,
                      borderRadius: 10,
                      background: '#fff',
                      border: '1px solid rgba(16,24,40,0.06)',
                      alignItems: 'flex-start',
                    }}>
                      <div style={{width:"100%" }}>
                        <div style={{border:"", display:"flex", gap:"0.75rem", alignItems:"center", }}>
                          <button onClick={(e) => { e.stopPropagation(); }} style={{ width: 62, height: 62, borderRadius: 12, background: avatarColor(user?.email || ''), color: 'white', border: 'none', fontWeight: 700 }}>
                          <Ticket />
                          
                        </button>
                        <div style={{border:"", display:"flex", flexFlow:"column", gap:"", alignItems:""}}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 500 }}>New Ticket</div>
                        <div style={{ fontSize: 12, color: 'darkblue', fontWeight:"500" }}>{user?.email}</div>
                        </div>
                        
                        </div>
                        
                        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, border:"" }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height:"0.5rem" }}>
                            
                          </div>
                          <Select value={newTicket.title} onValueChange={(v: string) => setNewTicket({ ...newTicket, title: v })}>
                            <SelectTrigger style={{ height: 40, display: 'flex', alignItems: 'center' }}>
                              <SelectValue placeholder="Select request type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Request for installation">Request for installation</SelectItem>
                              <SelectItem value="Request for support">Request for support</SelectItem>
                              <SelectItem value="Request for debugging">Request for debugging</SelectItem>
                              <SelectItem value="Feature request">Feature request</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <textarea placeholder="Description" value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} required style={{ padding: "1rem 1rem", minHeight: 140, width: '100%' }} />
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                            <button type="button" onClick={() => { setIsCardClosing(true); setTimeout(() => { setShowNewModal(false); setIsCardClosing(false); setNewTicket({ title: '', description: '' }); }, 320); }} style={{ padding: 10, background: '', border: 'none', color:"", flex:1 }}>Cancel</button>

                            <button type="submit" disabled={sending} style={{ padding: 10, background: 'darkblue', color: 'white', flex:1 }}>{sending ? 'Creating...' : 'Create'}</button>
                            
                            
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
                {tickets.map(t => {
                  const expanded = selectedTicket?.id === t.id;
                  return (
                    <div key={t.id} style={{ marginBottom: 12 }}>
                      <div
                        
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: 14,
                          borderRadius: 10,
                          background: '#fff',
                          border: '1px solid rgba(16,24,40,0.06)',
                          boxShadow: expanded ? '0 6px 18px rgba(16,24,40,0.06)' : 'none',
                          alignItems: 'flex-start',
                          
                          transition: 'box-shadow 180ms ease, transform 120ms ease',
                          transform: expanded ? 'translateY(-2px)' : 'none',
                          flex:1
                
                        }}
                      >
                        <div style={{display:"flex", border:"", flex:1, flexFlow:"column", gap:"0.25rem"}}>
                        <div style={{display:"flex", border:"", flex:1, justifyContent:"space-between", alignItems:"center",}}>
                            <div id="header-section" style={{display:"flex", border:" "}}>
                                <button onClick={(e) => { e.stopPropagation(); setProfileDialogEmail(t.createdBy); }} style={{ width: 62, height: 62, borderRadius: 12, background: avatarColor(t.createdBy), color: 'white', border: 'none', fontWeight: 700 }}>
                                       {<Ticket/>}
                                </button>
                                <div style={{display:"flex", flexFlow:"column", border:" ", minWidth:0, marginLeft:8}}>
                                    <p style={{display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.85rem", fontWeight:"600"}}>
                                        {t.id}
                                        
                                    </p>
                                    
                                    <div style={{ fontSize: 12, color: 'darkblue', fontWeight:"500" }}>{t.createdBy} · <ReactTimeAgo timeStyle={"twitter"} date={getDate(t.createdAt)} /></div>

                                    <div style={{ width:"fit-content",fontSize: 12, padding: '0.15rem 0.5rem', borderRadius: 999, background: t.status === 'open' ? '#fff1f2' : '#ecfdf5', color: t.status === 'open' ? '#dc2626' : '#059669', fontWeight: 600 }}>{t.status.toUpperCase()}</div>
                                </div>
                                
                            </div>
                            <CustomDropDown
                              trigger={<MoreVertical size={15}/>}
                              option1Text={'Edit'}
                              onOption1={() => { setEditingTicket(t); setEditTicketData({ title: t.title, description: t.description }); }}
                              option2Text={(userData?.role === 'admin' || t.createdBy === user?.email) ? 'Delete' : ''}
                              onOption2={() => { if (!(userData?.role === 'admin' || t.createdBy === user?.email)) return; setDeleteDialogOpen(t.id); }}
                              onClear={undefined}
                            />
                        </div>
                        
                        <div style={{ marginTop: 6, color: '#374151', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding:"0.5rem" }}>
                            <p style={{fontWeight:"500", marginBottom:"0.5rem", lineHeight:"1.25rem", fontSize:"1rem", textAlign:"left"}}>{t.title}</p>
                            <p style={{fontSize:"0.85rem", textAlign:"left"}}>{t.description}</p>
                            </div>
                            <br/>
                            <p  onClick={() => setSelectedTicket(expanded ? null : t)} style={{cursor: 'pointer',fontWeight:"600", fontSize:"0.9rem", display:"flex", alignItems:"center", gap:"0.5rem", color:"darkblue", marginLeft:"0.5rem"}}>{expanded?<ArrowUp size={15}/>:<Reply size={15}/>} {expanded?"Hide Replies ":"Show Replies "} ({messageCounts[t.id] ?? 0})</p>

                            <div style={{
                        overflow: 'hidden',
                        transition: 'max-height 260ms ease, opacity 220ms ease',
                        maxHeight: expanded ? 1200 : 0,
                        opacity: expanded ? 1 : 0,
                        marginTop: 8
                      }}>
                        <div style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid rgba(16,24,40,0.03)' }}>
                          {/* <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Replies </div> */}
                          <div>
                            {messageRoots.length === 0 ? <div style={{ color: '#666' }}>No messages yet.</div> : messageRoots.map(r => <RenderNode key={r.id} node={r} depth={0} ticketId={t.id} />)}
                          </div>
                          {t.status === 'open' && (
                            <div style={{ marginTop: 12 }}>
                              <TopLevelComposer posting={sending} onPost={async (text: string) => { await postMessage(t.id, text, null); }} />
                            </div>
                          )}
                          {t.status === 'open' && <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <button onClick={async (e) => { e.stopPropagation(); await updateDoc(doc(db, 'tickets', t.id), { status: 'closed' }); toast.success('Closed'); }} style={{ background: 'crimson', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: 8 }}>Close Thread</button>

                            {/* {userData?.role === 'admin' && <button onClick={async (e) => { e.stopPropagation(); setDeleteDialogOpen(t.id); }} style={{ background: '#fff', color: '#dc2626', padding: '0.5rem 1rem', border: '1px solid rgba(220,38,38,0.08)', borderRadius: 8 }}>Delete</button>} */}

                          </div>}
                        </div>
                      </div>
                        
                        </div>
                       
                        {/* <div style={{display:"flex", flexFlow:"column", border:"solid", width:"100%"}}>

                            <div style={{display:"flex", gap:6, alignItems:"center", border:"solid red"}}>

                                <button onClick={(e) => { e.stopPropagation(); setProfileDialogEmail(t.createdBy); }} style={{ width: 48, height: 48, borderRadius: 12, background: avatarColor(t.createdBy), color: 'white', border: 'none', fontWeight: 700 }}>
                                       {<Ticket/>}
                                </button>

                                <div style={{display:"flex", flexFlow:"column", border:"solid", minWidth:0}}>

                                    <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {t.title}
                                    </div>

                                <div style={{ fontSize: 12, color: '#6b7280' }}>{t.createdBy} · <ReactTimeAgo timeStyle={"twitter"} date={getDate(t.createdAt)} /></div>
                                <div style={{ width:"fit-content",fontSize: 12, padding: '0.15rem 0.5rem', borderRadius: 999, background: t.status === 'open' ? '#ecfdf5' : '#fff1f2', color: t.status === 'open' ? '#059669' : '#dc2626', fontWeight: 700 }}>{t.status}</div>
                                </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, border:"solid blue" }}>
                          
                          <CustomDropDown
                            trigger={<button onClick={(e:any) => e.stopPropagation()} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 18, padding: 6 }}>⋯</button>}
                            option1Text={'Edit'}
                            onOption1={() => { setEditingTicket(t); setEditTicketData({ title: t.title, description: t.description }); }}
                            option2Text={(userData?.role === 'admin' || t.createdBy === user?.email) ? 'Delete' : ''}
                            onOption2={() => { if (!(userData?.role === 'admin' || t.createdBy === user?.email)) return; setDeleteDialogOpen(t.id); }}
                            onClear={undefined}
                          />
                        </div>
                            </div>
                         <div style={{ marginTop: 6, color: '#374151', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', border:"solid" }}>{t.description}</div>  
                        </div> */}
                        
                      </div>

                      
                    </div>
                  );
                })}
              </div>
            )}

            

            <ResponsiveModal title="Edit Ticket" open={!!editingTicket} onOpenChange={(v) => !v && setEditingTicket(null)} hideHeader>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '520px', maxHeight: '90vh' }}>
                <div style={{ padding: 16, borderBottom: '1px solid rgba(0,0,0,0.04)' }}><h3 style={{ margin: 0 }}>Edit Ticket</h3></div>
                <form onSubmit={async (e) => { e.preventDefault(); if (!editingTicket) return; try { await updateDoc(doc(db, 'tickets', editingTicket.id), { title: editTicketData.title, description: editTicketData.description }); toast.success('Ticket updated'); setEditingTicket(null); } catch (err) { console.error(err); toast.error('Failed to update ticket'); } }} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
                  <label style={{ fontWeight: 700 }}>Title</label>
                  <input value={editTicketData.title} onChange={e => setEditTicketData({ ...editTicketData, title: e.target.value })} required style={{ padding: 10 }} />
                  <label style={{ fontWeight: 700 }}>Description</label>
                  <textarea value={editTicketData.description} onChange={e => setEditTicketData({ ...editTicketData, description: e.target.value })} required style={{ padding: 10, minHeight: 160 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button type="button" onClick={() => setEditingTicket(null)} style={{ flex: 1, padding: 10, background: '#eee', border: 'none' }}>Cancel</button>
                    <button type="submit" disabled={sending} style={{ flex: 1, padding: 10, background: 'darkblue', color: 'white' }}>{sending ? 'Saving...' : 'Save'}</button>
                  </div>
                </form>
              </div>
            </ResponsiveModal>

            <ResponsiveModal title="Edit Reply" open={!!editingMessage} onOpenChange={(v) => !v && setEditingMessage(null)} hideHeader>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: 16 }}>
                <h3 style={{ margin: 0, marginBottom: 8 }}>Edit Reply</h3>
                <textarea value={editingMessage?.text || ''} onChange={e => setEditingMessage(editingMessage ? { ...editingMessage, text: e.target.value } : null)} style={{ minHeight: 160, padding: 8 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => setEditingMessage(null)} style={{ flex: 1, padding: 10, background: '#eee', border: 'none' }}>Cancel</button>
                  <button onClick={async () => { if (!editingMessage) return; try { await updateDoc(doc(db, 'tickets', editingMessage.ticketId, 'messages', editingMessage.id), { text: editingMessage.text, editedAt: serverTimestamp() }); toast.success('Reply updated'); setEditingMessage(null); } catch (err) { console.error(err); toast.error('Failed to update reply'); } }} style={{ flex: 1, padding: 10, background: 'darkblue', color: 'white', border: 'none' }}>Save</button>
                </div>
              </div>
            </ResponsiveModal>

            <AddRecordButton icon={<Ticket color="darkblue" />} onClick={() => setShowNewModal(true)} title="New Issue" />

        <Dialog open={!!deleteDialogOpen} onOpenChange={(v) => !v && setDeleteDialogOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Ticket?</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter style={{ display: 'flex', gap: 8 }}>
              <DialogClose asChild><button style={{ padding: 8, background: '#eee', flex:1 }}>Cancel</button></DialogClose>
              <button onClick={async () => { if (deleteDialogOpen) await handleDelete(deleteDialogOpen); }} style={{ padding: 8, background: 'crimson', color: 'white', flex:1 }}>Delete</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!profileDialogEmail} onOpenChange={(v) => !v && setProfileDialogEmail(null)}>
          <DialogContent><DialogHeader><DialogTitle>User</DialogTitle><DialogDescription>User info</DialogDescription></DialogHeader>
            <div style={{ padding: 8 }}><div style={{ fontWeight: 700 }}>{profileDialogEmail}</div></div>
            <DialogFooter><DialogClose asChild><button style={{ padding: 8, background: '#eee' }}>Close</button></DialogClose></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

const TopLevelComposer: React.FC<{ posting: boolean, onPost: (text: string) => Promise<void> }> = ({ posting, onPost }) => {
  const [text, setText] = useState("");
  return (
    <form onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await onPost(text); setText(''); }} style={{ display: 'flex', gap: 8, flexFlow: 'column' }}>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Reply to this thread" style={{ flex: 1, padding:"0.75 0.5rem" }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={posting || !text.trim()} style={{ padding: "0.5rem 1.5rem", width:"fit-content", cursor: posting || !text.trim() ? 'not-allowed' : 'pointer' }}>{posting ? 'Posting...' : 'Reply'}</button>
        </div>
      
    </form>
  );
};

// register time-ago locale once
try { JavascriptTimeAgo.addDefaultLocale(en); } catch (e) { /* ignore if already added */ }

const getDate = (ts: any) => {
  if (!ts) return new Date();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'number') return new Date(ts);
  return new Date(ts);
};
