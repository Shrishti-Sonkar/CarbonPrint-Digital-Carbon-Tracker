import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Using ElectricityMap API (free tier available)
    // For production, get API key from https://electricitymap.org/
    // Fallback to mock data for demo purposes
    
    // Try ElectricityMap first (requires API key)
    const electricityMapKey = Deno.env.get("ELECTRICITY_MAP_API_KEY");
    
    if (electricityMapKey) {
      try {
        const response = await fetch(
          `https://api.electricitymap.org/v3/carbon-intensity/latest?lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'auth-token': electricityMapKey,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return new Response(
            JSON.stringify({
              intensity: data.carbonIntensity,
              units: "gCO2/kWh",
              country: data.zone,
              fossilFuelPercentage: data.fossilFuelPercentage || 50,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.log("ElectricityMap API failed, using mock data", error);
      }
    }

    // Fallback: Generate realistic mock data based on location
    // Global average is ~475 gCO2/kWh
    const mockIntensity = Math.floor(Math.random() * 300) + 300; // 300-600 range
    const mockFossilFuel = Math.floor(Math.random() * 40) + 40; // 40-80% range
    
    // Simple country detection based on lat/long
    let country = "Unknown";
    if (latitude > 24 && latitude < 50 && longitude > -125 && longitude < -66) {
      country = "United States";
    } else if (latitude > 35 && latitude < 71 && longitude > -10 && longitude < 40) {
      country = "Europe";
    } else if (latitude > 8 && latitude < 37 && longitude > 68 && longitude < 97) {
      country = "India";
    } else if (latitude > -44 && latitude < -10 && longitude > 112 && longitude < 154) {
      country = "Australia";
    }

    return new Response(
      JSON.stringify({
        intensity: mockIntensity,
        units: "gCO2/kWh",
        country: country,
        fossilFuelPercentage: mockFossilFuel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in carbon-intensity function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
