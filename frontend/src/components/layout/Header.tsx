import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, UserPlus, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { authStorage, AUTH_CHANGE_EVENT, type AuthRole } from "@/lib/auth";
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Trainings" },
  { href: "/schedule", label: "Class Schedule" },
  { href: "/videos", label: "Free Videos" },
  { href: "/support", label: "Help & Support" },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(authStorage.getToken()));
  const [role, setRole] = useState<AuthRole | null>(() => authStorage.getRole());
  const location = useLocation();
  const isTransparent = location.pathname === "/";

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleAuthChange = () => {
      setIsLoggedIn(Boolean(authStorage.getToken()));
      setRole(authStorage.getRole());
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  const dashboardPath =
    role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";
  const coursesPath =
    role === "admin"
      ? "/admin/courses"
      : role === "teacher"
      ? "/teacher/courses"
      : "/student/courses";
  const settingsPath =
    role === "admin"
      ? "/admin/settings"
      : role === "teacher"
      ? "/teacher/settings"
      : "/student/settings";
  const handleLogout = () => {
    authStorage.clearAll();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-nav-footer shadow-md">
      <div className="container-wide section-padding">
        <nav className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <Logo variant="light" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors",
                  location.pathname === link.href && "text-primary-foreground font-medium"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border border-primary-foreground/20 p-2 text-primary-foreground transition-colors hover:border-primary-foreground"
                    aria-label="Open profile menu"
                  >
                    <UserCircle2 className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link to={dashboardPath}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={coursesPath}>My Courses</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={settingsPath}>Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant={isTransparent ? "hero-outline" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button
                  variant={isTransparent ? "hero" : "gradient"}
                  size="sm"
                  asChild
                >
                  <Link to="/register">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "lg:hidden",
              isTransparent && "text-[hsl(24,95%,45%)] hover:bg-primary-foreground/10"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg animate-slide-down">
            <div className="section-padding py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "block py-2 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors",
                    location.pathname === link.href && "text-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-border flex flex-col gap-3">
              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-foreground hover:border-primary/70 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to={coursesPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-foreground hover:border-primary/70 transition-colors"
                  >
                    My Courses
                  </Link>
                  <Link
                    to={settingsPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-foreground hover:border-primary/70 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-foreground hover:border-primary/70 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                  <Button variant="gradient" asChild className="w-full">
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
