import { useEffect, useState } from "react";
import { Trophy, Medal, Award, Leaf } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardUser {
  id: string;
  username: string;
  co2_saved: number;
  green_points: number;
  total_data_used: number;
}

const badges = [
  { name: "Carbon Saver", icon: Trophy, color: "text-yellow-500", threshold: 1000 },
  { name: "Eco Messenger", icon: Medal, color: "text-blue-500", threshold: 750 },
  { name: "Digital Minimalist", icon: Award, color: "text-purple-500", threshold: 500 },
  { name: "Getting Started", icon: Leaf, color: "text-green-500", threshold: 250 },
  { name: "Newbie", icon: Leaf, color: "text-gray-500", threshold: 0 },
];

const getBadgeForPoints = (points: number) => {
  for (const badge of badges) {
    if (points >= badge.threshold) {
      return badge;
    }
  }
  return badges[badges.length - 1];
};

export const LeaderboardReal = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Fetch top users by green points
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, co2_emitted, green_points, total_data_used')
        .order('green_points', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const formattedData: LeaderboardUser[] = data.map(profile => ({
          id: profile.id,
          username: profile.username,
          co2_saved: 0, // Calculate carbon saved (could be based on average vs their usage)
          green_points: profile.green_points,
          total_data_used: Number(profile.total_data_used),
        }));
        setLeaderboard(formattedData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center animate-pulse-eco">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Green Champions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Top users ranked by green points earned
          </p>
        </div>

        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top eco-conscious users</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No users on the leaderboard yet</p>
                <p className="text-sm">Be the first to start tracking!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((leaderUser, index) => {
                  const badgeInfo = getBadgeForPoints(leaderUser.green_points);
                  const Icon = badgeInfo.icon;
                  const isCurrentUser = user?.id === leaderUser.id;
                  const rank = index + 1;

                  return (
                    <div
                      key={leaderUser.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                        isCurrentUser 
                          ? "bg-primary/10 border-2 border-primary shadow-lg" 
                          : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      {/* Rank */}
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg shrink-0",
                        rank === 1 && "bg-yellow-500/20 text-yellow-600",
                        rank === 2 && "bg-gray-400/20 text-gray-600",
                        rank === 3 && "bg-orange-500/20 text-orange-600",
                        rank > 3 && "bg-muted text-muted-foreground"
                      )}>
                        {rank}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "font-semibold truncate",
                            isCurrentUser && "text-primary"
                          )}>
                            {leaderUser.username}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon className={cn("w-4 h-4", badgeInfo.color)} />
                          <span className="truncate">{badgeInfo.name}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <div className="font-bold text-primary">{leaderUser.total_data_used.toFixed(1)}MB</div>
                        <div className="text-xs text-muted-foreground">data used</div>
                      </div>

                      <div className="text-right shrink-0 min-w-[60px]">
                        <div className="font-bold text-accent">{leaderUser.green_points}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available Badges */}
            <div className="mt-8 p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-semibold mb-3">Available Badges</h4>
              <div className="flex flex-wrap gap-3">
                {badges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border"
                    >
                      <Icon className={cn("w-4 h-4", badge.color)} />
                      <span className="text-xs font-medium">{badge.name}</span>
                      <span className="text-xs text-muted-foreground">({badge.threshold}+ pts)</span>
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
