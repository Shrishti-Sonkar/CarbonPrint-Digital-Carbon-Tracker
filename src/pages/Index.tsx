import { Hero } from "@/components/Hero";
import { ActivityTracker } from "@/components/ActivityTracker";
import { LeaderboardReal } from "@/components/LeaderboardReal";
import { Chatbot } from "@/components/Chatbot";
import { EcoCompressor } from "@/components/EcoCompressor";
import { WeeklyMiniChart } from "@/components/WeeklyMiniChart";
import { CarbonIntensity } from "@/components/CarbonIntensity";
import { Leaf, Sparkles, BarChart3, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">CarbonPrint</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/analytics")}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="eco" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <Hero />
      <ActivityTracker />
      
      {/* Real-time Carbon Data & Weekly Stats */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6">
            <CarbonIntensity />
            <WeeklyMiniChart />
          </div>
        </div>
      </section>

      {/* EcoCompress Feature */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-6 text-center">🌿 EcoCompress</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Compress your images and videos locally to save data and reduce your carbon footprint
          </p>
          <EcoCompressor />
        </div>
      </section>

      <LeaderboardReal />

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why CarbonPrint?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The first app that connects your digital behavior to environmental impact
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Leaf,
                title: "Real-Time Tracking",
                description: "See the carbon impact of every photo, message, or video you share instantly",
              },
              {
                icon: Sparkles,
                title: "AI Assistant",
                description: "Chat with Carbonie for personalized tips, challenges, and insights",
              },
              {
                icon: Users,
                title: "Gamified Learning",
                description: "Earn badges, compete on leaderboards, and make sustainability fun",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Chatbot />
    </div>
  );
};

export default Index;
