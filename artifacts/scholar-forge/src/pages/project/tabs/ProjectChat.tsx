import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@/hooks/useApi";
import { formatRelative } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

interface MessageUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  message: string;
  imageUrl?: string | null;
  reactions?: string;
  createdAt: string;
  user?: MessageUser | null;
}

interface Props {
  projectId: string;
}

function parseReactions(raw?: string | null): Record<string, string[]> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function ProjectChat({ projectId }: Props) {
  const { user, token } = useAuth();
  const { socket, joinProject, leaveProject, sendTypingStart, sendTypingStop, sendMessage, addReaction } = useSocket();
  const { data, loading } = useQuery<any>(`/api/projects/${projectId}/messages`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data && Array.isArray(data)) setMessages(data);
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    joinProject(projectId);
    return () => leaveProject(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      if (msg.user?.id) {
        setTypingUsers((prev) => { const next = new Set(prev); next.delete(msg.user!.id); return next; });
      }
    };

    const onReactionUpdated = ({ messageId, reactions }: { messageId: string; reactions: Record<string, string[]> }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, reactions: JSON.stringify(reactions) } : m)
      );
    };

    const onTypingStart = ({ userId: uid }: { userId: string }) => {
      if (uid === user?.id) return;
      setTypingUsers((prev) => new Set([...prev, uid]));
    };

    const onTypingStop = ({ userId: uid }: { userId: string }) => {
      setTypingUsers((prev) => { const next = new Set(prev); next.delete(uid); return next; });
    };

    socket.on("new-message", onNewMessage);
    socket.on("reaction-updated", onReactionUpdated);
    socket.on("typing-start", onTypingStart);
    socket.on("typing-stop", onTypingStop);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("reaction-updated", onReactionUpdated);
      socket.off("typing-start", onTypingStart);
      socket.off("typing-stop", onTypingStop);
    };
  }, [socket, user?.id]);

  const handleTyping = (val: string) => {
    setContent(val);
    sendTypingStart(projectId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTypingStop(projectId), 2000);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!token) return null;
    try {
      setUploading(true);
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) return null;
      const { uploadURL, objectURL } = await urlRes.json();
      await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      return objectURL as string;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim() && !imageFile) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    sendTypingStop(projectId);

    let imageUrl: string | undefined;
    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (!url) { toast({ title: "Image upload failed", variant: "destructive" }); return; }
      imageUrl = url;
    }

    sendMessage(projectId, content.trim() || " ", imageUrl);
    setContent("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Image too large (max 5MB)", variant: "destructive" }); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const getUserName = (msg: ChatMessage) => msg.user?.name || "Unknown";
  const mine = (msg: ChatMessage) => msg.userId === user?.id;

  return (
    <div className="flex flex-col h-[560px] border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <span className="text-3xl">💬</span>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = mine(msg);
            const reactions = parseReactions(msg.reactions);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-2 group relative ${isMe ? "flex-row-reverse" : ""}`}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {msg.user?.image ? (
                    <img src={msg.user.image} alt={getUserName(msg)} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-primary">
                      {getUserName(msg).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    {!isMe && <span className="text-xs font-medium text-foreground">{getUserName(msg)}</span>}
                    <span className="text-xs text-muted-foreground">{formatRelative(msg.createdAt)}</span>
                  </div>

                  <div className={`px-3 py-2 rounded-2xl text-sm break-words max-w-full ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {msg.message && msg.message.trim() !== "" && msg.message.trim() !== " " && <p>{msg.message}</p>}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="attachment"
                        className="mt-1 max-w-[240px] rounded-lg object-cover cursor-pointer"
                        onClick={() => window.open(msg.imageUrl!, "_blank")}
                      />
                    )}
                  </div>

                  {Object.keys(reactions).length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {Object.entries(reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(msg.id, emoji)}
                          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                            users.includes(user?.id || "")
                              ? "bg-primary/20 border-primary/30 text-primary"
                              : "bg-muted border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {emoji} <span>{users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {hoveredMsgId === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.1 }}
                        className={`flex gap-1 mt-1 bg-card border border-border rounded-full px-2 py-1 shadow-sm ${isMe ? "self-end" : "self-start"}`}
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-sm leading-none"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}

        <AnimatePresence>
          {typingUsers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 px-2"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {typingUsers.size === 1 ? "Someone is typing..." : `${typingUsers.size} people typing...`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {imagePreview && (
        <div className="px-3 pt-2 flex items-start gap-2 border-t border-border">
          <div className="relative">
            <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-border" />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="self-end flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="w-4 h-4" />
          </Button>
          <Textarea
            value={content}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none min-h-9 max-h-24"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            data-testid="input-message"
          />
          <Button
            type="button"
            size="sm"
            disabled={uploading || (!content.trim() && !imageFile)}
            className="self-end"
            onClick={handleSend}
            data-testid="button-send-message"
          >
            {uploading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
