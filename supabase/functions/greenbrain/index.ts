// --- GREENBRAIN EDGE FUNCTION (Optimized v2) ---

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");

    // --- Fetch weekly history ---
    const { data: weeklyData, error } = await supabase
      .from("weekly_history")
      .select("*")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(7);
    if (error) throw error;

    if (!weeklyData || weeklyData.length === 0)
      return new Response(
        JSON.stringify({
          predictedNextWeek: 0,
          trend: "neutral",
          confidence: 0,
          tip: "Start tracking your carbon footprint to get predictions!",
          weeklyData: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    const recentWeeks = weeklyData.slice(0, 4);
    const avgCO2 =
      recentWeeks.reduce((sum, w) => sum + Number(w.co2_emitted_grams), 0) /
      recentWeeks.length;

    // --- Fetch user activity ---
    let behavior = { uploads_this_week: 0, compressed_files: 0 };
    try {
      const res = await supabase
        .from("user_activity")
        .select("uploads_this_week, compressed_files")
        .eq("user_id", user.id)
        .maybeSingle();
      if (res.data) behavior = res.data;
    } catch (_) {}

    // --- Adjust prediction ---
    let adjustment = 0;
    if (behavior.uploads_this_week > 5) adjustment += 5;
    if (behavior.compressed_files > 2) adjustment -= 7;

    // --- Trend detection ---
    let trend = "neutral";
    if (weeklyData.length >= 2) {
      const [lastWeek, prevWeek] = [
        Number(weeklyData[0].co2_emitted_grams),
        Number(weeklyData[1].co2_emitted_grams),
      ];
      const change = ((lastWeek - prevWeek) / prevWeek) * 100;
      if (change > 3) trend = "up";
      else if (change < -3) trend = "down";
    }

    // --- Add randomness + balance ---
    const randomFactor = (Math.random() - 0.5) * 0.2; // ±10%
    const balancedCO2 = avgCO2 * (1 + randomFactor + adjustment / 100);

    const lastWeekCO2 = Number(weeklyData[0].co2_emitted_grams);
    const predictedNextWeek = Math.min(
      lastWeekCO2 * 1.3,
      Math.max(lastWeekCO2 * 0.7, Math.round(balancedCO2))
    );

    // --- Confidence & tips ---
    const confidence = Math.round(80 + (Math.random() * 15 - 5));
    const tipOptions = {
      up: [
        "Your digital activity rose 📈 Try SmartCompress to reduce data!",
        "Carbon uptrend! ⚠️ Optimize file uploads to stay green.",
      ],
      down: [
        "You're trending green 🌿 Keep optimizing uploads!",
        "Impressive! 💚 Your eco-actions lowered emissions.",
      ],
      neutral: [
        "Steady footprint 🌍 Try deleting unused media!",
        "Consistency matters 💪 Small steps make big change.",
      ],
    };
    const tipPool = tipOptions[trend as keyof typeof tipOptions];
    const tip = tipPool[Math.floor(Math.random() * tipPool.length)];

    // --- Chart data ---
    const chartData = weeklyData
      .reverse()
      .map((week) => ({
        date: new Date(week.week_start).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        co2: Number(week.co2_emitted_grams),
      }));

    return new Response(
      JSON.stringify({
        predictedNextWeek,
        trend,
        confidence,
        tip,
        weeklyData: chartData,
        currentWeek: Number(
          weeklyData[weeklyData.length - 1].co2_emitted_grams
        ),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in greenbrain function:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
