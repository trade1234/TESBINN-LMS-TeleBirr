import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Schedule } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const formatDateInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatScheduleDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const AdminSchedules = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    startDate: "",
    startTime: "",
    durationLabel: "",
    instructor: "",
    mode: "online",
    location: "",
    notes: "",
    ctaLabel: "",
    ctaUrl: "",
    order: "0",
    isActive: true,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<ApiResponse<Schedule[]>>("/schedules/admin");
        if (!active) return;
        setSchedules(res.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Unable to load schedules.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Schedule error",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [navigate, toast]);

  const stats = useMemo(() => {
    const activeCount = schedules.filter((schedule) => schedule.isActive).length;
    return { total: schedules.length, active: activeCount };
  }, [schedules]);

  const resetForm = () => {
    setScheduleForm({
      title: "",
      startDate: "",
      startTime: "",
      durationLabel: "",
      instructor: "",
      mode: "online",
      location: "",
      notes: "",
      ctaLabel: "",
      ctaUrl: "",
      order: "0",
      isActive: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!scheduleForm.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a schedule title.",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleForm.startDate) {
      toast({
        title: "Missing start date",
        description: "Please select a start date.",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleForm.durationLabel.trim()) {
      toast({
        title: "Missing duration",
        description: "Please add a duration label.",
        variant: "destructive",
      });
      return;
    }

    setFormSaving(true);
    const payload = {
      title: scheduleForm.title.trim(),
      startDate: scheduleForm.startDate,
      startTime: scheduleForm.startTime.trim(),
      durationLabel: scheduleForm.durationLabel.trim(),
      instructor: scheduleForm.instructor.trim(),
      mode: scheduleForm.mode,
      location: scheduleForm.location.trim(),
      notes: scheduleForm.notes.trim(),
      ctaLabel: scheduleForm.ctaLabel.trim(),
      ctaUrl: scheduleForm.ctaUrl.trim(),
      order: scheduleForm.order ? Number(scheduleForm.order) : 0,
      isActive: scheduleForm.isActive,
    };

    try {
      if (editingId) {
        const res = await api.put<ApiResponse<Schedule>>(`/schedules/${editingId}`, payload);
        setSchedules((prev) =>
          prev.map((schedule) => (schedule._id === editingId ? res.data.data : schedule)),
        );
        toast({
          title: "Schedule updated",
          description: res.data.data.title,
        });
      } else {
        const res = await api.post<ApiResponse<Schedule>>("/schedules", payload);
        setSchedules((prev) => [...prev, res.data.data]);
        toast({
          title: "Schedule created",
          description: res.data.data.title,
        });
      }
      resetForm();
      setFormOpen(false);
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to save schedule.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setFormSaving(false);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingId(schedule._id);
    setScheduleForm({
      title: schedule.title || "",
      startDate: formatDateInput(schedule.startDate),
      startTime: schedule.startTime || "",
      durationLabel: schedule.durationLabel || "",
      instructor: schedule.instructor || "",
      mode: schedule.mode || "online",
      location: schedule.location || "",
      notes: schedule.notes || "",
      ctaLabel: schedule.ctaLabel || "",
      ctaUrl: schedule.ctaUrl || "",
      order: schedule.order !== undefined ? String(schedule.order) : "0",
      isActive: schedule.isActive ?? true,
    });
    setFormOpen(true);
  };

  const handleDelete = async (schedule: Schedule) => {
    const confirmDelete = window.confirm(
      `Remove "${schedule.title}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    setProcessingIds((prev) => [...prev, schedule._id]);
    try {
      await api.delete(`/schedules/${schedule._id}`);
      setSchedules((prev) => prev.filter((current) => current._id !== schedule._id));
      toast({
        title: "Schedule removed",
        description: schedule.title,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to delete schedule.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== schedule._id));
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Schedules</p>
            <h1 className="text-2xl font-semibold">Class schedule manager</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add cohorts, update dates, and keep the public schedule accurate.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl border border-border/70 p-4">
            <p className="text-xs text-muted-foreground">Total schedules</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="glass-card rounded-xl border border-border/70 p-4">
            <p className="text-xs text-muted-foreground">Active schedules</p>
            <p className="text-2xl font-semibold">{stats.active}</p>
          </div>
          <div className="glass-card rounded-xl border border-border/70 p-4">
            <p className="text-xs text-muted-foreground">Next start</p>
            <p className="text-2xl font-semibold">
              {schedules[0]?.startDate ? formatScheduleDate(schedules[0].startDate) : "-"}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit schedule" : "Schedule manager"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Control what appears on the public schedule table.
              </p>
            </div>
            <div className="flex gap-2">
              {editingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setFormOpen(false);
                  }}
                >
                  Cancel edit
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormOpen((prev) => !prev)}
              >
                {formOpen ? "Hide form" : "Add schedule"}
              </Button>
            </div>
          </div>

          {formOpen && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-title">Course title</Label>
                  <Input
                    id="schedule-title"
                    value={scheduleForm.title}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="e.g., Digital Marketing Bootcamp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-start">Start date</Label>
                  <Input
                    id="schedule-start"
                    type="date"
                    value={scheduleForm.startDate}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="schedule-duration">Duration</Label>
                  <Input
                    id="schedule-duration"
                    value={scheduleForm.durationLabel}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, durationLabel: event.target.value }))
                    }
                    placeholder="e.g., 2 Days"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Start time</Label>
                  <Input
                    id="schedule-time"
                    value={scheduleForm.startTime}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                    placeholder="e.g., 10:00 AM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select
                    value={scheduleForm.mode}
                    onValueChange={(value) =>
                      setScheduleForm((prev) => ({ ...prev, mode: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="in-person">In person</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-location">Location (optional)</Label>
                  <Input
                    id="schedule-location"
                    value={scheduleForm.location}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    placeholder="Add a city or campus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-instructor">Instructor (optional)</Label>
                  <Input
                    id="schedule-instructor"
                    value={scheduleForm.instructor}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, instructor: event.target.value }))
                    }
                    placeholder="Instructor name"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-notes">Notes (optional)</Label>
                  <Textarea
                    id="schedule-notes"
                    value={scheduleForm.notes}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    placeholder="Enrollment notes or reminders"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-cta-label">CTA label (optional)</Label>
                  <Input
                    id="schedule-cta-label"
                    value={scheduleForm.ctaLabel}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, ctaLabel: event.target.value }))
                    }
                    placeholder="Enroll now"
                  />
                  <div className="mt-3 space-y-2">
                    <Label htmlFor="schedule-cta-url">CTA URL (optional)</Label>
                    <Input
                      id="schedule-cta-url"
                      value={scheduleForm.ctaUrl}
                      onChange={(event) =>
                        setScheduleForm((prev) => ({ ...prev, ctaUrl: event.target.value }))
                      }
                      placeholder="https://"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schedule-order">Display order</Label>
                  <Input
                    id="schedule-order"
                    type="number"
                    min="0"
                    value={scheduleForm.order}
                    onChange={(event) =>
                      setScheduleForm((prev) => ({ ...prev, order: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={scheduleForm.isActive}
                    onCheckedChange={(checked) =>
                      setScheduleForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {scheduleForm.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" disabled={formSaving}>
                    {formSaving ? "Saving..." : editingId ? "Update schedule" : "Add schedule"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                    Clear
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Upcoming schedules</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading schedules...</p>
            ) : schedules.length ? (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule._id}
                    className="rounded-xl border border-border/70 bg-background/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{schedule.title}</p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              schedule.isActive
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {schedule.isActive ? "Active" : "Hidden"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Start: {formatScheduleDate(schedule.startDate)} | {schedule.durationLabel}
                        </p>
                        {(schedule.startTime || schedule.instructor) && (
                          <p className="text-xs text-muted-foreground">
                            {schedule.startTime ? `Time: ${schedule.startTime}` : ""}{" "}
                            {schedule.instructor ? `• Instructor: ${schedule.instructor}` : ""}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Mode: {schedule.mode} {schedule.location ? `• ${schedule.location}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingIds.includes(schedule._id)}
                          onClick={() => handleEdit(schedule)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={processingIds.includes(schedule._id)}
                          onClick={() => handleDelete(schedule)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No schedules yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSchedules;
