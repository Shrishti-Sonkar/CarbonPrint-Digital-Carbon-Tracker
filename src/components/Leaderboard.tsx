import { Trophy, Medal, Award, Leaf } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  rank: number;
  name: string;
  carbonSaved: number;
  badge: string;
  points: number;
}

const mockUsers: LeaderboardUser[] = [
  { rank: 1, name: "EcoWarrior", carbonSaved: 45.2, badge: "Carbon Saver", points: 1250 },
  { rank: 2, name: "GreenThumb", carbonSaved: 38.7, badge: "Eco Messenger", points: 1100 },
  { rank: 3, name: "EarthLover", carbonSaved: 32.4, badge: "Digital Minimalist", points: 980 },
  { rank: 4, name: "You", carbonSaved: 12.3, badge: "Getting Started", points: 420 },
  { rank: 5, name: "NatureFan", carbonSaved: 8.9, badge: "Newbie", points: 280 },
];

const badges = [
  { name: "Carbon Saver", icon: Trophy, color: "text-yellow-500" },
  { name: "Eco Messenger", icon: Medal, color: "text-blue-500" },
  { name: "Digital Minimalist", icon: Award, color: "text-purple-500" },
  { name: "Getting Started", icon: Leaf, color: "text-green-500" },
  { name: "Newbie", icon: Leaf, color: "text-gray-500" },
];

export const Leaderboard = () => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Green Champions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Compete with others and earn badges for reducing your digital carbon footprint
          </p>
        </div>

        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top users ranked by carbon saved this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUsers.map((user) => {
                const badgeInfo = badges.find(b => b.name === user.badge);
                const Icon = badgeInfo?.icon || Leaf;
                const isCurrentUser = user.name === "You";

                return (
                  <div
                    key={user.rank}
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
                      user.rank === 1 && "bg-yellow-500/20 text-yellow-600",
                      user.rank === 2 && "bg-gray-400/20 text-gray-600",
                      user.rank === 3 && "bg-orange-500/20 text-orange-600",
                      user.rank > 3 && "bg-muted text-muted-foreground"
                    )}>
                      {user.rank}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "font-semibold truncate",
                          isCurrentUser && "text-primary"
                        )}>
                          {user.name}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className={cn("w-4 h-4", badgeInfo?.color)} />
                        <span className="truncate">{user.badge}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0">
                      <div className="font-bold text-primary">{user.carbonSaved}g</div>
                      <div className="text-xs text-muted-foreground">saved</div>
                    </div>

                    <div className="text-right shrink-0 min-w-[60px]">
                      <div className="font-bold text-accent">{user.points}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                );
              })}
            </div>

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
