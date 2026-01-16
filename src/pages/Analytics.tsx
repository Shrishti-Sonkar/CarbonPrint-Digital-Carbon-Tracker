import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingDown, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ImpactCard } from "@/components/ImpactCard";
import { CarbonIntensity } from "@/components/CarbonIntensity";

interface WeeklyData {
  week_start: string;
  data_used_mb: number;
  co2_emitted_grams: number;
}

interface ActivityBreakdown {
  name: string;
  value: number;
}

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyData[]>([]);
  const [activityBreakdown, setActivityBreakdown] = useState<ActivityBreakdown[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch weekly history
      const { data: historyData } = await supabase
        .from('weekly_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('week_start', { ascending: true })
        .limit(8);

      if (historyData) {
        setWeeklyHistory(historyData);
      }

      // Fetch activity breakdown
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('activity_type, co2_grams')
        .eq('user_id', user!.id);

      if (activitiesData) {
        const breakdown = activitiesData.reduce((acc: any, activity) => {
          const type = activity.activity_type;
          if (!acc[type]) {
            acc[type] = 0;
          }
          acc[type] += activity.co2_grams;
          return acc;
        }, {});

        const breakdownArray = Object.entries(breakdown).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: Number(value)
        }));

        setActivityBreakdown(breakdownArray);
      }

      // Fetch badges
      const { data: badgesData } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', user!.id)
        .order('earned_at', { ascending: false });

      if (badgesData) {
        setBadges(badgesData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))'];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-eco text-4xl mb-4">🌿</div>
          <p className="text-muted-foreground">Loading your eco stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2">Your Eco Stats 📊</h1>
          <p className="text-muted-foreground">
            Detailed insights into your digital carbon footprint
          </p>
        </div>

        {/* Weekly Trend Chart */}
        <Card className="mb-8 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" />
              Weekly CO₂ Emissions Trend
            </CardTitle>
            <CardDescription>Your carbon emissions over the past weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="week_start" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    labelFormatter={(value) => `Week of ${new Date(value).toLocaleDateString()}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="co2_emitted_grams" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="CO₂ (grams)"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No historical data yet</p>
                <p className="text-sm">Start tracking activities to see your trends</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Impact & Grid Intensity Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {weeklyHistory.length > 0 && (
            <ImpactCard 
              co2Grams={weeklyHistory.reduce((sum, week) => sum + week.co2_emitted_grams, 0)} 
              title="Your Total Impact"
            />
          )}
          <CarbonIntensity />
        </div>

        {/* Activity Breakdown */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Activity Breakdown</CardTitle>
              <CardDescription>CO₂ emissions by activity type</CardDescription>
            </CardHeader>
            <CardContent>
              {activityBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={activityBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No activity data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badges Section */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Your Badges
              </CardTitle>
              <CardDescription>Achievements you've earned</CardDescription>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="space-y-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="text-2xl">{badge.badge_icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{badge.badge_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(badge.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No badges earned yet</p>
                  <p className="text-sm">Keep tracking to unlock achievements!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
