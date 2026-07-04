import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingDown, TrendingUp, Minus, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface PredictionData {
  predictedNextWeek: number;
  trend: string;
  tip: string;
  weeklyData: { date: string; co2: number }[];
  currentWeek: number;
}

export const WeeklyMiniChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPrediction = async () => {
      try {
        const { data: result, error } = await supabase.functions.invoke('greenbrain', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (error) throw error;
        setData(result);
      } catch (error) {
        console.error("Error fetching prediction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-40 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  if (!data) return null;

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-red-400" />,
    down: <TrendingDown className="w-4 h-4 text-green-400" />,
    neutral: <Minus className="w-4 h-4 text-yellow-400" />,
  }[data.trend];

  const trendColor = {
    up: "text-red-400",
    down: "text-green-400",
    neutral: "text-yellow-400",
  }[data.trend];

  // Add prediction to chart data
  const chartData = [
    ...data.weeklyData,
    { date: "Next Week", co2: data.predictedNextWeek, isPrediction: true }
  ];

  return (
    <Card className="p-6 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 opacity-30 blur-3xl"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">GreenBrain Prediction</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">This Week</p>
            <p className="text-2xl font-bold">{Math.round(data.currentWeek)}g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Predicted</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{Math.round(data.predictedNextWeek)}g</p>
              {trendIcon}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px"
              }}
              formatter={(value: number, name: string, props: any) => [
                `${Math.round(value)}g CO₂`,
                props.payload.isPrediction ? "Predicted" : "Actual"
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="co2" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fill="url(#colorCo2)"
            />
          </AreaChart>
        </ResponsiveContainer>

        <motion.div
          className="mt-4 p-3 rounded-lg bg-card/50 backdrop-blur-sm border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className={`text-sm font-medium ${trendColor} flex items-center gap-2`}>
            {trendIcon}
            {data.tip}
          </p>
        </motion.div>
      </div>
    </Card>
  );
};
