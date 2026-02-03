import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Megaphone, ToggleRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { Advert, ApiResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const advertStats = [
  { title: "Total adverts", key: "total" as const, icon: Megaphone },
  { title: "Active adverts", key: "active" as const, icon: ToggleRight },
] as const;

const formatDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const AdminAdverts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAdvertImage, setSelectedAdvertImage] = useState<File | null>(null);
  const [advertImageUploadKey, setAdvertImageUploadKey] = useState(0);
  const [advertImageUploading, setAdvertImageUploading] = useState(false);
  const [advertImageFeedback, setAdvertImageFeedback] = useState<string | null>(null);
  const [advertForm, setAdvertForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    ctaLabel: "",
    ctaUrl: "",
    startsAt: "",
    endsAt: "",
    order: "0",
    isActive: true,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<ApiResponse<Advert[]>>("/adverts/admin");
        if (!active) return;
        setAdverts(res.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Unable to load adverts.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Advert error",
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
    const activeCount = adverts.filter((advert) => advert.isActive).length;
    return { total: adverts.length, active: activeCount };
  }, [adverts]);

  const resetForm = () => {
    setAdvertForm({
      title: "",
      subtitle: "",
      imageUrl: "",
      ctaLabel: "",
      ctaUrl: "",
      startsAt: "",
      endsAt: "",
      order: "0",
      isActive: true,
    });
    setSelectedAdvertImage(null);
    setAdvertImageFeedback(null);
    setAdvertImageUploadKey((prev) => prev + 1);
    setEditingId(null);
  };

  const handleAdvertImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedAdvertImage(event.target.files?.[0] || null);
    setAdvertImageFeedback(null);
  };

  const uploadAdvertImage = async () => {
    if (!selectedAdvertImage) {
      setAdvertImageFeedback("Choose an image before uploading.");
      return;
    }

    setAdvertImageUploading(true);
    setAdvertImageFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedAdvertImage);

      const res = await api.post("/files/appwrite", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url =
        res.data?.data?.viewUrl ||
        res.data?.data?.downloadUrl ||
        res.data?.data?.url ||
        res.data?.data?.fileUrl;

      if (!url) {
        throw new Error("Appwrite did not return a usable URL.");
      }

      setAdvertForm((prev) => ({ ...prev, imageUrl: url }));
      setAdvertImageFeedback("Image uploaded and URL inserted.");
      setSelectedAdvertImage(null);
      setAdvertImageUploadKey((prev) => prev + 1);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed.";
      setAdvertImageFeedback(message);
    } finally {
      setAdvertImageUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!advertForm.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide an advert headline.",
        variant: "destructive",
      });
      return;
    }

    setFormSaving(true);
    const payload = {
      title: advertForm.title.trim(),
      subtitle: advertForm.subtitle.trim(),
      imageUrl: advertForm.imageUrl.trim(),
      ctaLabel: advertForm.ctaLabel.trim(),
      ctaUrl: advertForm.ctaUrl.trim(),
      startsAt: advertForm.startsAt || null,
      endsAt: advertForm.endsAt || null,
      order: advertForm.order ? Number(advertForm.order) : 0,
      isActive: advertForm.isActive,
    };

    try {
      if (editingId) {
        const res = await api.put<ApiResponse<Advert>>(`/adverts/${editingId}`, payload);
        setAdverts((prev) =>
          prev.map((advert) => (advert._id === editingId ? res.data.data : advert)),
        );
        toast({
          title: "Advert updated",
          description: res.data.data.title,
        });
      } else {
        const res = await api.post<ApiResponse<Advert>>("/adverts", payload);
        setAdverts((prev) => [...prev, res.data.data]);
        toast({
          title: "Advert created",
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
        "Unable to save advert.";

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

  const handleEdit = (advert: Advert) => {
    setEditingId(advert._id);
    setAdvertForm({
      title: advert.title || "",
      subtitle: advert.subtitle || "",
      imageUrl: advert.imageUrl || "",
      ctaLabel: advert.ctaLabel || "",
      ctaUrl: advert.ctaUrl || "",
      startsAt: formatDateInput(advert.startsAt),
      endsAt: formatDateInput(advert.endsAt),
      order: advert.order !== undefined ? String(advert.order) : "0",
      isActive: advert.isActive ?? true,
    });
    setFormOpen(true);
  };

  const handleDelete = async (advert: Advert) => {
    const confirmDelete = window.confirm(
      `Remove "${advert.title}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    setProcessingIds((prev) => [...prev, advert._id]);
    try {
      await api.delete(`/adverts/${advert._id}`);
      setAdverts((prev) => prev.filter((current) => current._id !== advert._id));
      toast({
        title: "Advert removed",
        description: advert.title,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to delete advert.";

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
      setProcessingIds((prev) => prev.filter((id) => id !== advert._id));
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Adverts</p>
            <h1 className="text-2xl font-semibold">Promote offers on the landing page</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Keep the Adverts & Promotions section fresh with timely campaigns.
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
          {advertStats.map((stat) => (
            <StatsCard
              key={stat.title}
              title={stat.title}
              value={stats[stat.key]}
              change="Managed by admin"
              icon={stat.icon}
            />
          ))}
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit advert" : "Advert manager"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Add offers, CTA links, and schedule visibility windows.
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
                {formOpen ? "Hide form" : "Add advert"}
              </Button>
            </div>
          </div>

          {formOpen && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="advert-title">Headline</Label>
                  <Input
                    id="advert-title"
                    value={advertForm.title}
                    onChange={(event) =>
                      setAdvertForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="e.g., New cohort starts next week"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advert-image">Image URL</Label>
                  <Input
                    id="advert-image"
                    value={advertForm.imageUrl}
                    onChange={(event) =>
                      setAdvertForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                    <Input
                      key={`advert-image-${advertImageUploadKey}`}
                      type="file"
                      accept="image/*"
                      onChange={handleAdvertImageSelect}
                    />
                    <Button
                      variant="outline"
                      onClick={uploadAdvertImage}
                      disabled={advertImageUploading}
                    >
                      {advertImageUploading ? "Uploading..." : "Upload to Appwrite"}
                    </Button>
                  </div>
                  {advertImageFeedback && (
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      {advertImageFeedback}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advert-subtitle">Subtitle</Label>
                <Textarea
                  id="advert-subtitle"
                  value={advertForm.subtitle}
                  onChange={(event) =>
                    setAdvertForm((prev) => ({ ...prev, subtitle: event.target.value }))
                  }
                  placeholder="Short supporting copy"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="advert-cta-label">CTA label</Label>
                  <Input
                    id="advert-cta-label"
                    value={advertForm.ctaLabel}
                    onChange={(event) =>
                      setAdvertForm((prev) => ({ ...prev, ctaLabel: event.target.value }))
                    }
                    placeholder="Register now"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advert-cta-url">CTA URL</Label>
                  <Input
                    id="advert-cta-url"
                    value={advertForm.ctaUrl}
                    onChange={(event) =>
                      setAdvertForm((prev) => ({ ...prev, ctaUrl: event.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="advert-start">Start date</Label>
                  <Input
                    id="advert-start"
                    type="date"
                    value={advertForm.startsAt}
                    onChange={(event) =>
                      setAdvertForm((prev) => ({ ...prev, startsAt: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advert-end">End date</Label>
                  <Input
                    id="advert-end"
                    type="date"
                    value={advertForm.endsAt}
                    onChange={(event) =>
                      setAdvertForm((prev) => ({ ...prev, endsAt: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advert-order">Display order</Label>
                  <Input
                    id="advert-order"
                    type="number"
                    value={advertForm.order}
                    onChange={(event) =>
                      setAdvertForm((prev) => ({ ...prev, order: event.target.value }))
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={advertForm.isActive}
                    onCheckedChange={(checked) =>
                      setAdvertForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {advertForm.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" disabled={formSaving}>
                    {formSaving ? "Saving..." : editingId ? "Update advert" : "Add advert"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Existing adverts</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading adverts...</p>
            ) : adverts.length ? (
              <div className="space-y-3">
                {adverts.map((advert) => (
                  <div
                    key={advert._id}
                    className="rounded-xl border border-border/70 bg-background/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{advert.title}</p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              advert.isActive
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {advert.isActive ? "Active" : "Hidden"}
                          </span>
                        </div>
                        {advert.subtitle && (
                          <p className="text-xs text-muted-foreground">{advert.subtitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Order: {advert.order ?? 0}
                        </p>
                        {(advert.startsAt || advert.endsAt) && (
                          <p className="text-xs text-muted-foreground">
                            Active window: {formatDateInput(advert.startsAt) || "Anytime"}{" "}
                            - {formatDateInput(advert.endsAt) || "No end"}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingIds.includes(advert._id)}
                          onClick={() => handleEdit(advert)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={processingIds.includes(advert._id)}
                          onClick={() => handleDelete(advert)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No adverts yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAdverts;
