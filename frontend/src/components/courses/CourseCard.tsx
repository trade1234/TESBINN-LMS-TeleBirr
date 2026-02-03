import { Link } from "react-router-dom";
import { Clock, Users, Star, BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  category: string;
  duration: string;
  students: number;
  rating: number;
  lessons: number;
  price?: number;
  progress?: number;
  enrolled?: boolean;
  variant?: "default" | "compact" | "featured";
  ctaHref?: string;
  ctaLabel?: string;
  ctaDisabled?: boolean;
}

const CourseCard = ({
  id,
  title,
  description,
  thumbnail,
  instructor,
  category,
  duration,
  students,
  rating,
  lessons,
  price,
  progress,
  enrolled = false,
  variant = "default",
  ctaHref,
  ctaLabel,
  ctaDisabled = false,
}: CourseCardProps) => {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const priceLabel =
    typeof price === "number" && Number.isFinite(price)
      ? price > 0
        ? price.toLocaleString()
        : "Free"
      : "Free";

  return (
        <div
          className={cn(
            "group glass-card rounded-xl overflow-hidden card-hover",
            isFeatured && "md:flex md:flex-row"
          )}
        >
      {/* Thumbnail */}
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            isFeatured ? "md:w-2/5 aspect-video md:aspect-auto" : "aspect-video",
            isCompact && "aspect-[4/3]"
          )}
        >
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button variant="hero" size="icon-lg" className="rounded-full">
            <Play className="h-6 w-6" />
          </Button>
        </div>
        <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground">
          {category}
        </Badge>
        {enrolled && progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/80 to-transparent">
            <div className="flex items-center justify-between text-primary-foreground text-sm mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("p-5", isFeatured && "md:flex-1 md:p-6")}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-warning fill-warning" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">{instructor}</span>
        </div>

        <h3 className={cn(
          "font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors",
          isFeatured ? "text-xl lg:text-2xl" : "text-lg"
        )}>
          {title}
        </h3>

        {!isCompact && (
          <p className={cn(
            "text-muted-foreground mb-4 line-clamp-2",
            isFeatured && "lg:line-clamp-3"
          )}>
            {description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>{lessons} lessons</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{students.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Price</span>
            <span className="font-medium text-foreground">{priceLabel}</span>
          </div>
        </div>

        {ctaDisabled ? (
          <Button variant="secondary" className="w-full" disabled>
            {ctaLabel || "Pending approval"}
          </Button>
        ) : (
          <Button
            variant={enrolled ? "secondary" : "gradient"}
            className="w-full"
            asChild
          >
            <Link to={ctaHref || `/course/${id}`}>
              {ctaLabel || (enrolled ? "Continue Learning" : "Enroll Now")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
