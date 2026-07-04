import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Zap } from "lucide-react";

interface CarbonIntensityData {
  intensity: number;
  units: string;
  country: string;
  fossilFuelPercentage: number;
}

export const CarbonIntensity = () => {
  const [data, setData] = useState<CarbonIntensityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarbonIntensity = async () => {
      try {
        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              const { data: result, error } = await supabase.functions.invoke('carbon-intensity', {
                body: { latitude, longitude }
              });

              if (error) throw error;
              setData(result);
              setLoading(false);
            },
            (error) => {
              console.error("Geolocation error:", error);
              // Fallback to default location (India)
              fetchDefaultData();
            }
          );
        } else {
          fetchDefaultData();
        }
      } catch (error) {
        console.error("Error fetching carbon intensity:", error);
        setLoading(false);
      }
    };

    const fetchDefaultData = async () => {
      const { data: result, error } = await supabase.functions.invoke('carbon-intensity', {
        body: { latitude: 20.5937, longitude: 78.9629 } // India center
      });
      if (!error) setData(result);
      setLoading(false);
    };

    fetchCarbonIntensity();
  }, []);

  const getIntensityLevel = (intensity: number) => {
    if (intensity < 150) return { label: "Clean", color: "from-green-500/20 to-emerald-500/20", glow: "shadow-green-500/50", textColor: "text-green-400" };
    if (intensity < 400) return { label: "Moderate", color: "from-orange-500/20 to-amber-500/20", glow: "shadow-orange-500/50", textColor: "text-orange-400" };
    return { label: "High", color: "from-red-500/20 to-rose-500/20", glow: "shadow-red-500/50", textColor: "text-red-400" };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-20 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  if (!data) return null;

  const level = getIntensityLevel(data.intensity);

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Carbon Shadow Effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-30 blur-3xl`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Carbon Shadow</h3>
        </div>

        <motion.div
          className={`p-6 rounded-xl bg-card/50 backdrop-blur-sm border-2 ${level.glow} shadow-lg`}
          animate={{
            boxShadow: [
              `0 0 20px rgba(${level.color.includes('green') ? '34, 197, 94' : level.color.includes('orange') ? '249, 115, 22' : '239, 68, 68'}, 0.3)`,
              `0 0 40px rgba(${level.color.includes('green') ? '34, 197, 94' : level.color.includes('orange') ? '249, 115, 22' : '239, 68, 68'}, 0.6)`,
              `0 0 20px rgba(${level.color.includes('green') ? '34, 197, 94' : level.color.includes('orange') ? '249, 115, 22' : '239, 68, 68'}, 0.3)`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-4xl font-bold ${level.textColor}`}>
              {Math.round(data.intensity)}
            </span>
            <span className="text-sm text-muted-foreground">{data.units}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Zap className={`w-4 h-4 ${level.textColor}`} />
            <span className={`font-semibold ${level.textColor}`}>{level.label} Energy</span>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>📍 Region: {data.country}</p>
            <p>⚡ Fossil Fuels: {Math.round(data.fossilFuelPercentage)}%</p>
          </div>
        </motion.div>

        <p className="text-xs text-muted-foreground mt-4">
          Real-time grid carbon intensity in your region. Lower is better! 🌍
        </p>
      </div>
    </Card>
  );
};
