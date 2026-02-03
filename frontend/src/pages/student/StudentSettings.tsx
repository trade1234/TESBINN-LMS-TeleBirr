import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Briefcase, ShieldCheck, Sparkles, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import type { MeResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const StudentSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const buildFormState = (data?: MeResponse["data"]) => ({
    name: data?.name || "",
    email: data?.email || "",
    bio: data?.bio || "",
    phone: data?.phone || "",
    location: data?.location || "",
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
        courseReminders: data?.preferences?.notifications?.courseReminders ?? true,
        mentorMessages: data?.preferences?.notifications?.mentorMessages ?? true,
        productUpdates: data?.preferences?.notifications?.productUpdates ?? false,
      },
      learning: {
        weeklyStudyGoalHours: data?.preferences?.learning?.weeklyStudyGoalHours ?? 5,
        personalizedSuggestions: data?.preferences?.learning?.personalizedSuggestions ?? true,
        weeklyProgressReport: data?.preferences?.learning?.weeklyProgressReport ?? true,
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
        const res = await api.get<MeResponse>("/auth/me");
        if (!active) return;
        const data = res.data.data;
        setProfile(data);
        setProfileForm(buildFormState(data));
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load profile.";

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

  const displayName = profile?.name || "Student Name";
  const avatarInitials = useMemo(() => {
    return (displayName || "Student")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  const professionalStatus = profile?.bio ? "Profile ready" : "Needs attention";

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
        description: "Your profile and preferences have been saved.",
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

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
            <h1 className="text-2xl lg:text-3xl font-bold">Student Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update your profile, professional presence, and learning preferences.
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="glass-card rounded-2xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Profile information</h2>
                </div>
                <Badge variant={profile?.bio ? "secondary" : "outline"}>{professionalStatus}</Badge>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.profileImage || ""} alt={displayName} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email || "student@example.com"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Change photo
                  </Button>
                  <Button variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="student-name">Full name</Label>
                  <Input
                    id="student-name"
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email address</Label>
                  <Input
                    id="student-email"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-phone">Phone</Label>
                  <Input
                    id="student-phone"
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder="+1 555 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-location">Location</Label>
                  <Input
                    id="student-location"
                    value={profileForm.location}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, location: event.target.value }))
                    }
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-bio">Short bio</Label>
                <Textarea
                  id="student-bio"
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
                  }
                  placeholder="Tell instructors what you are currently working on."
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-success" />
                  <h2 className="text-lg font-semibold">Professional settings</h2>
                </div>
                <Badge variant="secondary">Professional profile</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Curate the professional details that appear on your learner profile and in course cohorts.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="headline">Professional headline</Label>
                  <Input
                    id="headline"
                    value={profileForm.professional.headline}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        professional: { ...prev.professional, headline: event.target.value },
                      }))
                    }
                    placeholder="Aspiring product designer focused on fintech"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current-role">Current role</Label>
                  <Input
                    id="current-role"
                    value={profileForm.professional.currentRole}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        professional: { ...prev.professional, currentRole: event.target.value },
                      }))
                    }
                    placeholder="UX Designer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company or school</Label>
                  <Input
                    id="company"
                    value={profileForm.professional.company}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        professional: { ...prev.professional, company: event.target.value },
                      }))
                    }
                    placeholder="Tesbinn Labs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Career focus</Label>
                  <Select
                    value={profileForm.professional.careerFocus}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        professional: { ...prev.professional, careerFocus: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a focus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="ai">AI & ML</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experience level</Label>
                  <Select
                    value={profileForm.professional.experienceLevel}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        professional: { ...prev.professional, experienceLevel: value },
                      }))
                    }
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
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio or LinkedIn</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    value={profileForm.professional.portfolioUrl}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        professional: { ...prev.professional, portfolioUrl: event.target.value },
                      }))
                    }
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="career-goals">Career goals</Label>
                <Textarea
                  id="career-goals"
                  value={profileForm.professional.careerGoals}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      professional: { ...prev.professional, careerGoals: event.target.value },
                    }))
                  }
                  placeholder="Share what you want to accomplish in the next 6-12 months."
                />
              </div>

              <div className="space-y-3">
                <Label>Top skills</Label>
                <div className="flex flex-wrap gap-2">
                  {profileForm.professional.skills.length ? (
                    profileForm.professional.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">No skills added yet</Badge>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    placeholder="Add a skill"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddSkill}>
                    Add skill
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                  <div>
                    <p className="font-medium">Open to opportunities</p>
                    <p className="text-sm text-muted-foreground">
                      Let instructors know you are open to internships or projects.
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
                    <p className="font-medium">Available for mentorship</p>
                    <p className="text-sm text-muted-foreground">
                      Opt-in to mentor peers who share your career focus.
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
                <ShieldCheck className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-semibold">Account security</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Protect your account and keep your login safe.
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

            <div className="glass-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Control how you hear about course updates and coaching.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Course reminders</p>
                    <p className="text-sm text-muted-foreground">Weekly nudges to stay on track.</p>
                  </div>
                  <Switch
                    checked={profileForm.preferences.notifications.courseReminders}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: {
                            ...prev.preferences.notifications,
                            courseReminders: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mentor messages</p>
                    <p className="text-sm text-muted-foreground">Get notified when mentors respond.</p>
                  </div>
                  <Switch
                    checked={profileForm.preferences.notifications.mentorMessages}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: {
                            ...prev.preferences.notifications,
                            mentorMessages: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Product updates</p>
                    <p className="text-sm text-muted-foreground">Occasional news from Tesbinn.</p>
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
                <Sparkles className="h-5 w-5 text-success" />
                <h2 className="text-lg font-semibold">Learning preferences</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Customize your learning pace and feedback.
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Weekly study goal</Label>
                  <Select
                    value={String(profileForm.preferences.learning.weeklyStudyGoalHours)}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          learning: {
                            ...prev.preferences.learning,
                            weeklyStudyGoalHours: Number(value),
                          },
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose hours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="5">5 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Personalized suggestions</p>
                    <p className="text-sm text-muted-foreground">Recommend courses based on goals.</p>
                  </div>
                  <Switch
                    checked={profileForm.preferences.learning.personalizedSuggestions}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          learning: {
                            ...prev.preferences.learning,
                            personalizedSuggestions: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly progress report</p>
                    <p className="text-sm text-muted-foreground">Email a summary every Friday.</p>
                  </div>
                  <Switch
                    checked={profileForm.preferences.learning.weeklyProgressReport}
                    onCheckedChange={(checked) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          learning: {
                            ...prev.preferences.learning,
                            weeklyProgressReport: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentSettings;
