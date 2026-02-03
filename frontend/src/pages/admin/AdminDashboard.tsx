import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  UserCheck,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  FolderOpen,
  BarChart3,
  Settings,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressChart from "@/components/dashboard/ProgressChart";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Course, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pendingTeachers, setPendingTeachers] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [approvingTeacherId, setApprovingTeacherId] = useState<string | null>(null);
  const [approvingCourseId, setApprovingCourseId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      try {
        const [pendingTeachersRes, usersRes, pendingCoursesRes, coursesRes] = await Promise.all([
          api.get<ApiResponse<User[]>>("/users", { params: { role: "teacher", status: "pending" } }),
          api.get<ApiResponse<User[]>>("/users"),
          api.get<ApiResponse<Course[]>>("/courses/pending"),
          api.get<ApiResponse<Course[]>>("/courses/admin/all"),
        ]);

        if (!active) return;
        setPendingTeachers(pendingTeachersRes.data.data || []);
        setRecentUsers((usersRes.data.data || []).slice(0, 6));
        setPendingCourses(pendingCoursesRes.data.data || []);
        setAllCourses(coursesRes.data.data || []);
        setTotalUsers(
          typeof usersRes.data.count === "number"
            ? usersRes.data.count
            : (usersRes.data.data || []).length
        );
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load admin dashboard.";

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
  }, [navigate, toast]);

const adminQuickLinks = [
  {
    label: "Users",
    description: "Monitor learners, instructors, and invite new members.",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Teacher Approvals",
    description: "Review credentials and activate instructors.",
    href: "/admin/approvals",
    icon: UserCheck,
  },
  {
    label: "Courses",
    description: "Approve, edit, or archive catalog items.",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    label: "Categories",
    description: "Organize learning paths and navigation.",
    href: "/admin/categories",
    icon: FolderOpen,
  },
  {
    label: "Adverts",
    description: "Manage landing page promos and announcements.",
    href: "/admin/adverts",
    icon: Megaphone,
  },
  {
    label: "Analytics",
    description: "Check platform health, trends, and goals.",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    description: "Adjust platform defaults and security controls.",
    href: "/admin/settings",
    icon: Settings,
  },
];

  const stats = useMemo(() => {
    const pendingTeachersCount = pendingTeachers.length;
    const pendingCoursesCount = pendingCourses.length;
    const activeCourses = allCourses.filter((course) => course.isPublished && course.isApproved).length;
    const platformRevenue = allCourses.reduce(
      (sum, course) => sum + Number(course.price || 0) * (course.totalEnrollments || 0),
      0
    );

    return {
      totalUsers,
      pendingTeachersCount,
      pendingCoursesCount,
      activeCourses,
      platformRevenue,
    };
  }, [allCourses, pendingCourses.length, pendingTeachers.length, totalUsers]);

  const handleApproveTeacher = async (teacherId: string) => {
    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setApprovingTeacherId(teacherId);
    try {
      await api.put<ApiResponse<User>>(`/users/${teacherId}/approve-teacher`);
      setPendingTeachers((prev) => prev.filter((t) => t._id !== teacherId));
      toast({ title: "Teacher approved", description: "The teacher account is now active." });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to approve teacher.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({ title: "Approve error", description: message, variant: "destructive" });
    } finally {
      setApprovingTeacherId(null);
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setApprovingCourseId(courseId);
    try {
      await api.put<ApiResponse<Course>>(`/courses/${courseId}/approve`);
      setPendingCourses((prev) => prev.filter((c) => c._id !== courseId));
      toast({ title: "Course approved", description: "The course is now published." });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to approve course.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({ title: "Approve error", description: message, variant: "destructive" });
    } finally {
      setApprovingCourseId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage the TESBINN platform
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/admin/analytics">
                View Analytics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link to="/admin/approvals">
                <AlertCircle className="mr-2 h-4 w-4" />
                Pending Approvals ({pendingTeachers.length + pendingCourses.length})
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={isLoading ? "..." : stats.totalUsers.toLocaleString()}
            change={"Loaded from API"}
            changeType="neutral"
            icon={Users}
            iconColor="primary"
          />
          <StatsCard
            title="Active Courses"
            value={isLoading ? "..." : stats.activeCourses.toLocaleString()}
            change={"Published & approved"}
            changeType="neutral"
            icon={BookOpen}
            iconColor="secondary"
          />
          <StatsCard
            title="Pending Teachers"
            value={pendingTeachers.length}
            change="Requires attention"
            changeType="neutral"
            icon={UserCheck}
            iconColor="warning"
          />
          <StatsCard
            title="Platform Revenue"
            value={stats.platformRevenue ? stats.platformRevenue.toLocaleString() : "-"}
            change={allCourses.length ? "Across approved enrollments" : "No enrollments yet"}
            changeType="neutral"
            icon={TrendingUp}
            iconColor="success"
          />
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Admin quick links</p>
              <p className="text-xs text-muted-foreground">
                Jump to the most-used admin pages for fast navigation.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Open</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {adminQuickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="glass-card flex h-full flex-col gap-3 rounded-xl border border-border/70 p-5 transition hover:shadow-xl"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <link.icon className="h-4 w-4 text-muted-foreground" />
                  {link.label}
                </div>
                <p className="text-sm text-muted-foreground">{link.description}</p>
                <div className="mt-auto flex items-center justify-between text-xs uppercase tracking-[0.3em] text-primary">
                  <span>Open</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts and Pending Approvals */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProgressChart />
          </div>

          {/* Pending Teacher Approvals */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Pending Approvals</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/approvals">View All</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {pendingTeachers.slice(0, 3).map((teacher) => (
                <div
                  key={teacher._id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={teacher.profileImage || ""} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {teacher.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Status: {teacher.status}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-success hover:text-success hover:bg-success/10"
                      onClick={() => handleApproveTeacher(teacher._id)}
                      disabled={approvingTeacherId === teacher._id}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {pendingCourses.slice(0, 2).map((course) => (
                <div
                  key={course._id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Course pending approval
                      {course.teacher?.name ? ` • ${course.teacher.name}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-success hover:text-success hover:bg-success/10"
                      onClick={() => handleApproveCourse(course._id)}
                      disabled={approvingCourseId === course._id}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Recent Users</h2>
              <p className="text-sm text-muted-foreground">
                Latest user registrations
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/admin/users">
                Manage Users
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Joined
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user._id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "teacher"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
