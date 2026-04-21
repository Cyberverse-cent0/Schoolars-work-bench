import { useState, useEffect } from "react";
import { ArrowLeft, Send, Search, User, MessageSquare, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { formatRelative } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Conversation {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isFromMe: boolean;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  recipient: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  isRead: boolean;
}

interface Admin {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const { data: conversations, loading: conversationsLoading, refetch: refetchConversations } = useQuery<Conversation[]>("/api/messages/conversations");
  const { data: admins, loading: adminsLoading } = useQuery<Admin[]>("/api/messages/admins");
  const { data: messages, loading: messagesLoading, refetch: refetchMessages } = useQuery<Message[]>(
    selectedConversation ? `/api/messages/conversation/${selectedConversation}` : null
  );

  // Filter conversations based on search term
  const filteredConversations = conversations?.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedConv = conversations?.find(conv => conv.id === selectedConversation);

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      await apiFetch("/api/messages/send", {
        method: "POST",
        body: JSON.stringify({
          recipientId: selectedConversation,
          content: messageInput.trim()
        })
      });
      
      setMessageInput("");
      refetchMessages();
      refetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const startConversation = (adminId: string) => {
    setSelectedConversation(adminId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (selectedConversation && messages) {
      // Mark messages as read (in a real implementation, this would be an API call)
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== user?.id);
      if (unreadMessages.length > 0) {
        refetchConversations();
      }
    }
  }, [selectedConversation, messages, user?.id, refetchConversations]);

  if (!user) {
    setLocation("/signin");
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-border bg-background">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Admins section for scholars */}
          {user.role === "SCHOLAR" && (
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Contact Administrators</h3>
              {adminsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {admins?.map((admin) => (
                    <div
                      key={admin.id}
                      onClick={() => startConversation(admin.id)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={admin.image || undefined} alt={admin.name} />
                        <AvatarFallback>{admin.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">{admin.role}</p>
                      </div>
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversations list */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {user.role === "SCHOLAR" ? "Admin Conversations" : "All Conversations"}
            </h3>
            {conversationsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {searchTerm ? "No conversations found" : "No conversations yet"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conv.id ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.image || undefined} alt={conv.name} />
                        <AvatarFallback>{conv.name[0]}</AvatarFallback>
                      </Avatar>
                      <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{conv.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatRelative(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.isFromMe ? "You: " : ""}{conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-4">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-background">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConv.image || undefined} alt={selectedConv.name} />
                  <AvatarFallback>{selectedConv.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedConv.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedConv.role}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {selectedConv.role}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.senderId === user.id ? "flex-row-reverse" : ""}`}
                  >
                    {message.senderId !== user.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender?.image || undefined} alt={message.sender?.name} />
                        <AvatarFallback>{message.sender?.name?.[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-md ${message.senderId === user.id ? "text-right" : ""}`}>
                      <p className="text-xs text-muted-foreground mb-1">
                        {message.senderId === user.id ? "You" : message.sender?.name}
                      </p>
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          message.senderId === user.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelative(message.createdAt)}
                      </p>
                    </div>
                    {message.senderId === user.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!messageInput.trim() || sendingMessage}>
                  {sendingMessage ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {user.role === "SCHOLAR" ? "Contact an Administrator" : "Select a Conversation"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user.role === "SCHOLAR" 
                  ? "Choose an administrator from the list to start a conversation"
                  : "Choose a conversation from the sidebar to start chatting"
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
