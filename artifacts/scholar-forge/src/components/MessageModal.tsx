import { useState } from "react";
import { Mail, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientId: string;
}

export function MessageModal({ isOpen, onClose, recipientName, recipientId }: MessageModalProps) {
  const { user, token } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
      
      // Close modal after success
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

  const handleClose = () => {
    setMessage("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Message to {recipientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-md">
              Message sent successfully!
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={sending}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={sending}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={sending || !message.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
