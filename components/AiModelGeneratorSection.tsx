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
import { Dish } from "@/lib/dishes";

interface AiModelGeneratorSectionProps {
  triggerToast: (message: string, type?: "info" | "success" | "warning") => void;
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

  // TRELLIS generation parameters
  const [skipPreprocess, setSkipPreprocess] = useState(false);
  const [textureSize, setTextureSize] = useState("1024");
  const [meshSimplify, setMeshSimplify] = useState("0.95");

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
    setGenerationStage("Connecting to Hugging Face TRELLIS space…");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      if (skipPreprocess) formData.append("skip_preprocess", "true");
      formData.append("texture_size", textureSize);
      formData.append("mesh_simplify", meshSimplify);

      setGenerationStage("Generating 3D GLB & uploading to Cloudinary storage (1-2 mins)…");

      const res = await fetch("/api/admin/generate-3d", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.model_url) {
        setGeneratedModelUrl(data.model_url);
        if (data.image_url) {
          setPreviewUrl(data.image_url);
        }
        setGeneratedFilename(data.filename);
        triggerToast("3D GLB model generated and saved to Cloudinary!", "success");
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
    if (!generatedModelUrl) {
      setError("Please click 'Generate 3D GLB Model' to synthesize a 3D asset first.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
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
          poster: previewUrl,
          model: generatedModelUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        triggerToast(`"${dishName}" successfully added to restaurant menu!`, "success");
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
      {/* Form & 3D Generator Container */}
      <form onSubmit={handleSaveItemToMenu} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Food Details & Photo Upload */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Utensils className="h-5 w-5 text-blue-400" />
                <span>{dishId ? "Edit Menu Item" : "Add New Dish to Menu"}</span>
              </h3>
              {dishId && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                  Editing Mode
                </Badge>
              )}
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Food Metadata Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paneer Butter Masala"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 290"
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value)}
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-8 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 shadow-inner"
                    />
                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the flavors, ingredients, and spices…"
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 shadow-inner"
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
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Category / Cuisine Tag
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
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

            {/* Food Photo Upload */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-300">
                Food Image Upload (Stored on Cloudinary) *
              </label>
              <div className="relative border-2 border-dashed border-zinc-700 hover:border-blue-500/80 rounded-2xl p-5 text-center transition-colors bg-zinc-950/60 group">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  disabled={isGenerating}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />

                {previewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={previewUrl}
                      alt="Food item preview"
                      className="h-36 w-auto mx-auto rounded-xl object-cover shadow-xl border border-zinc-800"
                    />
                    <p className="text-[11px] text-zinc-400">
                      Cloudinary Stored Image Asset
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <Upload className="h-6 w-6 text-blue-400 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-semibold text-white">
                      Drop dish photo here or click to browse
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      PNG, JPG, or WEBP (Saved directly to Cloudinary)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preset Samples */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 font-medium block">
                Or test with sample dish photos:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { name: "Burger", url: "/images/dishes/burger.png" },
                  { name: "Pizza", url: "/images/dishes/pizza.png" },
                  { name: "Dosa", url: "/images/dishes/dosa.png" },
                  { name: "Pasta", url: "/images/dishes/pasta.png" },
                  { name: "Biryani", url: "/images/dishes/biryani.png" },
                ].map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleLoadSamplePhoto(sample.url, `${sample.name}.png`)}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 hover:border-blue-500 hover:text-white transition-colors shrink-0"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* TRELLIS 3D Generator Options */}
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-300 block">TRELLIS 3D Generator Settings:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipPreprocess}
                    onChange={(e) => setSkipPreprocess(e.target.checked)}
                    disabled={isGenerating}
                    className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Skip Background Removal</span>
                </label>

