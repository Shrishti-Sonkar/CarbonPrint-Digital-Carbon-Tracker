import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Download, Upload, Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export const EcoCompressor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const { toast } = useToast();

  const CO2_PER_MB = 0.02; // grams of CO2 per MB

  useEffect(() => {
    // Load TensorFlow model on mount
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log("TensorFlow COCO-SSD model loaded");
      } catch (error) {
        console.error("Error loading TensorFlow model:", error);
      }
    };
    loadModel();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOriginalSize(selectedFile.size);
      setCompressedSize(0);
      setCompressedFile(null);
      setProgress(0);
      setDetectedObjects([]);
    }
  };

  const detectObjects = async (imageFile: File): Promise<string[]> => {
    if (!model || !aiEnabled) return [];
    
    try {
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      await new Promise((resolve) => { img.onload = resolve; });
      
      const predictions = await model.detect(img);
      const objects = predictions
        .filter(p => p.score > 0.5)
        .map(p => p.class);
      
      return [...new Set(objects)]; // unique objects
    } catch (error) {
      console.error("Object detection error:", error);
      return [];
    }
  };

  const compressImage = async (imageFile: File) => {
    try {
      let detectedObjs: string[] = [];
      
      // AI-aware compression: detect important areas
      if (aiEnabled && model) {
        detectedObjs = await detectObjects(imageFile);
        setDetectedObjects(detectedObjs);
        
        if (detectedObjs.length > 0) {
          toast({
            title: "🧠 SmartCompress Active",
            description: `Detected: ${detectedObjs.join(", ")}. Preserving quality in key areas.`,
          });
        }
      }
      
      // Adjust compression based on detected objects
      const hasImportantContent = detectedObjs.some(obj => 
        ['person', 'face', 'text', 'book'].includes(obj.toLowerCase())
      );
      
      const options = {
        maxSizeMB: hasImportantContent ? 1.5 : 1, // preserve more quality for important content
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: hasImportantContent ? 0.85 : 0.7,
        onProgress: (p: number) => setProgress(p),
      };
      
      const compressed = await imageCompression(imageFile, options);
      return compressed;
    } catch (error) {
      console.error("Image compression error:", error);
      throw error;
    }
  };

  const compressVideo = async (videoFile: File) => {
    const ffmpeg = new FFmpeg();
    
    try {
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      ffmpeg.on("progress", ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));
      
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "fast",
        "-c:a", "aac",
        "-b:a", "128k",
        "output.mp4"
      ]);

      const data = await ffmpeg.readFile("output.mp4") as Uint8Array;
      return new Blob([new Uint8Array(data)], { type: "video/mp4" });
    } catch (error) {
      console.error("Video compression error:", error);
      throw error;
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setCompressing(true);
    setProgress(0);

    try {
      let compressed: Blob;

      if (file.type.startsWith("image/")) {
        compressed = await compressImage(file);
      } else if (file.type.startsWith("video/")) {
        compressed = await compressVideo(file);
      } else {
        toast({
          title: "Unsupported file type",
          description: "Please select an image or video file",
          variant: "destructive",
        });
        return;
      }

      setCompressedFile(compressed);
      setCompressedSize(compressed.size);

      const savedMB = (originalSize - compressed.size) / (1024 * 1024);
      const co2Saved = savedMB * CO2_PER_MB;

      toast({
        title: "Compression Complete! 🎉",
        description: `Saved ${savedMB.toFixed(2)}MB • Reduced ${co2Saved.toFixed(2)}g CO₂`,
      });

      // Auto-send celebration message to AI
      sendChatMessage(
        `I just compressed a file and saved ${savedMB.toFixed(2)}MB!`,
        savedMB,
        co2Saved
      );
    } catch (error) {
      toast({
        title: "Compression failed",
        description: "Please try again with a different file",
        variant: "destructive",
      });
    } finally {
      setCompressing(false);
    }
  };

  const sendChatMessage = async (message: string, savedData?: number, co2Saved?: number) => {
    if (!message.trim()) return;

    setChatLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", content: message }]);
    setChatMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("eco-chat", {
        body: { 
          message, 
          savedData: savedData?.toFixed(2), 
          co2Saved: co2Saved?.toFixed(2) 
        },
      });

      if (error) throw error;

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile || !file) return;

    const url = URL.createObjectURL(compressedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed_${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const savedPercentage = originalSize > 0 
    ? ((originalSize - compressedSize) / originalSize) * 100 
    : 0;
  const savedMB = (originalSize - compressedSize) / (1024 * 1024);
  const co2Saved = savedMB * CO2_PER_MB;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Compressor Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🌿 EcoCompress
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiEnabled(!aiEnabled)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {aiEnabled ? "AI On" : "AI Off"}
            </Button>
          </div>
          {aiEnabled && model && (
            <p className="text-xs text-primary mt-2">
              🧠 SmartCompress: AI-powered selective compression active
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select Image or Video</label>
            <Input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={compressing}
            />
          </div>

          {detectedObjects.length > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium mb-2">🔍 Detected Objects:</p>
              <div className="flex flex-wrap gap-2">
                {detectedObjects.map((obj, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/20 rounded text-xs">
                    {obj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {file && (
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <p>
                  <strong>Original:</strong> {(originalSize / (1024 * 1024)).toFixed(2)} MB
                </p>
                {compressedSize > 0 && (
                  <>
                    <p>
                      <strong>Compressed:</strong> {(compressedSize / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <p className="text-green-600 font-semibold">
                      💾 Saved: {savedPercentage.toFixed(1)}% ({savedMB.toFixed(2)} MB)
                    </p>
                    <p className="text-blue-600 font-semibold">
                      🌍 CO₂ Reduced: {co2Saved.toFixed(3)}g
                    </p>
                    <p className="text-xs text-muted-foreground pt-2">
                      🌱 That's like planting {(co2Saved * 50).toFixed(1)} tree seedlings!
                    </p>
                  </>
                )}
              </div>

              {compressing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-center text-muted-foreground">
                    {progress}% compressed
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleCompress}
                  disabled={compressing || !file}
                  className="flex-1"
                >
                  {compressing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Compress
                    </>
                  )}
                </Button>

                {compressedFile && (
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Chat Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            EcoBot - Sustainability Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[300px] overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-md">
            {chatHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-10">
                Ask me about your carbon savings or sustainability tips! 🌱
              </p>
            ) : (
              chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-secondary mr-8"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">EcoBot is thinking...</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about sustainability or your savings..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage(chatMessage);
                }
              }}
              disabled={chatLoading}
              className="resize-none"
              rows={2}
            />
            <Button
              onClick={() => sendChatMessage(chatMessage)}
              disabled={chatLoading || !chatMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
