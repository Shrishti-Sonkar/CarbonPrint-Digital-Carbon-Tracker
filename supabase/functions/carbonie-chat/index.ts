import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, type = 'general' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user data if authenticated
    const authHeader = req.headers.get('Authorization');
    let userData = null;
    
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );
      
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('username, co2_emitted, green_points, total_data_used')
          .eq('id', user.id)
          .single();
        
        const { data: weeklyData } = await supabaseClient
          .from('weekly_history')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(4);
        
        userData = { profile, weeklyData };
      }
    }

    // Build context-aware system prompt
    let systemPrompt = `You are Carbonie 🌿, the friendly AI chatbot inside the CarbonPrint App — an eco-awareness app that helps users track their digital carbon footprint.

🎯 Your Role:
- Help users understand their personal CO₂ emissions from digital activity (like sending photos, videos, or chats)
- Encourage eco-friendly digital habits in a kind, fun, and human way
- Use real user data when available
- Respond naturally — like a helpful eco-companion, not a formal assistant
- ALWAYS include real-world comparisons when discussing emissions

💡 Tone & Personality:
- Friendly, supportive, and motivating
- Use emojis 🌱🌍⚡💚 but keep them minimal
- Respond conversationally (2–3 lines per reply max)
- End every message with a small eco emoji 🌱 or 💚

🧠 Knowledge Base:
- Each 1 MB = ~0.02 g CO₂
- 1-hour video call = ~150 g CO₂
- Charging one phone = ~18 g CO₂
- Streaming 1 hour HD video = ~55 g CO₂
- Driving a car = ~120 g CO₂ per km
- Boiling a kettle = ~7 g CO₂
- Powering a 60W bulb for 1 hour = ~36 g CO₂
- One tree absorbs ~21 kg CO₂ per year (0.058 kg per day)
- Digital sustainability tips: compress files, delete spam, use dark mode, cloud cleanup, reduce video quality when possible

🪴 Response Style:
- Keep it brief and conversational
- ALWAYS relate emissions to real-world comparisons (e.g., "That's like driving 2 km!" or "Equal to charging your phone 5 times!")
- Be encouraging and positive about progress
- If no data available, gently prompt user to start tracking

📊 Real-World Comparison Examples:
- "Your 0.4 kg CO₂ this week = driving a scooter for 3.3 km 🛵"
- "You saved 0.1 kg CO₂ = powering a bulb for 2.8 hours! 💡"
- "That file = boiling a kettle twice ☕"
- Use these comparisons naturally in your responses!`;

    if (userData?.profile) {
      const { co2_emitted, green_points, total_data_used, username } = userData.profile;
      systemPrompt += `\n\nUser Stats for ${username}:
      - Total CO₂: ${co2_emitted}g (${(co2_emitted / 1000).toFixed(2)} kg)
      - Green Points: ${green_points}
      - Data Used: ${total_data_used}MB`;
      
      if (userData.weeklyData && userData.weeklyData.length > 0) {
        const thisWeek = userData.weeklyData[0];
        const lastWeek = userData.weeklyData[1];
        systemPrompt += `\n- This Week: ${thisWeek.co2_emitted_grams}g CO₂`;
        
        if (lastWeek) {
          const changeNum = ((thisWeek.co2_emitted_grams - lastWeek.co2_emitted_grams) / lastWeek.co2_emitted_grams * 100);
          const change = changeNum.toFixed(1);
          systemPrompt += `\n- Change from last week: ${changeNum > 0 ? '+' : ''}${change}%`;
          
          if (changeNum < 0) {
            systemPrompt += `\n(Great job reducing emissions!)`;
          }
        }
      }
    } else {
      systemPrompt += `\n\nNo user data available yet. Encourage them to share media through CarbonPrint to start tracking their footprint!`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a moment.",
            fallback: "I'm a bit busy right now 🌿. Try asking me again in a few seconds!"
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Payment required.",
            fallback: "I'm temporarily unavailable. Please contact support if this persists."
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "I'm having trouble responding right now. Try again!";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in carbonie-chat:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        fallback: "I'm having trouble thinking right now 🤔. Try asking something else!"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
