import { useState, useEffect, useRef } from "react";
import { Send, X, MessageSquare, Search, Paperclip, Smile, Phone, Video, MoreVertical, Bug, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@/hooks/useApi";
import { formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_EMOJIS = ["??:like:", "??:heart:", "??:laughing:", "??:tada:", "??:fire:", "??:clap:"];

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image?: string | null;
  };
  recipient: {
    id: string;
    name: string;
    image?: string | null;
  };
  isRead: boolean;
}

interface EnhancedMessagePanelProps {
  recipientId: string;
  recipientName: string;
  recipientImage?: string | null;
  onClose: () => void;
  isOpen: boolean;
}

export function EnhancedMessagePanel({ 
  recipientId, 
  recipientName, 
  recipientImage, 
  onClose, 
  isOpen 
}: EnhancedMessagePanelProps) {
  const { user, token } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch message history
  const { data: messages, loading, refetch } = useQuery<Message[]>(`/api/messages/conversation/${recipientId}`);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    if (!user) {
      setError("You must be logged in to send messages");
      return;
    }

    if (!token) {
      setError("Authentication token missing");
      return;
    }

    setSending(true);
    setError("");
    setConnectionStatus('sending');

    try {
      console.log("[DEBUG] Sending message:", {
        recipientId,
        content: message.trim(),
        timestamp: new Date().toISOString()
      });

      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId,
          content: message.trim(),
        }),
      });

      console.log("[DEBUG] Message send response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to send message" }));
        console.error("[ERROR] Message send failed:", err);
        setError(err.error || "Failed to send message");
        setConnectionStatus('error');
      } else {
        const result = await response.json();
        console.log("[DEBUG] Message sent successfully:", result);
        setConnectionStatus('connected');
      }

      setMessage("");
      refetch(); // Refresh messages
    } catch (err: any) {
      console.error("[ERROR] Exception in handleSendMessage:", err);
      setError(err.message || "Failed to send message");
      setConnectionStatus('error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter messages based on search
  const filteredMessages = messages?.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      <div 
        ref={panelRef}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={recipientImage || undefined} alt={recipientName} />
              <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{recipientName}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {connectionStatus === 'connected' ? 'Active now' : connectionStatus}
                </p>
                {debugMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDebugMode(!debugMode)}
                    className="ml-2"
                  >
                    <Bug className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className={`max-w-xs ${i % 2 === 0 ? 'bg-muted' : 'bg-primary text-primary-foreground'} rounded-lg p-3`}>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No messages found" : "Start a conversation"}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={msg.sender.image || undefined} alt={msg.sender.name} />
                    <AvatarFallback>{msg.sender.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={`max-w-xs ${isOwn ? 'order-first' : ''}`}>
                    <div className={`rounded-lg p-3 ${
                      isOwn 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm break-words">{msg.content}</p>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${
                      isOwn ? 'text-right' : 'text-left'
                    }`}>
                      {formatRelative(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Debug Panel */}
        {debugMode && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-blue-800">Debug Mode</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugMode(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Connection Status:</strong> {connectionStatus}</p>
              <p><strong>Messages Count:</strong> {messages?.length || 0}</p>
              <p><strong>Recipient ID:</strong> {recipientId}</p>
              <p><strong>Current User ID:</strong> {user?.id}</p>
              <p><strong>Token Present:</strong> {token ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError("")}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="sm" className="shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <Textarea
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[40px] max-h-32 resize-none"
                rows={1}
              />
            </div>
            <Button variant="ghost" size="sm" className="shrink-0">
              <Smile className="w-4 h-4" />
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={sending || !message.trim()}
              size="sm"
              className="shrink-0"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
