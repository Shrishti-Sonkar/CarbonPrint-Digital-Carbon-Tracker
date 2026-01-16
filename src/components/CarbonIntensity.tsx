import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        if (!navigator.geolocation) {
          setLoading(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            const { data: intensityData, error } = await supabase.functions.invoke(
              'carbon-intensity',
              {
                body: { latitude, longitude }
              }
            );

            if (error) {
              console.error('Error fetching carbon intensity:', error);
              setLoading(false);
              return;
            }

            if (intensityData) {
              setData(intensityData);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error:', error);
        toast.error("Couldn't fetch carbon intensity data");
        setLoading(false);
      }
    };

    fetchCarbonIntensity();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Grid Carbon Intensity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const getIntensityLevel = (intensity: number) => {
    if (intensity < 100) return { label: "Very Low", color: "text-green-600" };
    if (intensity < 250) return { label: "Low", color: "text-lime-600" };
    if (intensity < 500) return { label: "Moderate", color: "text-yellow-600" };
    if (intensity < 750) return { label: "High", color: "text-orange-600" };
    return { label: "Very High", color: "text-red-600" };
  };

  const level = getIntensityLevel(data.intensity);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Grid Carbon Intensity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${level.color}`}>
              {Math.round(data.intensity)}
            </span>
            <span className="text-sm text-muted-foreground">{data.units}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-medium ${level.color}`}>{level.label}</span>
            <span className="text-muted-foreground">•</span>
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{data.country}</span>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fossil fuel</span>
              <span className="font-medium">{data.fossilFuelPercentage}%</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${data.fossilFuelPercentage}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            Your digital emissions are powered by this grid. Lower intensity = cleaner energy! ⚡🌱
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
