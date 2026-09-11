import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minute timeout for 3D model generation

export async function POST(req: Request) {
  let tempFilePath: string | null = null;
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "Please upload an image file of the food item." },
        { status: 400 }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save temporary upload image in system /tmp directory
    const tempDir = os.tmpdir();
    const cleanFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "");
    tempFilePath = path.join(tempDir, `input_${Date.now()}_${cleanFileName}`);
    fs.writeFileSync(tempFilePath, buffer);

    const scriptPath = path.join(process.cwd(), "generate_3d.py");

    console.log(`Invoking Python 3D generator script: python3 ${scriptPath} ${tempFilePath}`);
    
    // Execute Python gradio_client generation script
    const { stdout, stderr } = await execFileAsync("python3", [scriptPath, tempFilePath], {
      timeout: 300000,
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
    });

    if (stderr) {
      console.log("Python 3D generator stderr:", stderr);
    }

    // Clean up temp image
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }

    const lines = stdout.trim().split("\n");
    const jsonLine = lines.find((line) => line.startsWith("{")) || lines[lines.length - 1];
    const result = JSON.parse(jsonLine);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to generate 3D model." },
        { status: 500 }
      );
    }
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
        error: error?.message || "Failed to execute Python 3D model generator.",
      },
      { status: 500 }
    );
  }
}
