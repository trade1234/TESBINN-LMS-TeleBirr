import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/layout/Logo";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import type { LoginResponse } from "@/lib/types";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLocked = lockedUntil !== null && now < lockedUntil;
  const secondsRemaining = isLocked ? Math.max(Math.ceil((lockedUntil - now) / 1000), 0) : 0;

  useEffect(() => {
    if (!isLocked) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLocked]);

  const formatSeconds = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleAuthSuccess = (response: LoginResponse) => {
    setWarningMessage("");
    setFailedAttempts(0);
    setLockedUntil(null);
    authStorage.setToken(response.token);
    authStorage.setRole(response.role);

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });

    if (response.role === "admin") {
      navigate("/admin");
    } else if (response.role === "teacher") {
      navigate("/teacher");
    } else {
      navigate("/student");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      const msg = `Too many attempts. Try again in ${formatSeconds(secondsRemaining)}.`;
      setWarningMessage(msg);
      toast({
        title: "Login temporarily locked",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      handleAuthSuccess(res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      const headers = err?.response?.headers || {};
      const remainingHeader = headers["x-ratelimit-remaining"];
      const limitHeader = headers["x-ratelimit-limit"];
      const retryAfterHeader = headers["retry-after"];
      const remaining = Number.parseInt(String(remainingHeader ?? ""), 10);
      const limit = Number.parseInt(String(limitHeader ?? ""), 10);
      const retryAfter = Number.parseInt(String(retryAfterHeader ?? ""), 10);
      const maxAttempts = Number.isFinite(limit) && limit > 0 ? limit : 10;

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";

      if (status === 429) {
        const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 15 * 60;
        setLockedUntil(Date.now() + waitSeconds * 1000);
        setNow(Date.now());
        setFailedAttempts(maxAttempts);
        setWarningMessage(
          `Too many login attempts. Please wait ${Math.ceil(waitSeconds / 60)} minutes before trying again.`
        );
      } else if (status === 401 && Number.isFinite(remaining) && remaining > 0) {
        setFailedAttempts(maxAttempts - remaining);
        setWarningMessage(
          `Warning: ${remaining} login attempt${remaining === 1 ? "" : "s"} remaining out of ${maxAttempts} before temporary lockout.`
        );
      } else if (status === 401) {
        setFailedAttempts((prev) => {
          const next = Math.min(prev + 1, maxAttempts);
          const fallbackRemaining = Math.max(maxAttempts - next, 0);
          if (fallbackRemaining > 0) {
            setWarningMessage(
              `Warning: ${fallbackRemaining} login attempt${fallbackRemaining === 1 ? "" : "s"} remaining out of ${maxAttempts} before temporary lockout.`
            );
          } else {
            setWarningMessage("Login failed. Please check your credentials.");
          }
          return next;
        });
      } else if (status !== 401) {
        setWarningMessage("");
      }

      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
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
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to continue your learning journey
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading || isLocked}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : isLocked ? (
                <>Try again in {formatSeconds(secondsRemaining)}</>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            {warningMessage ? (
              <p className="text-sm text-amber-600">{warningMessage}</p>
            ) : null}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleAuthButton mode="login" onSuccess={handleAuthSuccess} />
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex lg:flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary/20 backdrop-blur-sm">
              <LogIn className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Continue Your Journey
          </h2>
          <p className="text-primary-foreground/80">
            Pick up where you left off. Your courses, progress, and achievements are waiting for you.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {["500+", "50K+", "98%"].map((value, index) => (
              <div
                key={value}
                className="p-4 rounded-xl text-primary-foreground/90 backdrop-blur-sm"
                style={{ backgroundColor: "hsl(24, 95%, 50%)" }}
              >
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-primary-foreground/70">
                  {index === 0 ? "Courses" : index === 1 ? "Learners" : "Success"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