                <div className="flex items-center gap-2">
                  <label htmlFor="texture-select" className="text-xs">Texture Size:</label>
                  <select
                    id="texture-select"
                    value={textureSize}
                    onChange={(e) => setTextureSize(e.target.value)}
                    disabled={isGenerating}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-0.5 focus:outline-none"
                  >
                    <option value="512">512px</option>
                    <option value="1024">1024px</option>
                    <option value="1536">1536px</option>
                    <option value="2048">2048px</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generate 3D GLB Button */}
            <Button
              type="button"
              onClick={handleGenerate3DModel}
              disabled={isGenerating || !selectedFile}
              className="w-full py-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Synthesizing 3D Model…</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 text-white" />
                  <span>Generate 3D Model (Cloudinary Saved)</span>
                </>
              )}
            </Button>

            {/* Live Progress Banner */}
            {isGenerating && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 space-y-1 animate-pulse">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
                  <span className="font-mono text-white font-bold text-xs">
                    {generationStage || "Communicating with TRELLIS AI Space…"}
                  </span>
                </div>
                <p className="text-[10px] text-blue-300/80">
                  Synthesizing 3D GLB mesh and uploading asset directly to Cloudinary raw storage.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3D Preview & Save to Menu Action */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="h-5 w-5 text-blue-400" />
                <span>Interactive 3D Model & Cloud Asset</span>
              </h3>
              {generatedModelUrl && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 gap-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Cloudinary Ready</span>
                </Badge>
              )}
            </div>

            {/* 3D Model Viewer Container */}
            <div className="relative w-full h-[340px] rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden shadow-inner">
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
                  <div slot="progress-bar" className="w-full bg-blue-600 h-1" />
                </model-viewer>
              ) : isGenerating ? (
                <div className="text-center p-6 space-y-3">
                  <Loader2 className="h-10 w-10 text-blue-400 animate-spin mx-auto" />
                  <p className="text-xs text-zinc-300 font-semibold">
                    Processing 3D Asset on Hugging Face & Cloudinary…
                  </p>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3 text-zinc-500">
                  <Box className="h-12 w-12 stroke-[1.5] text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Upload food photo, click <strong>Generate 3D Model</strong>, then save your item directly to the live restaurant menu.
                  </p>
                </div>
              )}
            </div>

            {/* Cloudinary Asset Metadata & Copy URL */}
            {generatedModelUrl && (
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyModelPathToClipboard}
                    className="flex-1 gap-2 text-xs border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-800 py-2.5"
                  >
                    <Copy className="h-4 w-4 text-blue-400" />
                    <span>Copy Cloudinary Model URL</span>
                  </Button>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <span className="font-semibold text-zinc-200 block text-[11px]">
                    ☁️ Cloud Storage Location:
                  </span>
                  <p className="text-[10px] font-mono text-blue-300 truncate">
                    {generatedModelUrl}
                  </p>
                </div>
              </div>
            )}

            {/* SAVE TO MENU BUTTON */}
            <Button
              type="submit"
              disabled={isSaving || !dishName || !generatedModelUrl}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span>Saving Dish to Menu…</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 text-white" />
                  <span>{dishId ? "Update Dish in Menu" : "Save Item to Menu"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* LIVE MENU ITEMS MANAGER SECTION */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
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
            {isLoadingMenu ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-blue-400" />}
            <span>Refresh Menu</span>
          </Button>
        </div>

        {menuItems.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 space-y-2">
            <Utensils className="h-10 w-10 mx-auto text-zinc-600 stroke-[1.5]" />
            <p className="text-xs text-zinc-400">No dishes found in menu database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((dish) => (
              <div
                key={dish.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3.5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-lg"
              >
                <div className="space-y-3">
                  {/* Item Image / 3D Asset Preview */}
                  <div className="relative h-40 w-full rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                    <img
                      src={dish.poster || "/images/dishes/burger.png"}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-zinc-950/80 text-amber-300 border-amber-500/40 text-[10px]">
                        {dish.badge || "Menu Item"}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge className="bg-emerald-950/90 text-emerald-300 border-emerald-500/50 text-xs font-bold">
                        {dish.price}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{dish.name}</h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                    <span>⏱️ {dish.prepTime || "15 min"}</span>
                    <span>🔥 {dish.calories || "500 kcal"}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditDish(dish)}
                    className="flex-1 gap-1.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Edit Item</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDish(dish.id, dish.name)}
                    className="gap-1.5 text-xs border-red-900/40 bg-red-950/30 text-red-300 hover:bg-red-900/50"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
