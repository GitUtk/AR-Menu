"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Sparkles,
  Upload,
  Download,
  Copy,
  Box,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";

interface AiModelGeneratorSectionProps {
  triggerToast: (message: string, type?: "info" | "success" | "warning") => void;
}

export function AiModelGeneratorSection({ triggerToast }: AiModelGeneratorSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState("");
  const [error, setError] = useState("");

  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load model-viewer script on client
      import("@google/model-viewer").catch(() => {});
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (PNG, JPG, WEBP).");
        return;
      }
      setError("");
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedModelUrl(null);
    }
  };

  // Preset sample food photo loader for instant demo testing
  const handleLoadSamplePhoto = async (sampleUrl: string, sampleName: string) => {
    try {
      setError("");
      setIsGenerating(true);
      setGenerationStage("Loading sample food photo…");
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const file = new File([blob], sampleName, { type: blob.type || "image/png" });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setGeneratedModelUrl(null);
      triggerToast(`Loaded sample photo: ${sampleName}`, "info");
    } catch {
      setError("Failed to load sample photo.");
    } finally {
      setIsGenerating(false);
      setGenerationStage("");
    }
  };

  const handleGenerate3DModel = async () => {
    if (!selectedFile) {
      setError("Please upload an image of a food item first.");
      return;
    }

    setError("");
    setIsGenerating(true);
    setGenerationStage("Uploading image to Hugging Face TRELLIS space…");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      setGenerationStage("Generating 3D mesh via TRELLIS AI model… (May take 30-90s)");

      const res = await fetch("/api/admin/generate-3d", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.model_url) {
        setGeneratedModelUrl(data.model_url);
        setGeneratedFilename(data.filename);
        triggerToast("3D GLB model generated successfully!", "success");
      } else {
        setError(data.error || "Failed to generate 3D model. Check HF_TOKEN configuration.");
      }
    } catch (err: any) {
      setError("Network or API error occurred during 3D generation.");
    } finally {
      setIsGenerating(false);
      setGenerationStage("");
    }
  };

  const copyModelPathToClipboard = () => {
    if (!generatedModelUrl) return;
    const fullUrl = `${window.location.origin}${generatedModelUrl}`;
    navigator.clipboard.writeText(fullUrl);
    triggerToast("Model URL copied to clipboard!", "success");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Main Grid: Upload & Settings on Left | 3D GLB Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Upload & Action */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-400" />
              <span>Step 1: Upload Food Photo</span>
            </h3>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Dropzone File Upload */}
            <div className="relative border-2 border-dashed border-zinc-700 hover:border-blue-500/80 rounded-2xl p-6 text-center transition-colors bg-zinc-950/60 group">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                disabled={isGenerating}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Food item preview"
                    className="h-44 w-auto mx-auto rounded-xl object-cover shadow-2xl border border-zinc-800"
                  />
                  <p className="text-xs text-zinc-400 font-medium">
                    {selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) : 0)} KB)
                  </p>
                  <p className="text-[11px] text-blue-400 hover:underline">
                    Click or drag a new image to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-blue-400 inline-block group-hover:scale-105 transition-transform">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Drop food image here or click to browse
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      PNG, JPG, or WEBP (Clear background or single dish recommended)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sample Preset Photos for Instant Demo */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 font-medium block">
                Or test with sample food items:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { name: "Burger", url: "/images/dishes/burger.png" },
                  { name: "Pizza", url: "/images/dishes/pizza.png" },
                  { name: "Pasta", url: "/images/dishes/pasta.png" },
                  { name: "Biryani", url: "/images/dishes/biryani.png" },
                  { name: "Dessert", url: "/images/dishes/dessert.png" },
                ].map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleLoadSamplePhoto(sample.url, `${sample.name}.png`)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-300 hover:border-blue-500 hover:text-white transition-colors shrink-0"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <Button
              type="button"
              onClick={handleGenerate3DModel}
              disabled={isGenerating || !selectedFile}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/20 gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span>Generating 3D Model…</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 text-white" />
                  <span>Generate 3D GLB Model (TRELLIS)</span>
                </>
              )}
            </Button>

            {/* Live Generation Status Banner */}
            {isGenerating && (
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 space-y-2 animate-pulse">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
                  <span className="font-mono text-white font-bold">
                    {generationStage || "Communicating with TRELLIS AI Space…"}
                  </span>
                </div>
                <p className="text-[11px] text-blue-300/80 leading-relaxed">
                  Generating 3D Gaussian Splats and extracting clean <code>.GLB</code> geometry using your server environment <code>HF_TOKEN</code>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive 3D Model Viewer & Export Options */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="h-4 w-4 text-blue-400" />
                <span>Step 2: Interactive 3D GLB Preview</span>
              </h3>
              {generatedModelUrl && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 gap-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Ready</span>
                </Badge>
              )}
            </div>

            {/* 3D Model Viewer Container */}
            <div className="relative w-full h-[360px] rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden shadow-inner">
              {generatedModelUrl ? (
                <model-viewer
                  src={generatedModelUrl}
                  alt="Generated 3D Food Item"
                  auto-rotate
                  camera-controls
                  shadow-intensity="1.5"
                  exposure="1.0"
                  style={{ width: "100%", height: "100%", backgroundColor: "#09090b" }}
                >
                  <div slot="progress-bar" className="w-full bg-blue-600 h-1" />
                </model-viewer>
              ) : isGenerating ? (
                <div className="text-center p-6 space-y-3">
                  <Loader2 className="h-10 w-10 text-blue-400 animate-spin mx-auto" />
                  <p className="text-sm text-zinc-300 font-semibold">
                    Synthesizing 3D Model…
                  </p>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3 text-zinc-500">
                  <Box className="h-12 w-12 stroke-[1.5] text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Upload a food image on the left and click <strong>Generate 3D GLB Model</strong> to preview your interactive 3D dish here.
                  </p>
                </div>
              )}
            </div>

            {/* Export & Integration Options */}
            {generatedModelUrl && (
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={generatedModelUrl}
                    download={generatedFilename || "food_model.glb"}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download .GLB File</span>
                  </a>

                  <Button
                    variant="outline"
                    onClick={copyModelPathToClipboard}
                    className="flex-1 gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-800 py-3"
                  >
                    <Copy className="h-4 w-4 text-blue-400" />
                    <span>Copy Model URL</span>
                  </Button>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <span className="font-semibold text-zinc-200 block">
                    🚀 How to use in your AR Restaurant Menu:
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Model saved locally at: <code className="text-blue-300 font-mono">{generatedModelUrl}</code>. You can assign this URL to any item in <code className="text-amber-300 font-mono">lib/dishes.ts</code> to display it in AR!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
