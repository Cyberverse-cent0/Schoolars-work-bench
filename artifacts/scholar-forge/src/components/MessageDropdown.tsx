import { useState, useRef, useEffect } from "react";
import { Mail, Send, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

interface MessageDropdownProps {
  recipientName: string;
  recipientId: string;
  onClose: () => void;
}

export function MessageDropdown({ recipientName, recipientId, onClose }: MessageDropdownProps) {
  const { user, token } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    if (!user) {
      setError("You must be logged in to send messages");
      return;
    }

    setSending(true);
    setError("");

    try {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      setSuccess(true);
      setMessage("");
      
      // Close dropdown after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-80 bg-background border border-border rounded-lg shadow-lg z-50 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Send Message to {recipientName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded mb-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-xs text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-2 rounded mb-3">
          Message sent successfully!
        </div>
      )}

      {/* Message Input */}
      <div className="space-y-3">
        <Textarea
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          disabled={sending}
          className="resize-none text-sm"
        />
        
        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={sending}
            className="text-xs h-7"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={sending || !message.trim()}
            className="text-xs h-7"
          >
            <Send className="w-3 h-3 mr-1" />
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
