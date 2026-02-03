import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, Clipboard, ShieldCheck, Sparkles, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import StatsCard from "@/components/dashboard/StatsCard";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, Course, MeResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type InstructorStats = {
  totalStudents: number;
  totalRevenue: number;
  totalReviews: number;
  averageRating: number;
};

type CoursesResponse = ApiResponse<Course[]> & { stats?: InstructorStats };

const TeacherSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const buildFormState = (data?: MeResponse["data"]) => ({
    name: data?.name || "",
    email: data?.email || "",
    bio: data?.bio || "",
    phone: data?.phone || "",
    location: data?.location || "",
    profileImage: data?.profileImage || "",
    professional: {
      headline: data?.professional?.headline || "",
      currentRole: data?.professional?.currentRole || "",
      company: data?.professional?.company || "",
      careerFocus: data?.professional?.careerFocus || "development",
      experienceLevel: data?.professional?.experienceLevel || "intermediate",
      portfolioUrl: data?.professional?.portfolioUrl || "",
      careerGoals: data?.professional?.careerGoals || "",
      skills: data?.professional?.skills || [],
      openToOpportunities: data?.professional?.openToOpportunities ?? false,
      availableForMentorship: data?.professional?.availableForMentorship ?? false,
    },
    preferences: {
      notifications: {
        enrollmentUpdates: data?.preferences?.notifications?.enrollmentUpdates ?? true,
        courseUpdates: data?.preferences?.notifications?.courseUpdates ?? true,
        adminAnnouncements: data?.preferences?.notifications?.adminAnnouncements ?? true,
        productUpdates: data?.preferences?.notifications?.productUpdates ?? false,
      },
    },
    security: {
      mfaEnabled: data?.security?.mfaEnabled ?? false,
      newDeviceAlerts: data?.security?.newDeviceAlerts ?? true,
    },
  });

  const [profile, setProfile] = useState<MeResponse["data"] | null>(null);
  const [profileForm, setProfileForm] = useState(buildFormState());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<InstructorStats | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUploadKey, setImageUploadKey] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageFeedback, setImageFeedback] = useState<string | null>(null);

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
        const [profileRes, coursesRes] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<CoursesResponse>("/courses/me"),
        ]);
        if (!active) return;
        const data = profileRes.data.data;
        setProfile(data);
        setProfileForm(buildFormState(data));
        setCourses(coursesRes.data.data || []);
        setCourseStats(coursesRes.data.stats || null);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load teacher settings.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Settings error",
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

  const displayName = profile?.name || "Instructor";
  const avatarInitials = useMemo(() => {
    return (displayName || "Instructor")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  const stats = useMemo(() => {
    const totalStudents =
      courseStats?.totalStudents ??
      courses.reduce((sum, c) => sum + (c.totalEnrollments || 0), 0);
    const activeCourses = courses.filter((c) => c.isPublished && c.isApproved).length;
    const pendingCourses = courses.filter((c) => !c.isApproved).length;
    const totalRevenue =
      courseStats?.totalRevenue ??
      courses.reduce((sum, c) => sum + Number(c.price || 0) * (c.totalEnrollments || 0), 0);

    return {
      totalStudents,
      activeCourses,
      pendingCourses,
      totalRevenue,
    };
  }, [courses, courseStats]);

  const completionScore = useMemo(() => {
    const checkpoints = [
      profileForm.name,
      profileForm.email,
      profileForm.bio,
      profileForm.location,
      profileForm.profileImage,
      profileForm.professional.headline,
      profileForm.professional.currentRole,
      profileForm.professional.company,
      profileForm.professional.portfolioUrl,
      profileForm.professional.skills.length ? "skills" : "",
    ];

    const completed = checkpoints.filter((item) => Boolean(item && String(item).trim())).length;
    return Math.round((completed / checkpoints.length) * 100);
  }, [profileForm]);

  const handleSave = async () => {
    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        bio: profileForm.bio.trim(),
        phone: profileForm.phone.trim(),
        location: profileForm.location.trim(),
        profileImage: profileForm.profileImage.trim(),
        professional: {
          headline: profileForm.professional.headline.trim(),
          currentRole: profileForm.professional.currentRole.trim(),
          company: profileForm.professional.company.trim(),
          careerFocus: profileForm.professional.careerFocus,
          experienceLevel: profileForm.professional.experienceLevel,
          portfolioUrl: profileForm.professional.portfolioUrl.trim(),
          careerGoals: profileForm.professional.careerGoals.trim(),
          skills: profileForm.professional.skills,
          openToOpportunities: profileForm.professional.openToOpportunities,
          availableForMentorship: profileForm.professional.availableForMentorship,
        },
        preferences: profileForm.preferences,
        security: profileForm.security,
      };

      const res = await api.put<MeResponse>("/auth/settings", payload);
      setProfile(res.data.data);
      setProfileForm(buildFormState(res.data.data));
      toast({
        title: "Settings updated",
        description: "Your instructor profile has been saved.",
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to save settings.";

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
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setProfileForm(buildFormState(profile || undefined));
    setSkillInput("");
    setImageFeedback(null);
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    setProfileForm((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: Array.from(new Set([...prev.professional.skills, trimmed])),
      },
    }));
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileForm((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        skills: prev.professional.skills.filter((item) => item !== skill),
      },
    }));
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profileForm.email);
      toast({ title: "Email copied", description: profileForm.email });
    } catch {
      toast({ title: "Copy failed", description: "Unable to access clipboard.", variant: "destructive" });
    }
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedImage(event.target.files?.[0] || null);
    setImageFeedback(null);
  };

  const uploadProfileImage = async () => {
    if (!selectedImage) {
      setImageFeedback("Choose a file before uploading.");
      return;
    }

    setImageUploading(true);
    setImageFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

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

      setProfileForm((prev) => ({ ...prev, profileImage: url }));
      setImageFeedback("Profile photo updated.");
      setSelectedImage(null);
      setImageUploadKey((prev) => prev + 1);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed.";
      setImageFeedback(message);
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
            <h1 className="text-2xl lg:text-3xl font-bold">Teacher Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Keep your instructor profile polished and your notifications tuned.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button variant="gradient" disabled={isSaving || isLoading} onClick={handleSave}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Active courses"
            value={stats.activeCourses}
            change="Published and approved"
            icon={Sparkles}
            iconColor="success"
          />
          <StatsCard
            title="Pending approvals"
            value={stats.pendingCourses}
            change="Awaiting review"
            icon={Briefcase}
            iconColor="warning"
          />
          <StatsCard
            title="Total students"
            value={stats.totalStudents.toLocaleString()}
            change="Across your courses"
            icon={User}
            iconColor="primary"
          />
          <StatsCard
            title="Revenue"
            value={stats.totalRevenue ? stats.totalRevenue.toLocaleString() : "-"}
            change="Approved enrollments"
            icon={Bell}
            iconColor="secondary"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="glass-card rounded-2xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Profile information</h2>
                </div>
                <Badge variant={completionScore >= 70 ? "secondary" : "outline"}>
                  {completionScore}% complete
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="career-goals">Teaching goals</Label>
                <Textarea
                  id="career-goals"
                  value={profileForm.professional.careerGoals}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      professional: { ...prev.professional, careerGoals: event.target.value },
                    }))
                  }
                  placeholder="Share the outcomes you want learners to reach this term."
                />
              </div>

              <div className="space-y-3">
                <Label>Expertise tags</Label>
                <div className="flex flex-wrap gap-2">
                  {profileForm.professional.skills.length ? (
                    profileForm.professional.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveSkill(skill)}
                        title="Click to remove"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">No expertise tags yet</Badge>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    placeholder="Add a subject"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddSkill}>
                    Add tag
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: click a tag to remove it.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                  <div>
                    <p className="font-medium">Open to partnerships</p>
                    <p className="text-sm text-muted-foreground">
                      Let TESBINN know you want to co-teach or host workshops.
                    </p>
                  </div>
                  <Switch
                    checked={profileForm.professional.openToOpportunities}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        professional: { ...prev.professional, openToOpportunities: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                  <div>
                    <p className="font-medium">Mentor new instructors</p>
                    <p className="text-sm text-muted-foreground">
                      Opt-in to help emerging teachers refine their course plans.
                    </p>
                  </div>
                  <Switch
                    checked={profileForm.professional.availableForMentorship}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        professional: { ...prev.professional, availableForMentorship: checked },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Instructor readiness</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete your profile to improve course approval and enrollment trust.
              </p>
              <Progress value={completionScore} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completionScore}% complete</span>
                <span>{completionScore >= 80 ? "Looking great!" : "Needs a few updates"}</span>
              </div>
              <div className="grid gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/teacher/courses/create")}>
                  Create a new course
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/courses")}>
                  Review my courses
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Control how you hear about enrollments, approvals, and platform updates.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enrollment updates</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a student requests access.
                    </p>
                  </div>
                  <Switch
                    checked={profileForm.preferences.notifications.enrollmentUpdates}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: {
                            ...prev.preferences.notifications,
                            enrollmentUpdates: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Course approvals</p>
                    <p className="text-sm text-muted-foreground">
                      Stay on top of course review decisions.
                    </p>
                  </div>
                  <Switch
                    checked={profileForm.preferences.notifications.courseUpdates}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: {
                            ...prev.preferences.notifications,
                            courseUpdates: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Admin announcements</p>
                    <p className="text-sm text-muted-foreground">
                      Receive broadcast updates from the TESBINN team.
                    </p>
                  </div>
                  <Switch
                    checked={profileForm.preferences.notifications.adminAnnouncements}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: {
                            ...prev.preferences.notifications,
                            adminAnnouncements: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Product updates</p>
                    <p className="text-sm text-muted-foreground">
                      Occasional notes about new teaching tools.
                    </p>
                  </div>
                  <Switch
                    checked={profileForm.preferences.notifications.productUpdates}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: {
                            ...prev.preferences.notifications,
                            productUpdates: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-semibold">Account security</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Protect your instructor account and watch for suspicious logins.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Multi-factor authentication</p>
                    <p className="text-sm text-muted-foreground">Require a code on new devices.</p>
                  </div>
                  <Switch
                    checked={profileForm.security.mfaEnabled}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        security: { ...prev.security, mfaEnabled: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New device alerts</p>
                    <p className="text-sm text-muted-foreground">Email me when a new device signs in.</p>
                  </div>
                  <Switch
                    checked={profileForm.security.newDeviceAlerts}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        security: { ...prev.security, newDeviceAlerts: checked },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Reset password</Button>
                <Button variant="ghost" size="sm">Manage devices</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherSettings;
