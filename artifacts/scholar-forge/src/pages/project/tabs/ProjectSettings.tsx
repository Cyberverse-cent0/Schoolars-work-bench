import { useState } from "react";
import { useLocation } from "wouter";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiFetch } from "@/hooks/useApi";
import confetti from "canvas-confetti";

interface Project {
  id: string;
  title: string;
  description?: string;
  abstract?: string;
  status: string;
  visibility: string;
  tags?: string[];
}

interface Props {
  project: Project;
  onUpdate: () => void;
}

function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export function ProjectSettings({ project, onUpdate }: Props) {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    title: project.title,
    description: project.description || "",
    abstract: project.abstract || "",
    status: project.status,
    visibility: project.visibility,
    keywords: ((project as any).keywords as string[] | undefined)?.join(", ") || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const wasCompleted = project.status === "COMPLETED";
    const isNowCompleted = form.status === "COMPLETED";
    try {
      const keywords = form.keywords ? form.keywords.split(",").map((t) => t.trim()).filter(Boolean) : [];
      await apiFetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...form, keywords }),
      });
      setSuccess(true);
      onUpdate();
      if (!wasCompleted && isNowCompleted) {
        setTimeout(fireConfetti, 300);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await apiFetch(`/api/projects/${project.id}`, { method: "DELETE" });
      navigate("/projects");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Project Settings</CardTitle>
          <CardDescription>Update project information and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            {success && (
              <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-md">
                {form.status === "COMPLETED" ? "🎉 Project marked as completed!" : "Settings saved successfully!"}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Abstract</Label>
              <Textarea value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="SEEKING_COLLABORATORS">Seeking Collaborators</SelectItem>
                    <SelectItem value="COMPLETED">Completed 🎉</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Keywords (comma-separated)</Label>
              <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="neuroscience, ML, genomics" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions — proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">Delete Project</p>
              <p className="text-xs text-muted-foreground">Permanently remove this project and all its data</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
