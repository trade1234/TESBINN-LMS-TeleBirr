import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PlusCircle } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, BlogPost } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const emptyForm = {
  title: "",
  slug: "",
  category: "",
  status: "draft" as const,
  excerpt: "",
  content: "",
  coverImage: "",
};

const AdminBlog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<ApiResponse<BlogPost[]>>("/blog/admin");
        if (!active) return;
        setPosts(res.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load blog posts.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSelect = (post: BlogPost) => {
    setSelected(post);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      category: post.category || "",
      status: post.status === "published" ? "published" : "draft",
      excerpt: post.excerpt || "",
      content: post.content || "",
      coverImage: post.coverImage || "",
    });
  };

  const handleReset = () => {
    setSelected(null);
    setForm({ ...emptyForm });
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!form.title.trim()) {
      toast({ title: "Title required", description: "Add a title before saving.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (selected) {
        const res = await api.put<ApiResponse<BlogPost>>(`/blog/${selected._id}`, form);
        setPosts((prev) =>
          prev.map((item) => (item._id === selected._id ? res.data.data : item)),
        );
        setSelected(res.data.data);
        toast({ title: "Post updated", description: "Your changes are saved." });
      } else {
        const res = await api.post<ApiResponse<BlogPost>>("/blog", form);
        setPosts((prev) => [res.data.data, ...prev]);
        setSelected(res.data.data);
        toast({ title: "Post created", description: "The post is ready for review." });
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to save blog post.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({ title: "Save error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (file?: File | null) => {
    if (!file) return;
    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<ApiResponse<{ viewUrl?: string }>>("/files/appwrite", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const viewUrl = res.data.data?.viewUrl;
      if (!viewUrl) {
        toast({
          title: "Upload failed",
          description: "No image URL was returned from storage.",
          variant: "destructive",
        });
        return;
      }
      setForm((prev) => ({ ...prev, coverImage: viewUrl }));
      toast({ title: "Cover uploaded", description: "Image URL added to the post." });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to upload image.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({ title: "Upload error", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.status === "published").length;
    const drafts = posts.length - published;
    return { published, drafts };
  }, [posts]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Blog</p>
            <h1 className="text-2xl font-semibold">Manage blog posts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create, publish, and update stories for TESBINN.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New post
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Posts</h2>
              <p className="text-xs text-muted-foreground">
                {stats.published} published • {stats.drafts} drafts
              </p>
            </div>
            <div className="glass-card rounded-xl border border-border/70 p-4 space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading posts...</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : posts.length ? (
                posts.map((post) => (
                  <button
                    key={post._id}
                    onClick={() => handleSelect(post)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selected?._id === post._id
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.category || "Uncategorized"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          post.status === "published"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No posts yet. Create the first one.</p>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl border border-border/70 p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{selected ? "Edit post" : "Create post"}</h2>
              <p className="text-xs text-muted-foreground">
                {selected ? "Update the selected post details." : "Draft a new post and publish it when ready."}
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  value={form.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(event) => handleChange("slug", event.target.value)}
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <Input
                    value={form.category}
                    onChange={(event) => handleChange("category", event.target.value)}
                    placeholder="Learning"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.status}
                    onChange={(event) => handleChange("status", event.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Excerpt</label>
                <Textarea
                  value={form.excerpt}
                  onChange={(event) => handleChange("excerpt", event.target.value)}
                  placeholder="Short summary for the blog listing."
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <Textarea
                  value={form.content}
                  onChange={(event) => handleChange("content", event.target.value)}
                  placeholder="Write the full article here."
                  rows={8}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cover image URL</label>
                <Input
                  value={form.coverImage}
                  onChange={(event) => handleChange("coverImage", event.target.value)}
                  placeholder="https://"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleCoverUpload(event.target.files?.[0])}
                    className="text-xs text-muted-foreground"
                  />
                  {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
                </div>
                {form.coverImage && (
                  <img
                    src={form.coverImage}
                    alt="Cover preview"
                    className="mt-2 h-24 w-full rounded-lg object-cover"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                Clear
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : selected ? "Update post" : "Create post"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminBlog;
