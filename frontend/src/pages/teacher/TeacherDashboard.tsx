import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Users, DollarSign, TrendingUp, ArrowRight, PlusCircle } from "lucide-react";
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
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressChart from "@/components/dashboard/ProgressChart";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Course } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type InstructorStats = {
  totalStudents: number;
  totalRevenue: number;
  totalReviews: number;
  averageRating: number;
};

type CoursesResponse = ApiResponse<Course[]> & { stats?: InstructorStats };

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const isCreateRoute = location.pathname === "/teacher/courses/create";

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<InstructorStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
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

      if (isCreateRoute) {
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.get<CoursesResponse>("/courses/me");
        if (!active) return;
        setCourses(res.data.data || []);
        setCourseStats(res.data.stats || null);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load teacher dashboard.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Dashboard error",
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
  }, [isCreateRoute, navigate, toast]);

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

      setCreateForm((prev) => ({ ...prev, imageUrl: url }));
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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!createForm.title.trim() || !createForm.description.trim() || !createForm.category) {
      toast({
        title: "Missing fields",
        description: "Please fill title, description and category.",
        variant: "destructive",
      });
      return;
    }

    const price = Number(createForm.price);
    if (!Number.isFinite(price) || price < 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price (0 or more).",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await api.post<ApiResponse<Course>>("/courses", {
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        category: createForm.category,
        price,
        level: createForm.level,
        imageUrl: createForm.imageUrl.trim() || undefined,
      });

      toast({
        title: "Course created",
        description: "Your course was created and is pending admin approval.",
      });

      setCreateForm({
        title: "",
        description: "",
        category: "development",
        price: "",
        level: "beginner",
        imageUrl: "",
      });
      navigate("/teacher");
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to create course.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Create course error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const stats = useMemo(() => {
    const totalStudents =
      courseStats?.totalStudents ??
      courses.reduce((sum, c) => sum + (c.totalEnrollments || 0), 0);
    const activeCourses = courses.filter((c) => c.isPublished).length;
    const draftCourses = courses.filter((c) => !c.isPublished).length;
    const totalReviews =
      courseStats?.totalReviews ??
      courses.reduce((sum, c) => sum + (c.numberOfReviews || 0), 0);
    const avgRating =
      courseStats?.averageRating ??
      (totalReviews
        ? courses.reduce((sum, c) => sum + (c.averageRating || 0) * (c.numberOfReviews || 0), 0) /
          totalReviews
        : 0);
    const totalRevenue =
      courseStats?.totalRevenue ??
      courses.reduce((sum, c) => sum + (Number(c.price || 0) * (c.totalEnrollments || 0)), 0);

    return {
      totalStudents,
      activeCourses,
      draftCourses,
      avgRating,
      totalReviews,
      totalRevenue,
    };
  }, [courses, courseStats]);

  if (isCreateRoute) {
    return (
      <DashboardLayout role="teacher">
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Create Course</h1>
              <p className="text-muted-foreground mt-1">Add your course details to submit for approval</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/teacher">Back</Link>
            </Button>
          </div>

          <form onSubmit={handleCreateCourse} className="glass-card rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={createForm.title}
                onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Complete React Development"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What will students learn?"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={createForm.category}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, category: v }))}
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
                  value={createForm.level}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, level: v }))}
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
                  value={createForm.price}
                  onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm((p) => ({ ...p, imageUrl: e.target.value }))}
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

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/teacher")}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your courses and track student progress
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/teacher/courses/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents.toLocaleString()}
            change={isLoading ? "Loading..." : "Across your courses"}
            changeType="neutral"
            icon={Users}
            iconColor="primary"
          />
          <StatsCard
            title="Active Courses"
            value={stats.activeCourses}
            change={`${stats.draftCourses} draft`}
            changeType="neutral"
            icon={BookOpen}
            iconColor="secondary"
          />
          <StatsCard
            title="Total Revenue"
            value={stats.totalRevenue ? stats.totalRevenue.toLocaleString() : "-"}
            change={courses.length ? "Across approved enrollments" : "No enrollments yet"}
            changeType="neutral"
            icon={DollarSign}
            iconColor="success"
          />
          <StatsCard
            title="Avg. Rating"
            value={stats.totalReviews ? stats.avgRating.toFixed(1) : "-"}
            change={stats.totalReviews ? "Across your courses" : "No ratings yet"}
            changeType="neutral"
            icon={TrendingUp}
            iconColor="warning"
          />
        </div>

        {/* Chart */}
        <ProgressChart />

        {/* Courses Table */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Your Courses</h2>
              <p className="text-sm text-muted-foreground">
                Manage and monitor your course performance
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/teacher/courses">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Course
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Students
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Rating
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Revenue
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const statusLabel = course.isPublished
                    ? course.isApproved
                      ? "published"
                      : "pending"
                    : "draft";

                  return (
                    <tr key={course._id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <p className="font-medium">{course.title}</p>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {(course.totalEnrollments || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        {(course.averageRating || 0) > 0 ? (
                          <span className="text-warning">★ {course.averageRating?.toFixed(1)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {(Number(course.price || 0) * (course.totalEnrollments || 0)).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusLabel === "published"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/teacher/courses/${course._id}`}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
