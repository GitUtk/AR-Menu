"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Sparkles,
  Upload,
  Download,
  Copy,
  Box,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Wand2,
  PlusCircle,
  Utensils,
  Clock,
  Flame,
  Tag,
  Trash2,
  Edit3,
  IndianRupee,
  Layers,
} from "lucide-react";
import { DishCardSkeleton } from "./DishCardSkeleton";
import { Dish } from "@/lib/dishes";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";

interface AiModelGeneratorSectionProps {
  triggerToast: (message: string, type?: "info" | "success" | "warning") => void;
}

function removeImageBackground(file: File): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ file, dataUrl: e.target?.result as string });
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Strip white/near-white background pixels (R>225, G>225, B>225)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 225 && g > 225 && b > 225) {
            data[i + 3] = 0; // Set alpha to transparent
          }
        }
        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ file, dataUrl: e.target?.result as string });
            return;
          }
          const cleanFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_nobg.png", {
            type: "image/png",
          });
          const cleanDataUrl = canvas.toDataURL("image/png");
          resolve({ file: cleanFile, dataUrl: cleanDataUrl });
        }, "image/png");
      };
      img.onerror = () => resolve({ file, dataUrl: e.target?.result as string });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve({ file, dataUrl: "" });
    reader.readAsDataURL(file);
  });
}

