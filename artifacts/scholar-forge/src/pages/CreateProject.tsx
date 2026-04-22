import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiFetch } from "@/hooks/useApi";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { PROJECT_TEMPLATES, applyProjectTemplate, type ProjectTemplate } from "@/lib/projectTemplates";

export default function CreateProject() {
  const [, navigate] = useLocation();
  const [form, setForm] = useLocalStorage('project-draft', {
    title: "",
    description: "",
    status: "PLANNING",
    visibility: "PRIVATE",
    keywords: "",
    abstract: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (form.title || form.description || form.abstract || form.keywords) {
      setLastSaved(new Date());
    }
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const keywords = form.keywords ? form.keywords.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const data = await apiFetch<{ id: string }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ ...form, keywords }),
      });
      
      // Clear draft on successful submission
      setForm({
        title: "",
        description: "",
        status: "PLANNING",
        visibility: "PRIVATE",
        keywords: "",
        abstract: "",
      });
      
      navigate(`/projects/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearDraft = () => {
    setForm({
      title: "",
      description: "",
      status: "PLANNING",
      visibility: "PRIVATE",
      keywords: "",
      abstract: "",
    });
    setLastSaved(null);
  };

  const applyTemplate = (template: ProjectTemplate) => {
    const templateData = applyProjectTemplate(template);
    setForm(templateData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      {/* Project Templates */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Start with a Template</CardTitle>
          <CardDescription>Choose a template to pre-fill common project structures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PROJECT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="p-3 border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onClick={() => applyTemplate(template)}
              >
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif">Create New Project</CardTitle>
              <CardDescription>Set up a new collaborative research project</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <div className="text-xs text-muted-foreground">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
              {(form.title || form.description || form.abstract || form.keywords) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearDraft}
                  className="text-xs"
                >
                  Clear Draft
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title">Project Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Neural Pathways in Memory Consolidation"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                data-testid="input-project-title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief overview of this research project..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                data-testid="input-project-description"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                placeholder="Detailed research abstract..."
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                rows={4}
                data-testid="input-project-abstract"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="select-project-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger data-testid="select-project-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="keywords">Keywords <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input
                id="keywords"
                placeholder="neuroscience, machine-learning, biology"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                data-testid="input-project-keywords"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} data-testid="button-submit-create-project">
                {loading ? "Creating..." : "Create Project"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/projects")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
