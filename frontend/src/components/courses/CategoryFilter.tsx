import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Code,
  Palette,
  TrendingUp,
  Users,
  Brain,
  Briefcase,
  Layers,
  Zap,
  Tag,
} from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  icon?: React.ElementType;
  count?: number;
}

const defaultCategories: CategoryOption[] = [
  { id: "all", name: "All Courses", icon: Layers, count: 156 },
  { id: "development", name: "Development", icon: Code, count: 45 },
  { id: "design", name: "Design", icon: Palette, count: 32 },
  { id: "marketing", name: "Marketing", icon: TrendingUp, count: 28 },
  { id: "leadership", name: "Leadership", icon: Users, count: 18 },
  { id: "ai", name: "AI & ML", icon: Brain, count: 24 },
  { id: "business", name: "Business", icon: Briefcase, count: 21 },
  { id: "productivity", name: "Productivity", icon: Zap, count: 15 },
];

interface CategoryFilterProps {
  onCategoryChange?: (category: string) => void;
  variant?: "horizontal" | "grid";
  categories?: CategoryOption[];
}

const CategoryFilter = ({
  onCategoryChange,
  variant = "horizontal",
  categories: customCategories,
}: CategoryFilterProps) => {
  const [activeCategory, setActiveCategory] = useState("all");

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  const categoriesToRender = (customCategories?.length ? customCategories : defaultCategories).map(
    (category) => ({
      ...category,
      icon: category.icon || Tag,
      count: category.count ?? 0,
    }),
  );

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {categoriesToRender.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "p-4 rounded-xl border transition-all duration-300 text-left group",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                  : "bg-card border-border hover:border-primary/50 hover:shadow-md"
              )}
            >
              <category.icon
                className={cn(
                  "h-6 w-6 mb-2 transition-colors",
                  isActive ? "text-primary-foreground" : "text-secondary group-hover:text-primary"
                )}
              />
              <p className="font-medium text-sm">{category.name}</p>
              <p
                className={cn(
                  "text-xs mt-1",
                  isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {category.count} courses
              </p>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categoriesToRender.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <Button
            key={category.id}
            variant={isActive ? "gradient" : "outline"}
            size="sm"
            className={cn(
              "whitespace-nowrap flex-shrink-0",
              !isActive && "border-muted hover:border-primary"
            )}
            onClick={() => handleCategoryClick(category.id)}
          >
            <category.icon className="h-4 w-4 mr-2" />
            {category.name}
            <span
              className={cn(
                "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                isActive ? "bg-primary-foreground/20" : "bg-muted"
              )}
            >
              {category.count}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
