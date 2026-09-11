import { NextResponse } from "next/server";
import { Client } from "@gradio/client";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minute timeout for 3D model generation

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const apiKey = (formData.get("api_key") as string) || process.env.HF_TOKEN || "";
    const ssSamplingSteps = Number(formData.get("ss_sampling_steps") || 12);
    const ssGuidanceStrength = Number(formData.get("ss_guidance_strength") || 7.5);
    const slatSamplingSteps = Number(formData.get("slat_sampling_steps") || 12);
    const slatGuidanceStrength = Number(formData.get("slat_guidance_strength") || 3);
    const seed = Number(formData.get("seed") || 0);

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "Please upload an image file of the food item." },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = imageFile.type || "image/png";
    const base64DataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Save temporary input image for reference
    const tempDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `temp_input_${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    fs.writeFileSync(tempFilePath, buffer);

    const fileDataInput = {
      path: base64DataUrl,
      url: base64DataUrl,
      orig_name: imageFile.name || "food_item.png",
      meta: { _type: "gradio.FileData" },
    };

    const tokenToUse = (apiKey || "").trim();
    console.log("TRELLIS generation starting. Token available:", Boolean(tokenToUse));

    // Connect to Hugging Face TRELLIS Space with HF_TOKEN authorization
    const connectOpts: any = tokenToUse
      ? {
          token: tokenToUse as `hf_${string}`,
          headers: { Authorization: `Bearer ${tokenToUse}` },
        }
      : {};

    const client = await Client.connect("trellis-community/TRELLIS", connectOpts);

    // Submit to TRELLIS /generate_and_extract_glb endpoint using event listener job stream
    const job = client.submit("/generate_and_extract_glb", {
      image: fileDataInput,
      multiimages: [],
      seed: seed,
      ss_guidance_strength: ssGuidanceStrength,
      ss_sampling_steps: ssSamplingSteps,
      slat_guidance_strength: slatGuidanceStrength,
      slat_sampling_steps: slatSamplingSteps,
      multiimage_algo: "stochastic",
      mesh_simplify: 0.95,
      texture_size: 1024,
    });

    const res: any = await job;
    console.log("Job awaited res:", JSON.stringify(res, null, 2));
    const outputData: any = res?.data;

    if (!outputData || !outputData.length) {
      return NextResponse.json(
        { success: false, error: "TRELLIS space did not return a valid GLB model file." },
        { status: 500 }
      );
    }

    console.log("TRELLIS outputData received:", JSON.stringify(outputData, null, 2));

    // Find GLB file in returned outputs
    const glbFileInfo =
      outputData.find((item: any) => {
        const p = item?.url || item?.path || (typeof item === "string" ? item : "");
        return p.toLowerCase().includes(".glb");
      }) ||
      outputData[1] ||
      outputData[2] ||
      outputData[0];

    const glbUrl = typeof glbFileInfo === "string" ? glbFileInfo : glbFileInfo?.url || glbFileInfo?.path;

    if (!glbUrl) {
      return NextResponse.json(
        { success: false, error: "Failed to locate generated .GLB file URL from TRELLIS output." },
        { status: 500 }
      );
    }

    // Download generated GLB model and save to public/generated-models/
    const fetchOpts: any = tokenToUse ? { headers: { Authorization: `Bearer ${tokenToUse}` } } : {};
    let glbRes = await fetch(glbUrl, fetchOpts);
    if (!glbRes.ok) {
      glbRes = await fetch(glbUrl);
    }
    if (!glbRes.ok) {
      throw new Error(`Failed to fetch generated GLB file from ${glbUrl} (status ${glbRes.status})`);
    }
    const glbBuffer = Buffer.from(await glbRes.arrayBuffer());

    const generatedModelsDir = path.join(process.cwd(), "public", "generated-models");
    if (!fs.existsSync(generatedModelsDir)) {
      fs.mkdirSync(generatedModelsDir, { recursive: true });
    }

    const glbFileName = `model_${Date.now()}.glb`;
    const localGlbPath = path.join(generatedModelsDir, glbFileName);
    fs.writeFileSync(localGlbPath, glbBuffer);

    // Clean up temporary input image
    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    } catch {}

    const publicModelPath = `/generated-models/${glbFileName}`;

    return NextResponse.json({
      success: true,
      message: "3D GLB model generated successfully!",
      model_url: publicModelPath,
      filename: glbFileName,
      remote_url: glbUrl,
    });
  } catch (error: any) {
    console.error("TRELLIS generation error stack:", error?.stack || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || error?.title || "Failed to generate 3D model from Hugging Face TRELLIS space.",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
