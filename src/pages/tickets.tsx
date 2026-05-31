import AddRecordButton from "@/components/add-record-button";
import { useAuth } from "@/components/AuthProvider";
import Back from "@/components/back";
import CustomDropDown from '@/components/custom-dropdown';
import RefreshButton from "@/components/refresh-button";
import { ResponsiveModal } from "@/components/responsive-modal";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth, db } from "@/firebase";
import { addDoc, collection, deleteDoc, doc, getCountFromServer, onSnapshot, orderBy, query, serverTimestamp, updateDoc, getDocs, where } from "firebase/firestore";
import JavascriptTimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { ArrowDown, ArrowUp, Globe, Loader2, LockKeyholeIcon, MoreVertical, Reply, Ticket } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactTimeAgo from "react-time-ago";
import { toast } from "sonner";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  createdBy: string;
  createdAt: any;
  lastMessage?: string;
  lastMessageAt?: any;
  priority?: string;
  confidential?: boolean;
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

  const hasTicketHandler = useMemo(() => {
    try {
      const c = userData?.clearance || '{}';
      const parsed = typeof c === 'string' ? JSON.parse(c) : c;
      return !!parsed?.tickets_handler;
    } catch (e) { return false; }
  }, [userData?.clearance]);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyIsHandler, setReplyIsHandler] = useState<Record<string, boolean>>({});
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: 'Normal', confidential: false });
  const [showNewModal, setShowNewModal] = useState(false);
  const [isCardClosing, setIsCardClosing] = useState(false);
  const newCardRef = useRef<HTMLDivElement | null>(null);
  const newDescRef = useRef<HTMLTextAreaElement | null>(null);
  const editCardRef = useRef<HTMLDivElement | null>(null);
  const editDescRef = useRef<HTMLTextAreaElement | null>(null);
  // FLIP helpers for smooth list reflow
  const captureListRects = () => {
    const map: Record<string, DOMRect> = {};
    try {
      const items = document.querySelectorAll<HTMLElement>(`.ticket-item`);
      items.forEach((el) => {
        const id = el.dataset.id;
        if (id) map[id] = el.getBoundingClientRect();
      });
    } catch (e) { /* ignore */ }
    return map;
  };

