import { NextResponse } from "next/server";
import { Client, handle_file } from "@gradio/client";
import { execFile } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import os from "os";
import { calculateProportionalArScale } from "@/lib/modelScale";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minute max duration for serverless 3D generation

// Cloudinary credentials provided for persistent Vercel storage
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dakh7ac7j";
const API_KEY = process.env.CLOUDINARY_API_KEY || "318799848925279";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "rsFhOOjOcqraq2iUPSfuQrUxi3g";

/**
 * Upload input image buffer to Cloudinary raw/image storage
 */
async function uploadImageToCloudinary(buffer: Buffer, fileName: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "ar_restaurant_inputs";
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
  formData.append("file", blob, fileName);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

/**
 * Upload generated 3D GLB model buffer to Cloudinary raw storage
 */
async function uploadGlbToCloudinary(buffer: Buffer, fileName: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "ar_restaurant_models";
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: "model/gltf-binary" });
  formData.append("file", blob, fileName);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

export async function POST(req: Request) {
  let tempFilePath: string | null = null;
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const skipPreprocess = formData.get("skip_preprocess") === "true";
    const meshSimplify = parseFloat((formData.get("mesh_simplify") as string) || "0.95");
    const textureSize = parseInt((formData.get("texture_size") as string) || "1024", 10);

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "Please upload an image file of the food item." },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hfToken = process.env.HF_TOKEN || "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";

    // Attempt Option A: Pure Node.js + @gradio/client + Cloudinary Storage (Vercel Compatible)
    try {
      console.log("Vercel-Compatible Flow: Uploading input food photo to Cloudinary...");
      const cloudImage = await uploadImageToCloudinary(buffer, imageFile.name);
      const imageUrl = cloudImage?.secure_url || cloudImage?.url;

      if (imageUrl) {
        console.log("Connecting to TRELLIS space via @gradio/client (Node.js)...");
        const client = await Client.connect("trellis-community/TRELLIS", {
          token: hfToken as `hf_${string}`,
          headers: { Authorization: `Bearer ${hfToken}` },
        });

        // 1. Initialize ZeroGPU server session
        try {
          await client.predict("/start_session", []);
        } catch {}

        // 2. Preprocess image (rembg background removal)
        let imageForGen: any = handle_file(imageUrl);
        if (!skipPreprocess) {
          console.log("Preprocessing image (rembg background removal)...");
          const preprocessed: any = await client.predict("/preprocess_image", [
            handle_file(imageUrl),
          ]);
          const prepObj = preprocessed?.data?.[0];
          const prepUrl = prepObj?.url || prepObj?.path;
          if (prepUrl) {
            imageForGen = handle_file(prepUrl);
          }
        }

        // 3. Generate 3D asset & extract GLB
        console.log("Generating 3D asset via TRELLIS...");
        const seed = Math.floor(Math.random() * 2147483647);
        const result: any = await client.predict("/generate_and_extract_glb", [
          imageForGen,
          [],
          seed,
          7.5,
          12,
          3.0,
          12,
          "stochastic",
          meshSimplify,
          textureSize,
        ]);

        const glbItem = result.data?.[3] || result.data?.[2];
        const glbUrl = glbItem?.url || glbItem?.path;

        if (glbUrl) {
          console.log("Downloading GLB model buffer...");
          const glbRes = await fetch(glbUrl);
          const glbArrayBuffer = await glbRes.arrayBuffer();
          const glbBuffer = Buffer.from(glbArrayBuffer);

          const outFileName = `model_${Date.now()}_${Math.floor(Math.random() * 1000)}.glb`;

          console.log("Uploading GLB to Cloudinary persistent storage...");
          const cloudGlb = await uploadGlbToCloudinary(glbBuffer, outFileName);

          if (!cloudGlb?.secure_url) {
            throw new Error(cloudGlb?.error?.message || "Cloudinary GLB upload failed.");
          }

          const calculatedScale = calculateProportionalArScale(glbBuffer, imageFile.name, []);

          return NextResponse.json({
            success: true,
            model_url: cloudGlb.secure_url,
            image_url: imageUrl,
            filename: outFileName,
            ar_scale: calculatedScale,
            provider: "Cloudinary + HuggingFace TRELLIS",
          });
        }
      }
    } catch (nodeError: any) {
      console.warn("Node.js Gradio client note/error:", nodeError?.message || nodeError);
    }

    // Fallback: Python script execution using system /tmp folder
    const tempDir = os.tmpdir();
    const cleanFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "");
    tempFilePath = path.join(tempDir, `input_${Date.now()}_${cleanFileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    const outFileName = `model_${Date.now()}_${Math.floor(Math.random() * 1000)}.glb`;
    const outFilePath = path.join(tempDir, outFileName);
    const scriptPath = path.join(process.cwd(), "scripts", "generate3d.py");

    const args = [
      scriptPath,
      "--image", tempFilePath,
      "--hf-token", hfToken,
      "--out", outFilePath,
    ];

    if (skipPreprocess) {
      args.push("--skip-preprocess");
    }
    if (meshSimplify) {
      args.push("--mesh-simplify", meshSimplify.toString());
    }
    if (textureSize) {
      args.push("--texture-size", textureSize.toString());
    }

    console.log(`Invoking Python 3D generator script: python3 ${args.join(" ")}`);
    
    const { stdout, stderr } = await execFileAsync("python3", args, {
      timeout: 300000,
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
    });

    // Clean input temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }

    if (fs.existsSync(outFilePath)) {
      const fileBuf = fs.readFileSync(outFilePath);
      const calculatedScale = calculateProportionalArScale(fileBuf, imageFile.name, []);
      const cloudGlb = await uploadGlbToCloudinary(fileBuf, outFileName);

      // Clean output temp file
      try {
        fs.unlinkSync(outFilePath);
      } catch {}

      if (cloudGlb?.secure_url) {
        return NextResponse.json({
          success: true,
          model_url: cloudGlb.secure_url,
          filename: outFileName,
          ar_scale: calculatedScale,
        });
      }
    }

    return NextResponse.json(
      { success: false, error: stderr || stdout || "3D GLB model file generation failed." },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("3D model generation error:", error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate 3D model.",
      },
      { status: 500 }
    );
  }
}
