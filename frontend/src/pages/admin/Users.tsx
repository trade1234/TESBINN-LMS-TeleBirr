import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Search, UserCircle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { ApiResponse, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | User["role"]>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const userSections = [
    {
      title: "Students",
      description: "Review active learners, enrollment counts, and learning paths.",
    },
    {
      title: "Teachers",
      description: "Ensure every instructor has the right profile, certifications, and payouts setup.",
    },
    {
      title: "Pending",
      description: "Approve or reject accounts that need verification before they go live.",
    },
  ];

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      const token = authStorage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get<ApiResponse<User[]>>("/users");
        if (!active) return;
        setUsers(response.data.data || []);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load users.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        toast({
          title: "Unable to load users",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [navigate, toast]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }
      if (!normalizedSearch) return true;
      const nameMatch = user.name.toLowerCase().includes(normalizedSearch);
      const emailMatch = user.email.toLowerCase().includes(normalizedSearch);
      return nameMatch || emailMatch;
    });
  }, [roleFilter, searchTerm, users]);

  useEffect(() => {
    if (!isDetailOpen || !selectedUserId) return;

    let active = true;

    const loadUserDetails = async () => {
      setIsDetailLoading(true);
      try {
        const response = await api.get<ApiResponse<User>>(`/users/${selectedUserId}`);
        if (!active) return;
        setSelectedUser(response.data.data);
      } catch (err: any) {
        if (!active) return;
        const status = err?.response?.status;
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to load user details.";

        if (status === 401) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }

        setSelectedUser(users.find((user) => user._id === selectedUserId) || null);
        toast({
          title: "Unable to load user details",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (active) setIsDetailLoading(false);
      }
    };

    loadUserDetails();

    return () => {
      active = false;
    };
  }, [isDetailOpen, navigate, selectedUserId, toast, users]);

  const openUserDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailOpen(true);
  };

  const closeUserDetails = () => {
    setIsDetailOpen(false);
    setSelectedUserId(null);
    setSelectedUser(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const resetAdminForm = () => {
    setAdminForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      location: "",
    });
  };

  const handleCreateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password) {
      toast({
        title: "Missing details",
        description: "Name, email, and password are required.",
        variant: "destructive",
      });
      return;
    }

    if (adminForm.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Double-check the confirmation password.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAdmin(true);
    try {
      const response = await api.post<ApiResponse<User>>("/users/admin", {
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password,
        phone: adminForm.phone.trim(),
        location: adminForm.location.trim(),
      });
      setUsers((prev) => [response.data.data, ...prev]);
      toast({
        title: "Admin created",
        description: `${response.data.data.name} now has admin access.`,
      });
      resetAdminForm();
      setIsCreateAdminOpen(false);
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to create admin.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Unable to create admin",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) return;

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Double-check the confirmation password.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await api.put<ApiResponse<User>>(`/users/${selectedUserId}/password`, {
        password: newPassword,
      });
      setSelectedUser(response.data.data);
      toast({
        title: "Password updated",
        description: "The user can now sign in with the new password.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to update password.";

      if (status === 401) {
        authStorage.clearAll();
        navigate("/login");
        return;
      }

      toast({
        title: "Unable to update password",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const userForDetails =
    selectedUser || users.find((user) => user._id === selectedUserId) || null;

  const statusBadgeClass = (status?: User["status"]) =>
    status === "active"
      ? "bg-success/10 text-success"
      : status === "pending"
        ? "bg-warning/10 text-warning"
        : "bg-destructive/10 text-destructive";

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Users</p>
            <h1 className="text-2xl font-semibold">Manage every account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Search, filter, and take bulk actions across learners and instructors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {userSections.map((section) => (
            <div
              key={section.title}
              className="glass-card rounded-xl border border-border/70 p-4 space-y-2"
            >
              <p className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {section.title}
              </p>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-5">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Quick actions
              </p>
              <h2 className="text-lg font-semibold mt-1">Actions you can take right now</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                Invite new teacher
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsCreateAdminOpen(true)}>
                Grant admin access
              </Button>
              <Button variant="outline" size="sm">
                Export user list
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/approvals">Review pending</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-border/70 p-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">All accounts</p>
              <p className="text-xs text-muted-foreground">
                Search and filter across every user profile.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search users"
                  className="pl-9 w-56"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="all">All roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : filteredUsers.length ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-2 px-4">Name</th>
                    <th className="py-2 px-4">Email</th>
                    <th className="py-2 px-4">Role</th>
                    <th className="py-2 px-4">Status</th>
                    <th className="py-2 px-4">Joined</th>
                    <th className="py-2 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-4 px-4 font-medium">{user.name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-4 px-4 capitalize">{user.role}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openUserDetails(user._id)}
                        >
                          View details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No users match your filters.</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={(open) => (open ? null : closeUserDetails())}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              User profile
            </DialogTitle>
            <DialogDescription>
              Review account details and reset the password when needed.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <p className="text-sm text-muted-foreground">Loading user details...</p>
          ) : userForDetails ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/40 p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold">{userForDetails.name}</p>
                  <p className="text-sm text-muted-foreground">{userForDetails.email}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</p>
                    <p className="text-sm capitalize">{userForDetails.role}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(
                        userForDetails.status
                      )}`}
                    >
                      {userForDetails.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Joined</p>
                    <p className="text-sm">
                      {userForDetails.createdAt
                        ? new Date(userForDetails.createdAt).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {userForDetails.phone || "Not provided"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Location:</span>{" "}
                      {userForDetails.location || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Headline</p>
                  <p className="mt-3 text-sm">
                    {userForDetails.professional?.headline || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bio</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {userForDetails.bio || "No bio on file."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Professional details
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Current role:</span>{" "}
                      {userForDetails.professional?.currentRole || "Not provided"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Company:</span>{" "}
                      {userForDetails.professional?.company || "Not provided"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Focus:</span>{" "}
                      {userForDetails.professional?.careerFocus || "Not provided"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Experience:</span>{" "}
                      {userForDetails.professional?.experienceLevel || "Not provided"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Portfolio:</span>{" "}
                      {userForDetails.professional?.portfolioUrl || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Goals & skills
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      {userForDetails.professional?.careerGoals || "No goals shared."}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Skills:</span>{" "}
                      {userForDetails.professional?.skills?.length
                        ? userForDetails.professional.skills.join(", ")
                        : "None listed"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Open to opportunities:</span>{" "}
                      {userForDetails.professional?.openToOpportunities ? "Yes" : "No"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Available to mentor:</span>{" "}
                      {userForDetails.professional?.availableForMentorship ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Notification preferences
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Enrollment updates:</span>{" "}
                      {userForDetails.preferences?.notifications?.enrollmentUpdates ? "On" : "Off"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Course updates:</span>{" "}
                      {userForDetails.preferences?.notifications?.courseUpdates ? "On" : "Off"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Admin announcements:</span>{" "}
                      {userForDetails.preferences?.notifications?.adminAnnouncements ? "On" : "Off"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Course reminders:</span>{" "}
                      {userForDetails.preferences?.notifications?.courseReminders ? "On" : "Off"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Mentor messages:</span>{" "}
                      {userForDetails.preferences?.notifications?.mentorMessages ? "On" : "Off"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Product updates:</span>{" "}
                      {userForDetails.preferences?.notifications?.productUpdates ? "On" : "Off"}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Security settings
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">MFA enabled:</span>{" "}
                      {userForDetails.security?.mfaEnabled ? "Yes" : "No"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">New device alerts:</span>{" "}
                      {userForDetails.security?.newDeviceAlerts ? "On" : "Off"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 p-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Reset password</p>
                </div>
                <form className="mt-4 space-y-4" onSubmit={handlePasswordUpdate}>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter a temporary password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter the password"
                    />
                  </div>
                  <DialogFooter className="sm:justify-start">
                    <Button type="submit" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? "Updating..." : "Update password"}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a user to view details.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateAdminOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateAdminOpen(false);
            resetAdminForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Grant admin access</DialogTitle>
            <DialogDescription>
              Create a new admin account with full platform permissions.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateAdmin}>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Full name</Label>
              <Input
                id="admin-name"
                value={adminForm.name}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Admin name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminForm.email}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-phone">Phone (optional)</Label>
              <Input
                id="admin-phone"
                value={adminForm.phone}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-location">Location (optional)</Label>
              <Input
                id="admin-location"
                value={adminForm.location}
                onChange={(event) => setAdminForm((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="City, Country"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Temporary password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminForm.password}
                  onChange={(event) => setAdminForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm">Confirm password</Label>
                <Input
                  id="admin-confirm"
                  type="password"
                  value={adminForm.confirmPassword}
                  onChange={(event) =>
                    setAdminForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsCreateAdminOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingAdmin}>
                {isCreatingAdmin ? "Creating..." : "Create admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminUsers;
