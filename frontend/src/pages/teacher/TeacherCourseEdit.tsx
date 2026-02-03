import { ChangeEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Image, Layers, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Course } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const TeacherCourseEdit = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "development",
    price: "",
    level: "beginner",
    imageUrl: "",
  });
  const [selectedCourseImage, setSelectedCourseImage] = useState<File | null>(null);
  const [courseImageUploadKey, setCourseImageUploadKey] = useState(0);
  const [courseImageUploading, setCourseImageUploading] = useState(false);
  const [courseImageFeedback, setCourseImageFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      if (!courseId) {
        navigate("/teacher/courses");
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.get<ApiResponse<Course>>(`/courses/${courseId}`);
        if (!active) return;
        const data = res.data.data;
        setCourse(data);
        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "development",
          price: data.price ? String(data.price) : "",
          level: data.level || "beginner",
          imageUrl: data.imageUrl || "",
        });
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load course.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Load error",
          description: message,
          variant: "destructive",
        });
        navigate("/teacher/courses");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [courseId, navigate, toast]);

  const statusLabel = (courseData: Course | null) => {
    if (!courseData) return "draft";
    if (courseData.isPublished && courseData.isApproved) return "published";
    if (courseData.isPublished && !courseData.isApproved) return "pending";
    return "draft";
  };

  const handleCourseImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedCourseImage(event.target.files?.[0] || null);
    setCourseImageFeedback(null);
  };

  const uploadCourseImage = async () => {
    if (!selectedCourseImage) {
      setCourseImageFeedback("Choose a file before uploading.");
      return;
    }

    setCourseImageUploading(true);
    setCourseImageFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedCourseImage);

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

      setForm((prev) => ({ ...prev, imageUrl: url }));
      setCourseImageFeedback("Image uploaded and URL inserted.");
      setSelectedCourseImage(null);
      setCourseImageUploadKey((prev) => prev + 1);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed.";
      setCourseImageFeedback(message);
    } finally {
      setCourseImageUploading(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!courseId) return;

    if (!form.title.trim() || !form.description.trim() || !form.category) {
      toast({
        title: "Missing fields",
        description: "Please fill title, description and category.",
        variant: "destructive",
      });
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price (0 or more).",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.put<ApiResponse<Course>>(`/courses/${courseId}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price,
        level: form.level,
        imageUrl: form.imageUrl.trim() || undefined,
      });
      setCourse(res.data.data);
      toast({
        title: "Course updated",
        description: "Your changes have been saved.",
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update course.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Update error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const status = statusLabel(course);
  const statusStyles =
    status === "published"
      ? "bg-success/10 text-success border-success/20"
      : status === "pending"
      ? "bg-warning/10 text-warning border-warning/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-bold">Edit Course</h1>
              <Badge className={statusStyles}>{status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Update your course details and keep learners informed.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/teacher/courses">Back to My Courses</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            Loading course details...
          </div>
        ) : (
          <form onSubmit={handleSave} className="glass-card rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Complete React Development"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What will students learn?"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="ai">AI & ML</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, level: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                  <Input
                    key={`course-image-${courseImageUploadKey}`}
                    type="file"
                    accept="image/*"
                    onChange={handleCourseImageSelect}
                  />
                  <Button
                    variant="outline"
                    onClick={uploadCourseImage}
                    disabled={courseImageUploading}
                    type="button"
                  >
                    {courseImageUploading ? "Uploading..." : "Upload to Appwrite"}
                  </Button>
                </div>
                {courseImageFeedback && (
                  <p className="text-xs text-muted-foreground mt-1 break-words">
                    {courseImageFeedback}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="gradient" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={`/course/${courseId}`}>
                  <Image className="mr-2 h-4 w-4" />
                  Preview course
                </Link>
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/teacher/modules">
                  <Layers className="mr-2 h-4 w-4" />
                  Manage modules
                </Link>
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherCourseEdit;
