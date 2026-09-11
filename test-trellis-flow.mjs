import { Client, handle_file } from "@gradio/client";
import fs from "fs";
import path from "path";

/**
 * Utility script to test 3D GLB model generation via Hugging Face TRELLIS space
 */
async function testTrellis() {
  console.log("Connecting to TRELLIS space...");
  const token = process.env.HF_TOKEN;
  let client;
  try {
    if (token) {
      client = await Client.connect("trellis-community/TRELLIS", { token });
    } else {
      client = await Client.connect("trellis-community/TRELLIS");
    }
  } catch (e) {
    console.warn("Connect with token failed, falling back to public connection:", e.message);
    client = await Client.connect("trellis-community/TRELLIS");
  }

  console.log("Connected! Preprocessing input image...");
  const sampleImagePath = path.join(process.cwd(), "public", "images", "dishes", "burger.png");
  let imageInput;
  if (fs.existsSync(sampleImagePath)) {
    const buffer = fs.readFileSync(sampleImagePath);
    const blob = new Blob([buffer], { type: "image/png" });
    imageInput = handle_file(blob);
  } else {
    imageInput = "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png";
  }

  let processedImage = imageInput;
  try {
    const pre = await client.predict("/preprocess_image", { image: imageInput });
    console.log("Preprocess output:", pre.data);
    if (pre.data && pre.data[0]) {
      processedImage = pre.data[0];
    }
  } catch (e) {
    console.warn("Preprocess skipped/warned:", e.message);
  }

  console.log("Generating 3D model via /generate_and_extract_glb...");
  const gen = await client.predict("/generate_and_extract_glb", {
    image: processedImage,
    multiimages: [],
    seed: 0,
    ss_guidance_strength: 7.5,
    ss_sampling_steps: 12,
    slat_guidance_strength: 3,
    slat_sampling_steps: 12,
    multiimage_algo: "stochastic",
    mesh_simplify: 0.95,
    texture_size: 1024,
  });

  console.log("Raw output data:", JSON.stringify(gen.data, null, 2));
}

testTrellis().catch(console.error);
