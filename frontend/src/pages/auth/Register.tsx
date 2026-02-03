import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, ArrowLeft, GraduationCap, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/layout/Logo";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { LoginResponse } from "@/lib/types";

type UserRole = "student" | "teacher";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!agreeTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload: {
        name: string;
        email: string;
        password: string;
        role: UserRole;
        phone?: string;
      } = {
        name,
        email,
        password,
        role,
      };

      if (role === "student" && phone.trim()) {
        payload.phone = phone.trim();
      }

      const res = await api.post<LoginResponse>("/auth/register", payload);

      if (role === "teacher") {
        // Teacher accounts require admin approval; don't keep token locally.
        authStorage.clearAll();
        toast({
          title: "Account created!",
          description: "Your teacher account is pending approval from TESBINN admin.",
        });
        navigate("/login");
        return;
      }

      authStorage.setToken(res.data.token);
      authStorage.setRole(res.data.role);

      toast({
        title: "Account created!",
        description: "Welcome to TESBINN! Start exploring courses.",
      });
      navigate("/student");
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Registration failed. Please try again.";

      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary">
              <UserPlus className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Join TESBINN Today
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Start your learning journey with access to hundreds of expert-led courses and a supportive community.
          </p>

          <div className="space-y-4 text-left text-primary-foreground">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 text-left">
              <div className="p-2 rounded-lg bg-secondary/20">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Expert-Led Courses</p>
                <p className="text-sm text-primary/70">Learn from industry professionals</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 text-left">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Community Support</p>
                <p className="text-sm text-primary/70">Connect with fellow learners</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 text-left">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Certified Programs</p>
                <p className="text-sm text-primary/70">Earn recognized certifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 overflow-y-auto">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <Logo size="lg" />

          <h1 className="mt-8 text-2xl lg:text-3xl font-bold">
            Create your account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join thousands of learners on TESBINN
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                role === "student"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <GraduationCap className={cn(
                "h-6 w-6 mb-2",
                role === "student" ? "text-primary" : "text-muted-foreground"
              )} />
              <p className="font-medium">Student</p>
              <p className="text-xs text-muted-foreground">Learn and grow</p>
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                role === "teacher"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Users className={cn(
                "h-6 w-6 mb-2",
                role === "teacher" ? "text-primary" : "text-muted-foreground"
              )} />
              <p className="font-medium">Teacher</p>
              <p className="text-xs text-muted-foreground">Share your knowledge</p>
            </button>
          </div>

          {role === "teacher" && (
            <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/30">
              <p className="text-sm text-warning-foreground">
                <strong>Note:</strong> Teacher accounts require approval from TESBINN admin before you can create courses.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            {role === "student" && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12"
                  autoComplete="tel"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
