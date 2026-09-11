#!/usr/bin/env python3
"""
Image -> 3D GLB using the TRELLIS Hugging Face Space
(https://huggingface.co/spaces/trellis-community/TRELLIS)

What it does
------------
1. Connects to the Space with your HF token (needed because generation runs
   on a ZeroGPU worker, which requires a signed-in account).
2. Sends your image to the Space's "/preprocess_image" endpoint, which
   removes the background (via rembg) the same way the web UI does on
   upload.
3. Sends the preprocessed image to "/generate_and_extract_glb", which runs
   the full TRELLIS pipeline and extracts a GLB mesh.
4. Copies the resulting .glb file to a local path you choose.

Install
-------
    pip install gradio_client

Usage
-----
    python trellis_to_glb.py --image cat.png --hf-token hf_xxx --out cat.glb

Get a token at https://huggingface.co/settings/tokens (a "read" token is
enough). Note the endpoint names above come from reading the Space's
current app.py; if trellis-community updates the Space and this breaks, run

    python -c "from gradio_client import Client; Client('trellis-community/TRELLIS', token='hf_xxx').view_api()"

to print the current list of endpoints/parameters and adjust the api_name
strings below accordingly.
"""

import argparse
import random
import shutil
import sys
import traceback

from gradio_client import Client, handle_file

SPACE_ID = "trellis-community/TRELLIS"
MAX_SEED = 2**31 - 1


def _extract_path(value):
    """File-type outputs from gradio_client can come back as a plain path
    string or as a dict (FileData) with a 'path'/'url' key, depending on
    the Gradio version the Space is running. Normalize to a path/URL."""
    if isinstance(value, dict):
        return value.get("path") or value.get("url")
    return value


def generate_glb(
    image_path: str,
    hf_token: str,
    out_path: str = "model.glb",
    seed: int = 0,
    randomize_seed: bool = True,
    skip_preprocess: bool = False,
    ss_guidance_strength: float = 7.5,
    ss_sampling_steps: int = 12,
    slat_guidance_strength: float = 3.0,
    slat_sampling_steps: int = 12,
    mesh_simplify: float = 0.95,
    texture_size: int = 1024,
) -> str:
    if randomize_seed:
        seed = random.randint(0, MAX_SEED)

    print(f"Connecting to {SPACE_ID} ...")
    client = Client(SPACE_ID, token=hf_token)

    # The Space creates a per-session temp folder via `demo.load(start_session)`,
    # which normally fires when a browser loads the page. Pure API access via
    # gradio_client never triggers that "page load" event on its own, so the
    # server-side temp folder for this session_hash is never created — and
    # generate_and_extract_glb then fails with a bare FileNotFoundError trying
    # to write sample.mp4/sample.glb into it. Fire it explicitly first.
    try:
        print("Starting session ...")
        client.predict(api_name="/start_session")
    except Exception as e:
        print(f"(warning) could not explicitly start session ({e}); continuing anyway", file=sys.stderr)

    if skip_preprocess:
        image_for_generation = handle_file(image_path)
    else:
        print("Preprocessing image (background removal) ...")
        # Positional args, in the exact order the Space's app.py declares
        # them, to avoid depending on the API's (sometimes non-obvious)
        # keyword-argument names.
        preprocessed = client.predict(
            handle_file(image_path),
            api_name="/preprocess_image",
        )
        image_for_generation = handle_file(_extract_path(preprocessed))

    print("Generating 3D asset (this typically takes 1-2 minutes) ...")
    # Order matches the Space's app.py inputs=[...] list for
    # generate_and_extract_glb, MINUS `is_multiimage`: that value is backed
    # by a gr.State component, which Gradio excludes from the client-facing
    # API (it's managed server-side, not supplied by callers).
    result = client.predict(
        image_for_generation,   # image
        [],                     # multiimages (empty gallery, single-image mode)
        seed,
        ss_guidance_strength,
        ss_sampling_steps,
        slat_guidance_strength,
        slat_sampling_steps,
        "stochastic",           # multiimage_algo
        mesh_simplify,
        texture_size,
        api_name="/generate_and_extract_glb",
    )
    # result == (state_dict, video_path, glb_path_for_viewer, glb_path_for_download)
    print(f"DEBUG raw result from generate_and_extract_glb:\n{result!r}\n")
    candidates = [result[i] for i in (3, 2) if len(result) > i]
    glb_path = next((_extract_path(c) for c in candidates if _extract_path(c)), None)

    if not glb_path:
        raise RuntimeError(f"Could not find a GLB path in the response: {result!r}")

    print(f"DEBUG resolved glb_path = {glb_path!r} (exists on disk: {__import__('os').path.exists(glb_path) if isinstance(glb_path, str) else 'n/a'})")
    shutil.copyfile(glb_path, out_path)
    print(f"Saved GLB to {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(
        description="Generate a 3D GLB model from an image using the TRELLIS HF Space."
    )
    parser.add_argument("--image", required=True, help="Path to input image (png/jpg).")
    parser.add_argument("--hf-token", required=True, help="Hugging Face access token (hf_...).")
    parser.add_argument("--out", default="model.glb", help="Output .glb file path.")
    parser.add_argument("--seed", type=int, default=0, help="Seed to use if --no-random-seed is set.")
    parser.add_argument(
        "--no-random-seed", action="store_true",
        help="Use --seed instead of a random seed for reproducible results.",
    )
    parser.add_argument(
        "--skip-preprocess", action="store_true",
        help="Skip background removal (use if your image already has a clean/transparent background).",
    )
    parser.add_argument("--mesh-simplify", type=float, default=0.95, help="Mesh simplification factor (0.9-0.98).")
    parser.add_argument("--texture-size", type=int, default=1024, help="Texture resolution (512/1024/1536/2048).")
    args = parser.parse_args()

    try:
        generate_glb(
            image_path=args.image,
            hf_token=args.hf_token,
            out_path=args.out,
            seed=args.seed,
            randomize_seed=not args.no_random_seed,
            skip_preprocess=args.skip_preprocess,
            mesh_simplify=args.mesh_simplify,
            texture_size=args.texture_size,
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        print("\nFull traceback:", file=sys.stderr)
        traceback.print_exc()
        print(
            "\nTip: if the Space's API changed, inspect its current endpoints with:\n"
            "  python -c \"from gradio_client import Client; "
            "Client('trellis-community/TRELLIS', token='YOUR_TOKEN').view_api()\"",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()