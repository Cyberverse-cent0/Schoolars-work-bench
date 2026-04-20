import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextValue {
  socket: Socket | null;
  onlineUsers: Set<string>;
  isConnected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  sendTypingStart: (projectId: string) => void;
  sendTypingStop: (projectId: string) => void;
  sendMessage: (projectId: string, message: string, imageUrl?: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  onlineUsers: new Set(),
  isConnected: false,
  joinProject: () => {},
  leaveProject: () => {},
  sendTypingStart: () => {},
  sendTypingStop: () => {},
  sendMessage: () => {},
  addReaction: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !token) return;

    const apiBase = import.meta.env.VITE_API_URL || "";
    const socket = io(apiBase, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("user-online", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on("user-offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token]);

  const joinProject = useCallback((projectId: string) => {
    socketRef.current?.emit("join-project", projectId);
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    socketRef.current?.emit("leave-project", projectId);
  }, []);

  const sendTypingStart = useCallback((projectId: string) => {
    socketRef.current?.emit("typing-start", { projectId });
  }, []);

  const sendTypingStop = useCallback((projectId: string) => {
    socketRef.current?.emit("typing-stop", { projectId });
  }, []);

  const sendMessage = useCallback((projectId: string, message: string, imageUrl?: string) => {
    socketRef.current?.emit("send-message", { projectId, message, imageUrl });
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    socketRef.current?.emit("add-reaction", { messageId, emoji });
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      onlineUsers,
      isConnected,
      joinProject,
      leaveProject,
      sendTypingStart,
      sendTypingStop,
      sendMessage,
      addReaction,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
