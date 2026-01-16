import { Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-eco.jpg";

export const Hero = () => {
  const scrollToTracker = () => {
    document.getElementById("tracker")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-2 h-2 bg-primary/30 rounded-full animate-float" />
        <div className="absolute top-40 right-32 w-3 h-3 bg-accent/30 rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-40 left-40 w-2 h-2 bg-primary/30 rounded-full animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 animate-fade-in">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-scale-in">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Measure. Chat. Go Green.</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            CarbonPrint
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Your Digital Carbon Tracker with AI Assistant
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Every photo, message, and video you share online consumes data and emits CO₂. 
            Track your digital footprint, get personalized insights, and reduce your impact with Carbonie, your eco-assistant.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="eco" 
              size="lg"
              onClick={scrollToTracker}
              className="group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Start Tracking Now
            </Button>
            <Button 
              variant="outline" 
              size="lg"
            >
              <Leaf className="w-5 h-5" />
              Learn More
            </Button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">0.02g</div>
              <div className="text-xs md:text-sm text-muted-foreground">CO₂ per MB</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">24/7</div>
              <div className="text-xs md:text-sm text-muted-foreground">AI Assistant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">100%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Free to Use</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
