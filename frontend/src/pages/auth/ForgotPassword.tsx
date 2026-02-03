import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/layout/Logo";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/auth/forgotpassword", { email });
      setIsSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Unable to send reset link. Please try again.";
      toast({
        title: "Request failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Link>

          <Logo size="lg" />

          <h1 className="mt-8 text-2xl lg:text-3xl font-bold">
            Forgot your password?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email and we will send you a reset link.
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
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12"
                disabled={isLoading}
              />
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
                  Sending...
                </div>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send reset link
                </>
              )}
            </Button>
          </form>

          {isSent ? (
            <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              If you do not see the email, check your spam folder or request another
              link.
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary/20 backdrop-blur-sm">
              <Mail className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Regain Access Quickly
          </h2>
          <p className="text-primary-foreground/80">
            We will send you a secure link so you can set a new password and keep learning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
