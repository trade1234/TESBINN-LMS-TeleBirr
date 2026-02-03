import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ variant = "auto", size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const colorClasses = {
    light: "text-primary-foreground",
    dark: "text-foreground",
    auto: "text-foreground",
  };

  const iconBgClasses = {
    light: "bg-accent",
    dark: "bg-primary",
    auto: "bg-primary",
  };

  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className={`${iconBgClasses[variant]} rounded-lg p-1.5 flex items-center justify-center`}>
        <BookOpen className={`${sizeClasses[size]} ${variant === "light" ? "text-accent-foreground" : "text-primary-foreground"}`} />
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} ${colorClasses[variant]} tracking-tight`}>
          TESBINN
        </span>
      )}
    </Link>
  );
};

export default Logo;