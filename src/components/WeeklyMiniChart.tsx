import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getImpactComparison } from "@/lib/impactComparisons";

interface WeeklyData {
  week_start: string;
  co2_emitted_grams: number;
  data_used_mb: number;
}

export const WeeklyMiniChart = () => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [lastWeek, setLastWeek] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchWeeklyData();
    }
  }, [user]);

  const fetchWeeklyData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weekly_history')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(4);

      if (error) throw error;

      if (data && data.length > 0) {
        setWeeklyData(data);
        setCurrentWeek(data[0]?.co2_emitted_grams || 0);
        setLastWeek(data[1]?.co2_emitted_grams || 0);
      }
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    }
  };

  const percentageChange = lastWeek > 0 
    ? (((currentWeek - lastWeek) / lastWeek) * 100).toFixed(1)
    : 0;
  const isReduction = currentWeek < lastWeek;

  const maxValue = Math.max(...weeklyData.map(w => w.co2_emitted_grams), 1);
  const totalCo2 = weeklyData.reduce((sum, week) => sum + week.co2_emitted_grams, 0);
  const impact = totalCo2 > 0 ? getImpactComparison(totalCo2) : null;

  if (!user) return null;

  return (
    <section className="py-8 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto max-w-6xl">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isReduction ? (
                <TrendingDown className="w-5 h-5 text-primary" />
              ) : (
                <TrendingUp className="w-5 h-5 text-destructive" />
              )}
              Your Weekly CO₂ Trend
            </CardTitle>
            <CardDescription>Last 4 weeks of carbon emissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">This Week</div>
                  <div className="text-2xl font-bold text-primary">{currentWeek.toFixed(1)}g</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">vs Last Week</div>
                  <div className={`text-2xl font-bold ${isReduction ? 'text-primary' : 'text-destructive'}`}>
                    {isReduction ? '↓' : '↑'} {Math.abs(Number(percentageChange))}%
                  </div>
                </div>
              </div>

              {/* Real-World Impact */}
              {impact && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-sm text-muted-foreground mb-1">Total Impact (4 weeks)</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{impact.emoji}</span>
                    <div>
                      <div className="font-bold text-foreground">{(totalCo2 / 1000).toFixed(3)} kg CO₂</div>
                      <div className="text-sm text-muted-foreground">{impact.description}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mini Bar Chart */}
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyData.slice(0, 4).reverse().map((week, index) => {
                  const height = (week.co2_emitted_grams / maxValue) * 100;
                  const weekDate = new Date(week.week_start);
                  const label = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-secondary rounded-t-lg overflow-hidden relative" style={{ height: '100%' }}>
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-accent rounded-t-lg transition-all duration-500"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-center">{label}</div>
                      <div className="text-xs font-bold text-foreground">{week.co2_emitted_grams.toFixed(1)}g</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
