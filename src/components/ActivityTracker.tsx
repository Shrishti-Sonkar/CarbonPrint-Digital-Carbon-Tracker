import { useState, useEffect } from "react";
import { ImageIcon, MessageSquare, Video, TrendingDown, Zap, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type ActivityType = "photo" | "message" | "video";

interface Activity {
  type: ActivityType;
  size: number;
  co2: number;
  timestamp: Date;
}

const CO2_PER_MB = 0.02; // grams

export const ActivityTracker = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [size, setSize] = useState("");
  const [selectedType, setSelectedType] = useState<ActivityType>("photo");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRecentActivities();
    }
  }, [user]);

  const fetchRecentActivities = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const mappedActivities = data.map(activity => ({
          type: activity.activity_type as ActivityType,
          size: Number(activity.size_mb),
          co2: Number(activity.co2_grams),
          timestamp: new Date(activity.created_at),
        }));
        setActivities(mappedActivities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const activityTypes = [
    { type: "photo" as ActivityType, icon: ImageIcon, label: "Photo", avgSize: "5 MB" },
    { type: "message" as ActivityType, icon: MessageSquare, label: "Message", avgSize: "0.01 MB" },
    { type: "video" as ActivityType, icon: Video, label: "Video", avgSize: "50 MB" },
  ];

  const calculateCO2 = (sizeInMB: number) => {
    return (sizeInMB * CO2_PER_MB).toFixed(3);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is image or video
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error("Please upload an image or video file");
      return;
    }

    // Calculate file size in MB
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    setUploadedFile(file);
    setSize(fileSizeMB);
    setSelectedType(isVideo ? "video" : "photo");
    
    toast.success(`File loaded: ${file.name} (${fileSizeMB}MB)`, {
      description: `Estimated CO₂: ${calculateCO2(parseFloat(fileSizeMB))}g`,
    });
  };

  const handleTrack = async () => {
    const sizeNum = parseFloat(size);
    if (isNaN(sizeNum) || sizeNum <= 0) {
      toast.error("Please enter a valid size");
      return;
    }

    if (!user) {
      toast.error("Please sign in to track activities");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const co2 = parseFloat(calculateCO2(sizeNum));

      // Save to database
      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          activity_type: selectedType,
          size_mb: sizeNum,
          co2_grams: co2,
        });

      if (error) throw error;

      const newActivity: Activity = {
        type: selectedType,
        size: sizeNum,
        co2,
        timestamp: new Date(),
      };

      setActivities([newActivity, ...activities]);
      setSize("");
      setUploadedFile(null);
      
      toast.success(`${co2}g CO₂ tracked! 🌍`, {
        description: `You sent a ${sizeNum}MB ${selectedType}`,
      });

      // Refresh activities
      await fetchRecentActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error("Failed to save activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalCO2 = activities.reduce((sum, a) => sum + a.co2, 0);

  return (
    <section id="tracker" className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Track Your Digital Footprint</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enter your digital activity to see its carbon impact in real-time
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Card */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>Add Activity</CardTitle>
              <CardDescription>Calculate the CO₂ emissions of your digital actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Photo/Video</Label>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer transition-colors bg-secondary/30"
                  >
                    <Upload className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">
                      {uploadedFile ? uploadedFile.name : "Choose file or tap to upload"}
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadedFile && (
                    <p className="text-xs text-muted-foreground text-center">
                      File ready: {(uploadedFile.size / (1024 * 1024)).toFixed(2)}MB
                    </p>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
                </div>
              </div>

              {/* Activity Type Selection */}
              <div className="space-y-2">
                <Label>Activity Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {activityTypes.map(({ type, icon: Icon, label, avgSize }) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105",
                        selectedType === type
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className={cn(
                        "w-6 h-6 mx-auto mb-2",
                        selectedType === type ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="text-xs font-medium">{label}</div>
                      <div className="text-[10px] text-muted-foreground">{avgSize}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Input */}
              <div className="space-y-2">
                <Label htmlFor="size">Data Size (MB)</Label>
                <div className="flex gap-2">
                  <Input
                    id="size"
                    type="number"
                    placeholder="Enter size in MB"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                    step="0.01"
                    min="0"
                  />
                  <Button onClick={handleTrack} variant="eco" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Calculate
                  </Button>
                </div>
                {size && !isNaN(parseFloat(size)) && (
                  <p className="text-sm text-muted-foreground">
                    = <span className="font-bold text-primary">{calculateCO2(parseFloat(size))}g CO₂</span> 🌍
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                Your Impact Today
              </CardTitle>
              <CardDescription>Total emissions from your activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{totalCO2.toFixed(3)}g</div>
                  <div className="text-sm text-muted-foreground">Total CO₂ Emissions</div>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No activities tracked yet</p>
                    <p className="text-xs">Start adding your digital activities above</p>
                  </div>
                ) : (
                  activities.map((activity, index) => {
                    const Icon = activityTypes.find(t => t.type === activity.type)?.icon || ImageIcon;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium capitalize">{activity.type}</div>
                            <div className="text-xs text-muted-foreground">{activity.size} MB</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-primary">{activity.co2}g</div>
                          <div className="text-xs text-muted-foreground">CO₂</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
