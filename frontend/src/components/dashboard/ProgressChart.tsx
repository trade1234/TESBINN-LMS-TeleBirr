import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { StudentDashboardProgressPoint } from "@/lib/types";

const fallbackData: StudentDashboardProgressPoint[] = [];

interface ProgressChartProps {
  data?: StudentDashboardProgressPoint[];
}

const ProgressChart = ({ data = fallbackData }: ProgressChartProps) => {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg">Weekly Progress</h3>
          <p className="text-sm text-muted-foreground">Lessons completed this week</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-muted-foreground">Hours</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLessons" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(222, 47%, 20%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(222, 47%, 20%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 62%, 47%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 62%, 47%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="lessons"
              stroke="hsl(222, 47%, 20%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLessons)"
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="hsl(174, 62%, 47%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHours)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
