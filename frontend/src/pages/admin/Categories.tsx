import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FolderOpen, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Category } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const categoryStats = [
  { title: "Total categories", key: "total" as const, icon: FolderOpen },
  { title: "With description", key: "described" as const, icon: Tag },
] as const;

const AdminCategories = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<ApiResponse<Category[]>>("/categories");
        if (!active) return;
        setCategories(res.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Unable to load categories.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Category error",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [navigate, toast]);

  const stats = useMemo(() => {
    const described = categories.filter((category) => !!category.description).length;
    return {
      total: categories.length,
      described,
    };
  }, [categories]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      toast({
        title: "Missing name",
        description: "Please provide a category name.",
        variant: "destructive",
      });
      return;
    }

    setFormSaving(true);
    try {
      const res = await api.post<ApiResponse<Category>>("/categories", {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      });
      setCategories((prev) => [...prev, res.data.data]);
      setCategoryForm({ name: "", description: "" });
      toast({
        title: "Category created",
        description: `"${res.data.data.name}" is now available.`,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to create category.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Create failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setFormSaving(false);
    }
  };

  const handleUpdate = async (category: Category) => {
    const name = window.prompt("Update category name", category.name);
    if (name === null || !name.trim()) return;

    const description = window.prompt(
      "Update description (optional)",
      category.description || "",
    );
    if (description === null) return;

    setProcessingIds((prev) => [...prev, category._id]);
    try {
      const res = await api.put<ApiResponse<Category>>(`/categories/${category._id}`, {
        name: name.trim(),
        description: description.trim(),
      });
      setCategories((prev) =>
        prev.map((current) => (current._id === category._id ? res.data.data : current)),
      );
      toast({
        title: "Category updated",
        description: res.data.data.name,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to update category.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== category._id));
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmDelete = window.confirm(
      `Remove ${category.name}? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    setProcessingIds((prev) => [...prev, category._id]);
    try {
      await api.delete(`/categories/${category._id}`);
      setCategories((prev) => prev.filter((current) => current._id !== category._id));
      toast({
        title: "Category removed",
        description: category.name,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to delete category.";

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
      setProcessingIds((prev) => prev.filter((id) => id !== category._id));
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Categories</p>
            <h1 className="text-2xl font-semibold">Curate the catalog</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Group courses into collections that make sense for learners.
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
          {categoryStats.map((stat) => (
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
              <h2 className="text-lg font-semibold">Category manager</h2>
              <p className="text-xs text-muted-foreground">
                Add new categories or edit existing ones that instructors can assign.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFormOpen((prev) => !prev)}>
              {formOpen ? "Hide form" : "Add categories"}
            </Button>
          </div>

          {formOpen && (
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-[1fr,1fr,auto] items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g., Product Management"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <Input
                  id="category-description"
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Optional summary"
                />
              </div>
              <div className="flex items-center justify-end">
                <Button type="submit" size="sm" disabled={formSaving}>
                  {formSaving ? "Saving..." : "Add category"}
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Existing categories</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading categories…</p>
            ) : categories.length ? (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="rounded-xl border border-border/70 bg-background/50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Slug: {category.slug || "—"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingIds.includes(category._id)}
                          onClick={() => handleUpdate(category)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={processingIds.includes(category._id)}
                          onClick={() => handleDelete(category)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCategories;