// Top-level composer placed above return so its props type is known at usage
const TopLevelComposer: React.FC<{ posting: boolean, onPost: (text: string) => Promise<void>, onCancel?: () => void }> = ({ posting, onPost, onCancel }) => {
  const [text, setText] = useState("");
  return (
    <form onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await onPost(text); setText(''); }} style={{ display: 'flex', gap: 8, flexFlow: 'column' }}>
      <textarea value={text} rows={5} onChange={e => setText(e.target.value)} placeholder="Reply to this thread" style={{ flex: 1, padding:"0.75 0.5rem", fontSize:"1rem" }} />
        <div style={{ display: 'flex', justifyContent: '', gap: 8 }}>
          {onCancel ? (
            <>
              <button type="button" onClick={() => { setText(''); onCancel && onCancel(); }} style={{ padding: "0.5rem 1.5rem", background: '#eee', border: 'none', borderRadius: 8, flex:1 }}>Cancel</button>
              <button type="submit" disabled={posting || !text.trim()} style={{ padding: "0.5rem 1.5rem", background: '', color: '', border: 'none', borderRadius: 8, flex:1 }}>{posting ? 'Posting...' : 'Post'}</button>
            </>
          ) : (
            <button type="submit" disabled={posting || !text.trim()} style={{ padding: "0.5rem 1.5rem", flex:1, width:"fit-content", cursor: posting || !text.trim() ? 'not-allowed' : 'pointer' }}><Reply size={15}/>{posting ? 'Posting...' : 'Reply'}</button>
          )}
        </div>
    </form>
  );
};

  const playFLIP = (oldRects: Record<string, DOMRect>) => {
    try {
      const items = Array.from(document.querySelectorAll<HTMLElement>(`.ticket-item`));
      items.forEach((el) => {
        const id = el.dataset.id;
        if (!id) return;
        const oldRect = oldRects[id];
        if (!oldRect) return;
        const newRect = el.getBoundingClientRect();
        const deltaY = oldRect.top - newRect.top;
        if (Math.abs(deltaY) > 0.5) {
          // smoother FLIP: animate transform + opacity, set will-change for GPU acceleration
          el.style.willChange = 'transform, opacity';
          el.style.transition = 'transform 420ms cubic-bezier(.2,.85,.2,1), opacity 420ms cubic-bezier(.2,.85,.2,1)';
          el.style.transform = `translateY(${deltaY}px)`;
          el.style.opacity = '0.99';
          // double rAF to ensure the browser registers the start state before we clear it
          requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = ''; el.style.opacity = ''; }));
          setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.style.willChange = ''; }, 460);
        }
      });
    } catch (e) { /* ignore */ }
  };

  const closeCardWithAnimation = (onHidden?: () => void) => {
    const oldRects = captureListRects();
    // create a ghost clone of the new-card so we can remove the real element
    // from layout immediately (triggering reflow) while still showing the
    // exit animation visually on the ghost.
    const cardEl = newCardRef.current;
    let ghost: HTMLElement | null = null;
    if (cardEl) {
      try {
        const rect = cardEl.getBoundingClientRect();
        ghost = cardEl.cloneNode(true) as HTMLElement;
        ghost.style.position = 'fixed';
        ghost.style.left = rect.left + 'px';
        ghost.style.top = rect.top + 'px';
        ghost.style.width = rect.width + 'px';
        ghost.style.height = rect.height + 'px';
        ghost.style.margin = '0';
        ghost.style.zIndex = '9999';
        // ensure ghost plays exit animation
        ghost.classList.remove('card-enter');
        ghost.classList.add('card-exit');
        document.body.appendChild(ghost);
      } catch (e) { /* ignore */ }
    }

    // remove the real card from layout immediately so other items reflow
    setIsCardClosing(true);
    setShowNewModal(false);
    // run FLIP immediately after DOM update so items animate from old -> new
    requestAnimationFrame(() => playFLIP(oldRects));

    // cleanup ghost after its animation completes
    const cleanupDelay = 460; // matches CSS animation + a small buffer
    setTimeout(() => {
      setIsCardClosing(false);
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      if (onHidden) onHidden();
    }, cleanupDelay);
  };

  const closeEditCardWithAnimation = (onHidden?: () => void) => {
    const oldRects = captureListRects();
    const cardEl = editCardRef.current;
    let ghost: HTMLElement | null = null;
    if (cardEl) {
      try {
        const rect = cardEl.getBoundingClientRect();
        ghost = cardEl.cloneNode(true) as HTMLElement;
        ghost.style.position = 'fixed';
        ghost.style.left = rect.left + 'px';
        ghost.style.top = rect.top + 'px';
        ghost.style.width = rect.width + 'px';
        ghost.style.height = rect.height + 'px';
        ghost.style.margin = '0';
        ghost.style.zIndex = '9999';
        ghost.classList.remove('card-enter');
        ghost.classList.add('card-exit');
        document.body.appendChild(ghost);
      } catch (e) { /* ignore */ }
    }

    setShowNewModal(false); // ensure new card hidden if both open
    requestAnimationFrame(() => playFLIP(oldRects));
    const cleanupDelay = 460;
    setTimeout(() => {
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      if (onHidden) onHidden();
    }, cleanupDelay);
  };

  const openOrScrollNewCard = () => {
    if (!showNewModal) {
      setShowNewModal(true);
      return;
    }
    try {
      newCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { try { newDescRef.current?.focus(); } catch (e) { /* ignore */ } }, 220);
    } catch (e) { /* ignore */ }
  };
  const [sending, setSending] = useState(false);
  const [topComposerOpen, setTopComposerOpen] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState<string | null>(null);
  const [profileDialogEmail, setProfileDialogEmail] = useState<string | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editTicketData, setEditTicketData] = useState({ title: '', description: '', priority: 'Normal', confidential: false });
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string; ticketId: string } | null>(null);

  

  const avatarColor = (seed?: string) => {
    const palette = ["#6b73ff", "#34d399", "#f59e0b", "#fb7185", "#60a5fa", "#a78bfa"];
    if (!seed) return palette[0];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
    return palette[Math.abs(h) % palette.length];
  };

  // tickets listener
  // request notification permission and register service worker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
      }
    } catch (e) { /* ignore */ }
  }, []);

  // Workaround for old iOS Safari: remove transforms while any textarea is focused
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || (target as HTMLElement).closest && (target as HTMLElement).closest('textarea'))) {
        document.body.classList.add('textarea-focused');
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'TEXTAREA') {
        // slight delay to allow focus to move to another textarea
        setTimeout(() => { if (!document.activeElement || document.activeElement.tagName !== 'TEXTAREA') document.body.classList.remove('textarea-focused'); }, 50);
      }
    };
    document.addEventListener('focusin', onFocusIn as any);
    document.addEventListener('focusout', onFocusOut as any);
    return () => {
      document.removeEventListener('focusin', onFocusIn as any);
      document.removeEventListener('focusout', onFocusOut as any);
      document.body.classList.remove('textarea-focused');
    };
  }, []);

  const skipInitialTickets = useRef(true);
  const notifyNewTicket = async (t: any) => {
    try {
      if (!t) return;
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      if (t.createdBy === user?.email) return; // don't notify the creator
      const title = `New ticket: ${t.title || 'Ticket'}`;
      const body = (t.description || '').slice(0, 140);
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          reg.showNotification(title, { body, data: { id: t.id } });
          return;
        }
      }
      new Notification(title, { body });
    } catch (e) { console.error('notify error', e); }
  };

  useEffect(() => {
    setLoadingTickets(true);
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Ticket));
      // skip notifying on the initial snapshot load
      if (skipInitialTickets.current) {
        skipInitialTickets.current = false;
      } else {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            notifyNewTicket({ id: change.doc.id, ...(change.doc.data() as any) });
          }
        });
      }
      setTickets(docs);
      setLoadingTickets(false);
    }, (err) => {
      console.error(err); setLoadingTickets(false);
    });
    return unsub;
  }, [user?.email]);

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

  // fetch handler status for message authors so we can label replies
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const emails = Array.from(new Set(messages.map(m => m.createdBy).filter(Boolean)));
        if (emails.length === 0) {
          if (mounted) setReplyIsHandler({});
          return;
        }
        const pairs = await Promise.all(emails.map(async (email) => {
          try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const data = snap.docs[0].data() as any;
              const c = data.clearance || '{}';
              const parsed = typeof c === 'string' ? JSON.parse(c || '{}') : c;
              return [email, !!parsed?.tickets_handler] as [string, boolean];
            }
            return [email, false] as [string, boolean];
          } catch (e) { return [email, false] as [string, boolean]; }
        }));
        if (!mounted) return;
        const map: Record<string, boolean> = {};
        pairs.forEach(([email, val]) => { map[email] = val; });
        setReplyIsHandler(map);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [messages]);

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
      try {
        newCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // focus description after a short delay so user can type immediately
        setTimeout(() => { try { newDescRef.current?.focus(); } catch (e) { /* ignore */ } }, 220);
      } catch (e) { /* ignore */ }
    }, 60);
    return () => clearTimeout(t);
  }, [showNewModal]);

  // focus edit description when inline edit card opens
  useEffect(() => {
    if (!editingTicket) return;
    const t = setTimeout(() => {
      try {
        editCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { try { editDescRef.current?.focus(); } catch (e) { /* ignore */ } }, 220);
      } catch (e) { /* ignore */ }
    }, 60);
    return () => clearTimeout(t);
  }, [editingTicket]);

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

  // filter tickets based on confidentiality and handler permission
  const visibleTickets = useMemo(() => {
    return (tickets || []).filter(t => !t.confidential || hasTicketHandler);
  }, [tickets, hasTicketHandler]);

  // control fade-in show class so transition always runs after loading completes
  const [ticketsFadeShow, setTicketsFadeShow] = useState(false);
  useEffect(() => {
    let id: any;
    if (!loadingTickets && visibleTickets.length > 0) {
      // delay a tick so the class is added after mount to trigger transition
      id = setTimeout(() => setTicketsFadeShow(true), 40);
    } else {
      setTicketsFadeShow(false);
    }
    return () => { if (id) clearTimeout(id); };
  }, [loadingTickets, visibleTickets.length]);

  // no per-item JS stagger; CSS handles stagger via --i custom property

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
        priority: newTicket.priority || 'Normal',
        confidential: !!newTicket.confidential,
        status: "open",
        createdBy: user.email,
        createdAt: serverTimestamp(),
        lastMessage: newTicket.description,
        lastMessageAt: serverTimestamp(),
      });
      setNewTicket({ title: "", description: "", priority: 'Normal', confidential: false });
      // play exit animation then hide with FLIP
      closeCardWithAnimation();
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
      <div style={{ marginLeft: depth * 16, padding: "8px 0", }}>
        <div style={{ display: 'flex', gap: 8}}>

          

          <div style={{ flex: 1 , border:"", padding:"0.5rem" }}>

            <div style={{display:"flex", gap: 8, alignItems:"center"}}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatarColor(node.createdBy), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{node.createdBy ? node.createdBy.split('@')[0].slice(0,2).toUpperCase() : 'U'}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{node.createdBy}</div>
                  {replyIsHandler[node.createdBy] && (
                    <div style={{ fontSize: "0.8rem", padding: '0.12rem 0.5rem', borderRadius: 6, background: '#eef2ff', color: '#3730a3', fontWeight: 600 }}>Handler</div>
                  )}
                </div>
                <div style={{fontSize:"0.7rem", fontWeight:"500", color: '#666' }}>
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
            <div style={{ marginTop: 6, fontSize: "1rem" }}>{node.text}</div>
            
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
      <Back blurBG fixed title="Tickets" extra={<div style={{ display: 'flex', gap: 8 }}><RefreshButton onClick={() => { /* rely on snapshot */ }} fetchingData={loadingTickets} refreshCompleted={false} /></div>} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        {visibleTickets.length === 0 && !loadingTickets ? (
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
              <div className={`tickets-fade ${ticketsFadeShow ? 'show' : ''}`} style={{ marginTop: '4.5rem' }}>
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
                          <div style={{ fontSize: "1rem", fontWeight: 500 }}>New Ticket</div>
                        <div style={{ fontSize: 12, color: 'darkblue', fontWeight:"500" }}>{user?.email}</div>
                        </div>
                        
                        </div>
                        
                        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, border:"" }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height:"0.5rem" }}>
                            
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: '', flexFlow:"column " }}>
                            <div style={{ flex: 1 }}>
                              <Select  value={newTicket.title} onValueChange={(v: string) => setNewTicket({ ...newTicket, title: v })}>
                                <SelectTrigger style={{ height: 40, display: 'flex', alignItems: 'center' }}>
                                  <SelectValue placeholder="Select request type" />
                                </SelectTrigger>
                                <SelectContent style={{fontSize:"1rem"}}>
                                  <SelectItem value="Request for installation">Request for installation</SelectItem>
                                  <SelectItem value="Request for support">Request for support</SelectItem>
                                  <SelectItem value="Request for debugging">Request for debugging</SelectItem>
                                  <SelectItem value="Feature request">Feature request</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div style={{display:"flex", gap:"0.5rem" }}>
                              <Select value={newTicket.priority} onValueChange={(v: string) => setNewTicket({ ...newTicket, priority: v })}>
                                <SelectTrigger style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex:1 }}>
                                  <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Normal">Normal</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                              <button type="button" onClick={() => setNewTicket({ ...newTicket, confidential: !newTicket.confidential })} style={{ width: 140, flex:1, display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem', borderRadius: 8, background: newTicket.confidential ? '#f3f4f6' : '#fff', border: '1px solid rgba(0,0,0,0.04)' }}>
                                {
                                  newTicket.confidential ? (
                                    <LockKeyholeIcon size={14} />):
                                    (
                                      <Globe size={14}/>
                                    )
                                }
                                {newTicket.confidential ? 'Confidential' : 'Public'}
                              </button>
                            </div>
                            
                          </div>
                          
                          <textarea ref={newDescRef} placeholder="Description" value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} required style={{ padding: "1rem 1rem", minHeight: 140, width: '100%' }} />
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input type="checkbox" checked={!!newTicket.confidential} onChange={(e) => setNewTicket({ ...newTicket, confidential: e.target.checked })} />
                              <span style={{ fontSize: 13 }}>Confidential request</span>
                            </label> */}
                            <button type="button" onClick={() => { closeCardWithAnimation(() => setNewTicket({ title: '', description: '', priority: 'Normal', confidential: false })); }} style={{ padding: 10, background: '', border: 'none', color:"", flex:1 }}>Cancel</button>

                            <button type="submit" disabled={sending} style={{ padding: 10, background: 'darkblue', color: 'white', flex:1 }}>{sending ? 'Creating...' : 'Create'}</button>
                            
                            
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
                {editingTicket && (
                  <div ref={editCardRef} style={{ marginBottom: 12 }}>
                    <div className={'card-enter'} style={{
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
                          <button onClick={(e) => { e.stopPropagation(); }} style={{ width: 62, height: 62, borderRadius: 12, background: avatarColor(editingTicket.createdBy || ''), color: 'white', border: 'none', fontWeight: 700 }}>
                            <Ticket />
                          </button>
                          <div style={{border:"", display:"flex", flexFlow:"column", gap:"", alignItems:""}}>
                            <div style={{ fontSize: "1rem", fontWeight: 500 }}>Edit Ticket</div>
                            <div style={{ fontSize: 12, color: 'darkblue', fontWeight:"500" }}>{editingTicket.createdBy}</div>
                            
                          </div>
                          
                        </div>
<div style={{height: "0.5rem"}}></div>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          if (!editingTicket) return;
                          try {
                            await updateDoc(doc(db, 'tickets', editingTicket.id), { title: editTicketData.title, description: editTicketData.description, priority: editTicketData.priority || 'Normal', confidential: !!editTicketData.confidential });
                            toast.success('Ticket updated');
                            closeEditCardWithAnimation(() => { setEditingTicket(null); setEditTicketData({ title: '', description: '', priority: 'Normal', confidential: false }); });
                          } catch (err) { console.error(err); toast.error('Failed to update ticket'); }
                        }} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                          <input value={editTicketData.title} onChange={e => setEditTicketData({ ...editTicketData, title: e.target.value })} placeholder="Title" required style={{ padding: 10 }} />
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 }}>
                            <div style={{ flex: 1 }}>
                              <Select value={editTicketData.priority} onValueChange={(v: string) => setEditTicketData({ ...editTicketData, priority: v })}>
                                <SelectTrigger style={{ height: 40, display: 'flex', alignItems: 'center', flex:1 }}>
                                  <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Normal">Normal</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <button type="button" onClick={() => setEditTicketData({ ...editTicketData, confidential: !editTicketData.confidential })} style={{ width: 140, flex:1, display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem', borderRadius: 8, background: editTicketData.confidential ? '#f3f4f6' : '#fff', border: '1px solid rgba(0,0,0,0.04)' }}>
                              {
                                  editTicketData.confidential ? (
                              <LockKeyholeIcon size={14} />
                                  ):(
                                    <Globe size={14}/>
                                  )
                              }
                              {editTicketData.confidential ? 'Confidential' : 'Public'}
                            </button>
                          </div>
                          <textarea ref={editDescRef} value={editTicketData.description} onChange={e => setEditTicketData({ ...editTicketData, description: e.target.value })} placeholder="Description" required style={{ padding: "1rem 1rem", minHeight: 140, width: '100%' }} />
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                            <button type="button" onClick={() => { closeEditCardWithAnimation(() => { setEditingTicket(null); setEditTicketData({ title: '', description: '', priority: 'Normal', confidential: false }); }); }} style={{ padding: 10, background: '', border: 'none', color:"", flex:1 }}>Cancel</button>
                            <button type="submit" disabled={sending} style={{ padding: 10, background: 'darkblue', color: 'white', flex:1 }}>{sending ? 'Saving...' : 'Save'}</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
                {visibleTickets.map((t, idx) => {
                  const expanded = selectedTicket?.id === t.id;
                  return (
                    <div key={t.id} className="ticket-item" data-id={t.id} style={{ marginBottom: 12, ['--i' as any]: idx }}>
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
                        <div style={{display:"flex", border:"", flex:1, minWidth:0, flexFlow:"column", gap:"0.25rem"}}>
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

                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                      <div style={{ width:"fit-content",fontSize: 12, padding: '0.15rem 0.5rem', borderRadius: 999, background: t.status === 'open' ? '#fff1f2' : '#ecfdf5', color: t.status === 'open' ? '#dc2626' : '#059669', fontWeight: 600 }}>{t.status.toUpperCase()}</div>
                                      <div style={{ textTransform:"capitalize",width:"fit-content",fontSize: 12, padding: '0.15rem 0.5rem', borderRadius: 999, background: (t.priority === 'High' ? '#fff1f2' : (t.priority === 'Low' ? '#ecfdf5' : '#eef2ff')), color: (t.priority === 'High' ? '#b91c1c' : (t.priority === 'Low' ? '#059669' : '#3730a3')), fontWeight: 600 }}>{(t.priority || 'Normal')}</div>
                                      {t.confidential && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 6 }}>
                                          <div style={{ textTransform: 'none', width: 'fit-content', fontSize: 12, padding: '0.12rem 0.5rem', borderRadius: 999, color: '', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <LockKeyholeIcon size={15} />
                                            
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                </div>
                                
                            </div>
                            {t.createdBy === user?.email && (
                              <CustomDropDown
                                trigger={<MoreVertical size={15}/>}
                                option1Text={'Edit'}
                                onOption1={() => { setEditingTicket(t); setEditTicketData({ title: t.title, description: t.description, priority: (t as any).priority || 'Normal', confidential: !!(t as any).confidential }); }}
                                option2Text={'Delete'}
                                onOption2={() => { setDeleteDialogOpen(t.id); }}
                                onClear={undefined}
                              />
                            )}
                        </div>
                        
                        <div style={{ marginTop: 6, color: '#374151', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding:"0.5rem" }}>
                            <p style={{fontWeight:"500", marginBottom:"0.5rem", lineHeight:"1.25rem", fontSize:"1rem", textAlign:"left"}}>{t.title}</p>
                            <p style={{fontSize:"0.85rem", textAlign:"left"}}>{t.description}</p>
                            </div>
                            <br/>
                            <p  onClick={() => setSelectedTicket(expanded ? null : t)} style={{cursor: 'pointer',fontWeight:"600", fontSize:"0.9rem", display:"flex", alignItems:"center", gap:"0.5rem", color:"darkblue", marginLeft:"0.5rem"}}>{expanded?<ArrowUp size={15}/>:<ArrowDown size={15}/>} {expanded?"Hide Replies ":"Replies "} ({messageCounts[t.id] ?? 0})</p>

                            <div style={{
                        overflow: 'hidden',
                        transition: 'max-height 260ms ease, opacity 220ms ease',
                        maxHeight: expanded ? 1200 : 0,
                        opacity: expanded ? 1 : 0,
                        marginTop: 8
                      }}>
                        <div style={{ padding: '', background: '', borderRadius: 8, border: '' }}>
                          {/* <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Replies </div> */}
                          <div style={{padding:"0.5rem"}}>
                            {messageRoots.length === 0 ? <div style={{ color: '#666' }}>No messages yet.</div> : messageRoots.map(r => <RenderNode key={r.id} node={r} depth={0} ticketId={t.id} />)}
                          </div>
                          {t.status === 'open' && (
                            <div style={{ marginTop: 12 }}>
                              {!topComposerOpen[t.id] ? (
                                <div style={{ display: 'flex', justifyContent: '' }}>
                                  <button onClick={(e) => { e.stopPropagation(); setTopComposerOpen(prev => ({ ...prev, [t.id]: true })); }} style={{ padding: "0.5rem 1rem", background: '', color: '', border: 'none', borderRadius: 8, flex:1 }}><Reply size={15}/>Reply</button>
                                </div>
                              ) : (
                                <TopLevelComposer posting={sending} onPost={async (text: string) => { await postMessage(t.id, text, null); setTopComposerOpen(prev => ({ ...prev, [t.id]: false })); }} onCancel={() => setTopComposerOpen(prev => ({ ...prev, [t.id]: false }))} />
                              )}
                            </div>
                          )}
                          {t.status === 'open' && hasTicketHandler && <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <button onClick={(e) => { e.stopPropagation(); setCloseDialogOpen(t.id); }} style={{ background: '', color: 'crimson', padding: '0.5rem 1rem', border: 'none', borderRadius: 8, flex:1 }}><Ticket/>Close Ticket</button>

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
                          
                          {((t.createdBy === user?.email) || (userData?.role === 'admin' || t.createdBy === user?.email)) && (
                            <CustomDropDown
                              trigger={<button onClick={(e:any) => e.stopPropagation()} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 18, padding: 6 }}>⋯</button>}
                              option1Text={t.createdBy === user?.email ? 'Edit' : ''}
                              onOption1={() => { if (t.createdBy !== user?.email) return; setEditingTicket(t); setEditTicketData({ title: t.title, description: t.description, priority: (t as any).priority || 'Normal', confidential: !!(t as any).confidential }); }}
                              option2Text={(userData?.role === 'admin' || t.createdBy === user?.email) ? 'Delete' : ''}
                              onOption2={() => { if (!(userData?.role === 'admin' || t.createdBy === user?.email)) return; setDeleteDialogOpen(t.id); }}
                              onClear={undefined}
                            />
                          )}
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

            

            {/* Inline edit card replaces modal; no modal fallback */}

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

            <AddRecordButton icon={<Ticket color="darkblue" />} onClick={openOrScrollNewCard} title="New Ticket" />

        <Dialog open={!!deleteDialogOpen} onOpenChange={(v) => !v && setDeleteDialogOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Ticket?</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter style={{ display: 'flex', gap: 8 }}>
              <DialogClose asChild><button style={{ padding: 8, background: '#eee', flex:1 }}>Cancel</button></DialogClose>
              <button onClick={async () => { if (deleteDialogOpen) await handleDelete(deleteDialogOpen); }} style={{ padding: 8, background: 'crimson', color: 'white', flex:1 }}>Delete</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!closeDialogOpen} onOpenChange={(v) => !v && setCloseDialogOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Close Ticket?</DialogTitle><DialogDescription>Are you sure you want to close this ticket? This will mark the thread as closed.</DialogDescription></DialogHeader>
            <DialogFooter style={{ display: 'flex', gap: 8 }}>
              <DialogClose asChild><button style={{ padding: 8, background: '#eee', flex:1 }}>Cancel</button></DialogClose>
              <button onClick={async () => { if (!closeDialogOpen) return; try { await updateDoc(doc(db, 'tickets', closeDialogOpen), { status: 'closed' }); toast.success('Closed'); } catch (err) { console.error(err); toast.error('Failed to close ticket'); } finally { setCloseDialogOpen(null); } }} style={{ padding: 8, background: 'crimson', color: 'white', flex:1 }}>Close</button>
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

// (Moved earlier)

// register time-ago locale once
try { JavascriptTimeAgo.addDefaultLocale(en); } catch (e) { /* ignore if already added */ }

const getDate = (ts: any) => {
  if (!ts) return new Date();
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'number') return new Date(ts);
  return new Date(ts);
};
