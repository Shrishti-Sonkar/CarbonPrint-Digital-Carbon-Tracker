import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Leaf, Lightbulb, TrendingDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickReplies = [
  { text: "How much CO₂ did I emit this week?", icon: TrendingDown },
  { text: "Give me an eco challenge", icon: Lightbulb },
  { text: "What are some tips to reduce my footprint?", icon: Leaf },
];

export const Chatbot = () => {
  const { session, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Carbonie 🌿, your eco-assistant. I can help you understand your digital carbon footprint and suggest ways to reduce it. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<string>("");

  useEffect(() => {
    if (user && isOpen) {
      fetchWeeklySummary();
    }
  }, [user, isOpen]);

  const fetchWeeklySummary = async () => {
    if (!user) return;

    try {
      const { data: weeklyData, error: weekError } = await supabase
        .from('weekly_history')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(2);

      if (weekError) throw weekError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('co2_emitted, green_points')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (weeklyData && weeklyData.length > 0) {
        const thisWeek = weeklyData[0]?.co2_emitted_grams || 0;
        const lastWeek = weeklyData[1]?.co2_emitted_grams || 0;
        const change = lastWeek > 0 ? (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1) : "0";
        const isReduction = thisWeek < lastWeek;

        const summary = `📊 This week: ${thisWeek.toFixed(1)}g CO₂ | ${isReduction ? '✅ Down' : '⚠️ Up'} ${Math.abs(Number(change))}% | Total: ${profile.co2_emitted.toFixed(1)}g | Points: ${profile.green_points}`;
        setWeeklySummary(summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('carbonie-chat', {
        body: { message: input },
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined
      });

      if (error) {
        console.error('Chatbot error:', error);
        throw error;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply || data.fallback || "I'm having trouble responding right now. Try again!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error calling chatbot:', error);
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast.error("I'm a bit busy right now 🌿. Try again in a few seconds!");
      } else {
        toast.error("I'm having trouble thinking right now. Try again!");
      }
      
      // Add fallback message
      const fallbackMessage: Message = {
        role: "assistant",
        content: "I'm having trouble connecting right now 🤔. Try asking something else!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setInput(text);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl animate-float z-50"
          variant="eco"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-eco" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[600px] shadow-2xl animate-scale-in z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-full bg-primary/10">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              Carbonie
              <span className="text-xs font-normal text-muted-foreground">Your Eco-Assistant</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {weeklySummary && user && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                    {weeklySummary}
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Leaf className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Replies */}
            {messages.length <= 1 && (
              <div className="px-4 pb-3 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
                {quickReplies.map((reply, index) => {
                  const Icon = reply.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply.text)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-left transition-colors"
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{reply.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask Carbonie anything..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  variant="eco"
                  disabled={!input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