export function AiModelGeneratorSection({ triggerToast }: AiModelGeneratorSectionProps) {
  // Form Inputs
  const [dishId, setDishId] = useState("");
  const [dishName, setDishName] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [dishPrepTime, setDishPrepTime] = useState("15 min");
  const [dishCalories, setDishCalories] = useState("500 kcal");
  const [dishBadge, setDishBadge] = useState("Chef Special");
  const [selectedTag, setSelectedTag] = useState("signature");

  // Asset States (Stored exclusively on Cloudinary)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string | null>(null);

  // Status States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationStage, setGenerationStage] = useState("");
  const [error, setError] = useState("");

  // Live Menu Items State
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@google/model-viewer").catch(() => {});
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const res = await fetch("/api/dishes");
      const data = await res.json();
      if (data.success && Array.isArray(data.dishes)) {
        setMenuItems(data.dishes);
      }
    } catch {
      console.warn("Failed to fetch menu items.");
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (PNG, JPG, WEBP).");
        return;
      }
      setError("");
      try {
        const { file: cleanFile, dataUrl } = await removeImageBackground(file);
        setSelectedFile(cleanFile);
        setPreviewUrl(dataUrl);
        setGeneratedModelUrl(null);
      } catch {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setGeneratedModelUrl(null);
      }
    }
  };

  const handleSelectSamplePhoto = async (name: string, url: string) => {
    setError("");
    setPreviewUrl(url);
    setGeneratedModelUrl(null);
    if (!dishName) setDishName(name);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `${name.toLowerCase().replace(/\s+/g, "_")}.png`, {
        type: blob.type || "image/png",
      });
      setSelectedFile(file);
    } catch {
      setSelectedFile(null);
    }
  };

  const handleGenerate3D = async () => {
    if (!selectedFile && !previewUrl) {
      setError("Please select or upload a food image file first.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setGenerationStage("Connecting to TRELLIS & synthesizing 3D model…");

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (previewUrl) {
        const imgRes = await fetch(previewUrl);
        const imgBlob = await imgRes.blob();
        formData.append("image", imgBlob, "food_photo.png");
      }
      formData.append("texture_size", "1024");
      formData.append("mesh_simplify", "0.95");

      const res = await fetch("/api/admin/generate-3d", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.model_url) {
        setGeneratedModelUrl(data.model_url);
        if (data.filename) setGeneratedFilename(data.filename);
        triggerToast("3D Model synthesized & ready for preview!", "success");
      } else {
        setError(data.error || "Failed to synthesize 3D model.");
      }
    } catch {
      setError("Network error while generating 3D model.");
    } finally {
      setIsGenerating(false);
      setGenerationStage("");
    }
  };

  const handleSaveItemToMenu = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dishName.trim()) {
      setError("Please enter the food item name.");
      return;
    }
    if (!dishPrice.trim()) {
      setError("Please enter the price.");
      return;
    }
    if (!dishDescription.trim()) {
      setError("Please enter a description.");
      return;
    }
    if (!previewUrl) {
      setError("Please upload a food image.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      let finalModelUrl = generatedModelUrl;
      let finalPosterUrl = previewUrl;
      let finalArScale: string | undefined = undefined;

      // Auto-process background removal and Cloudinary storage if a new image file was uploaded
      if (selectedFile) {
        setGenerationStage("Processing image & synthesizing 3D asset...");
        try {
          const formData = new FormData();
          formData.append("image", selectedFile);
          formData.append("texture_size", "1024");
          formData.append("mesh_simplify", "0.95");

          const genRes = await fetch("/api/admin/generate-3d", {
            method: "POST",
            body: formData,
          });
          const genData = await genRes.json();
          if (genData.success) {
            if (genData.model_url) finalModelUrl = genData.model_url;
            if (genData.image_url) finalPosterUrl = genData.image_url;
            if (genData.ar_scale) finalArScale = genData.ar_scale;
          }
        } catch (err) {
          console.warn("3D model auto-generation note:", err);
        }
      }

      // Default fallback model if not generated
      if (!finalModelUrl) {
        finalModelUrl = "https://res.cloudinary.com/dakh7ac7j/raw/upload/v1789153938/ar_restaurant_models/yeipdtm3vk8wcrqqorrh.glb";
      }

      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: dishId || undefined,
          name: dishName,
          price: dishPrice,
          description: dishDescription,
          prepTime: dishPrepTime,
          calories: dishCalories,
          badge: dishBadge,
          tags: [selectedTag],
          poster: finalPosterUrl,
          model: finalModelUrl,
          arScale: finalArScale,
        }),
      });

      const data = await res.json();

      if (data.success) {
        triggerToast(`"${dishName}" saved successfully to menu!`, "success");
        // Reset form
        setDishId("");
        setDishName("");
        setDishPrice("");
        setDishDescription("");
        setGeneratedModelUrl(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchMenuItems();
      } else {
        setError(data.error || "Failed to save menu item.");
      }
    } catch {
      setError("Failed to save menu item due to network error.");
    } finally {
      setIsSaving(false);
      setGenerationStage("");
    }
  };

  const handleEditDish = (dish: Dish) => {
    setDishId(dish.id);
    setDishName(dish.name);
    setDishPrice(dish.price.replace("₹", ""));
    setDishDescription(dish.description);
    setDishPrepTime(dish.prepTime || "15 min");
    setDishCalories(dish.calories || "500 kcal");
    setDishBadge(dish.badge || "Chef Special");
    if (dish.tags && dish.tags[0]) setSelectedTag(dish.tags[0]);
    if (dish.poster) setPreviewUrl(dish.poster);
    if (dish.model) setGeneratedModelUrl(dish.model);
    triggerToast(`Editing item: ${dish.name}`, "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteDish = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;

    try {
      const res = await fetch(`/api/dishes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Deleted "${name}" from menu`, "success");
        fetchMenuItems();
      }
    } catch {
      triggerToast("Failed to delete dish", "warning");
    }
  };

  const copyModelPathToClipboard = () => {
    if (!generatedModelUrl) return;
    navigator.clipboard.writeText(generatedModelUrl);
    triggerToast("Cloudinary Model URL copied to clipboard!", "success");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Form & 3D Generator Container in a Single Sleek Card */}
      <Card className="overflow-hidden bg-zinc-900/70 border-zinc-800 text-zinc-100 shadow-xl backdrop-blur-md">
        <CardHeader className="p-6 border-b border-zinc-800/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
              <Utensils className="h-5 w-5 text-zinc-300" />
              <span>{dishId ? "Edit Dish Details" : "Add New Dish to Menu"}</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Configure dish metadata, upload photo, and synthesize interactive 3D GLB model
            </CardDescription>
          </div>
          {dishId && (
            <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700 text-xs px-2.5 py-1">
              Editing Mode
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-6 pt-6">
          <form onSubmit={handleSaveItemToMenu} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (lg:col-span-5): 3D Model / Photo Preview & Generation Controls */}
            <div className="lg:col-span-5 space-y-5">
              {/* 3D Model / Photo Preview Container */}
              <div className="relative w-full h-[330px] rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
                {generatedModelUrl ? (
                  <model-viewer
                    src={generatedModelUrl}
                    alt="Generated 3D Food Dish"
                    auto-rotate
                    camera-controls
                    shadow-intensity="1.5"
                    exposure="1.0"
                    style={{ width: "100%", height: "100%", backgroundColor: "#09090b" }}
                  >
                    <div slot="progress-bar" className="w-full bg-zinc-700 h-1" />
                  </model-viewer>
                ) : previewUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={previewUrl}
                      alt="Food item preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-zinc-200 font-semibold bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 rounded-lg">
                        Click &apos;Generate 3D Model&apos; below
                      </span>
                    </div>
                  </div>
                ) : isGenerating ? (
                  <div className="text-center p-6 space-y-3">
                    <Loader2 className="h-9 w-9 text-zinc-300 animate-spin mx-auto" />
                    <p className="text-xs text-zinc-300 font-semibold">
                      Synthesizing 3D Model & Cloud Asset…
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-3 text-zinc-500">
                    <Box className="h-10 w-10 stroke-[1.5] text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400 max-w-xs">
                      3D Model or Photo Preview will appear here
                    </p>
                  </div>
                )}

                {generatedModelUrl && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-zinc-950/90 text-zinc-200 border-zinc-700 text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                      <span>3D Ready</span>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Upload Food Photo Dropzone */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Food Photo (Cloudinary Stored) *
                </label>
                <div className="relative border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl p-3.5 text-center transition-colors bg-zinc-950/60 group">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    disabled={isGenerating}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors truncate max-w-[200px]">
                      {selectedFile ? selectedFile.name : "Choose food image file..."}
                    </span>
                  </div>
                </div>

                {/* Sample Test Photos */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-zinc-400 font-medium block">
                    Or test with sample photos:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      { name: "Burger", url: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153946/ar_restaurant_inputs/hih4qvruegqsvhsg3xiw.png" },
                      { name: "Pizza", url: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153942/ar_restaurant_inputs/nrxfen4tt2c0bibvj7hl.png" },
                      { name: "Dosa", url: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153951/ar_restaurant_inputs/c9vrgyagymwwd2yucyvp.png" },
                      { name: "Pasta", url: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789153939/ar_restaurant_inputs/qyqubfwwt4injmljchhx.png" },
                      { name: "Chili Paneer", url: "https://res.cloudinary.com/dakh7ac7j/image/upload/v1789156579/ar_restaurant_inputs/yiyagubpc6c15zsmfoqt.png" },
                    ].map((sample) => (
                      <button
                        key={sample.name}
                        type="button"
                        onClick={() => handleSelectSamplePhoto(sample.name, sample.url)}
                        className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 text-[11px] text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors shrink-0 cursor-pointer"
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dedicated Generate 3D Model Button */}
                <Button
                  type="button"
                  onClick={handleGenerate3D}
                  disabled={isGenerating || (!selectedFile && !previewUrl)}
                  className="w-full py-5 mt-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-bold text-xs gap-2 shadow-xl cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>{generationStage || "Synthesizing 3D Model…"}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>Generate 3D Model Preview</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* RIGHT COLUMN (lg:col-span-7): Editable Content Form */}
            <div className="lg:col-span-7 space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paneer Butter Masala"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Price (₹) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 290"
                        value={dishPrice}
                        onChange={(e) => setDishPrice(e.target.value)}
                        required
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-8 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400 transition-colors font-mono"
                      />
                      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the flavors, ingredients, spices, and preparation…"
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400 transition-colors leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-400" /> Prep Time
                    </label>
                    <input
                      type="text"
                      placeholder="15 min"
                      value={dishPrepTime}
                      onChange={(e) => setDishPrepTime(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-zinc-400" /> Nutrients / Calories
                    </label>
                    <input
                      type="text"
                      placeholder="520 kcal"
                      value={dishCalories}
                      onChange={(e) => setDishCalories(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                      <Tag className="h-3 w-3 text-zinc-400" /> Badge Label
                    </label>
                    <input
                      type="text"
                      placeholder="Chef Special"
                      value={dishBadge}
                      onChange={(e) => setDishBadge(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Category / Cuisine Tag
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="indian">Indian</option>
                    <option value="italian">Italian</option>
                    <option value="japanese">Japanese</option>
                    <option value="signature">Signature</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="chicken">Chicken</option>
                    <option value="seafood">Seafood</option>
                  </select>
                </div>
              </div>

              {/* SAVE TO MENU BUTTON */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSaving || !dishName || !generatedModelUrl}
                  className="w-full py-5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm shadow-md gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                      <span>Saving Dish to Menu…</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 text-zinc-950" />
                      <span>{dishId ? "Update Dish in Menu" : "Save Item to Menu"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* LIVE MENU ITEMS MANAGER SECTION */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-zinc-300" />
              <span>Live Restaurant Menu Items ({menuItems.length})</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              All dishes with interactive 3D GLB assets stored on Cloudinary
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchMenuItems}
            disabled={isLoadingMenu}
            className="gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
          >
            {isLoadingMenu ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-zinc-400" />}
            <span>Refresh Menu</span>
          </Button>
        </div>

        {isLoadingMenu ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <DishCardSkeleton key={i} />
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 space-y-2">
            <Utensils className="h-10 w-10 mx-auto text-zinc-600 stroke-[1.5]" />
            <p className="text-xs text-zinc-400">No dishes found in menu database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((dish) => (
              <div
                key={dish.id}
                className="rounded-xl border text-zinc-100 shadow-xl backdrop-blur-md group cursor-pointer flex flex-col justify-between overflow-hidden bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1"
              >
                <div>
                  {/* Top Image Box - Clean pristine image without badge overlay */}
                  <div className="relative h-48 w-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 flex items-center justify-center border-b border-zinc-800/80 overflow-hidden">
                    <img
                      src={dish.poster || "/images/dishes/burger.png"}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Header content: Dish name, price, description */}
                  <div className="flex flex-col space-y-1.5 p-5 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="tracking-tight text-lg font-bold text-white group-hover:text-zinc-200 transition-colors">
                        {dish.name}
                      </h3>
                      <span className="text-base font-bold text-white font-mono">
                        {dish.price}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>
                </div>

                {/* Footer content: Prep time, calories, and minimal action buttons */}
                <div className="p-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 gap-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span>{dish.prepTime || "15 min"}</span>
                    <span>·</span>
                    <span>{dish.calories || "500 kcal"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleEditDish(dish)}
                      className="h-8 gap-1.5 px-3 py-1 text-xs bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-lg shadow-sm border-0"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-zinc-950" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDish(dish.id, dish.name)}
                      className="h-8 px-2.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                      title="Delete Dish"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
