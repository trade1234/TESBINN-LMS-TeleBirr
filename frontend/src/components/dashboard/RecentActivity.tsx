import { BookOpen, CheckCircle, PlayCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { StudentDashboardActivity } from "@/lib/types";

const fallbackActivities: StudentDashboardActivity[] = [];

const iconMap = {
  enrolled: BookOpen,
  completed: CheckCircle,
  lesson: PlayCircle,
  achievement: Award,
};

const colorMap = {
  enrolled: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  lesson: "bg-secondary/10 text-secondary",
  achievement: "bg-warning/10 text-warning",
};

interface RecentActivityProps {
  activities?: StudentDashboardActivity[];
  isLoading?: boolean;
}

const RecentActivity = ({ activities = fallbackActivities, isLoading }: RecentActivityProps) => {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading activity..." : "No recent activity yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = iconMap[activity.type];
            const timeLabel = formatRelativeTime(activity.createdAt);
            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-4 animate-fade-in",
                  index !== activities.length - 1 && "pb-4 border-b border-border"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn("p-2 rounded-lg flex-shrink-0", colorMap[activity.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {timeLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
