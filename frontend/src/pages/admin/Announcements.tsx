import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { Announcement, ApiResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const formatDate = (value?: string | null) => {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";
  return date.toLocaleDateString();
};

const AdminAnnouncements = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "all",
    expiresAt: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiResponse<Announcement[]>>("/announcements");
        if (!active) return;
        setAnnouncements(res.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Unable to load announcements.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Announcement error",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [navigate, toast]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast({
        title: "Missing details",
        description: "Title and message are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      const res = await api.post<ApiResponse<Announcement>>("/announcements", payload);
      setAnnouncements((prev) => [res.data.data, ...prev]);
      setForm({ title: "", message: "", audience: "all", expiresAt: "" });
      toast({
        title: "Announcement published",
        description: res.data.data.title,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to publish announcement.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Publish failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Announcements</p>
            <h1 className="text-2xl font-semibold">Broadcast platform updates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Share admin announcements with specific audiences and expiry windows.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Announcement composer</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFormOpen((prev) => !prev)}>
              {formOpen ? "Hide form" : "New announcement"}
            </Button>
          </div>

          {formOpen && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Scheduled maintenance tonight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-message">Message</Label>
                <Textarea
                  id="announcement-message"
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Share the details the audience should know."
                  rows={4}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select
                    value={form.audience}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, audience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announcement-expiry">Expiry date (optional)</Label>
                  <Input
                    id="announcement-expiry"
                    type="date"
                    value={form.expiresAt}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, expiresAt: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Publishing..." : "Publish announcement"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-5 space-y-3">
          <h3 className="text-lg font-semibold">Recent announcements</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading announcements...</p>
          ) : announcements.length ? (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{announcement.title}</p>
                    <span className="text-xs text-muted-foreground">
                      Audience: {announcement.audience}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.message}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Expires: {formatDate(announcement.expiresAt)}</span>
                    <span>
                      Posted:{" "}
                      {announcement.createdAt
                        ? new Date(announcement.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnnouncements;
