import os
import uuid
import asyncio
import base64
from typing import Dict, Any
import httpx
from app.core.config import settings

# Helper to call Replicate API
async def _replicate_generate(prompt: str) -> str:
    """Generate an image URL via Replicate stable diffusion.
    Returns the first image URL if successful.
    """
    token = settings.REPLICATE_API_TOKEN
    model_version = getattr(settings, "REPLICATE_MODEL_VERSION", "")
    if not token or not model_version:
        raise RuntimeError("Replicate token or model version not configured")
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "version": model_version,
        "input": {"prompt": prompt, "width": 512, "height": 512, "num_outputs": 1},
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post("https://api.replicate.com/v1/predictions", json=payload, headers=headers)
        resp.raise_for_status()
        pred = resp.json()
        # Poll until completion
        while pred.get("status") not in ("succeeded", "failed"):
            await asyncio.sleep(2)
            get_resp = await client.get(pred["urls"]["get"], headers=headers)
            get_resp.raise_for_status()
            pred = get_resp.json()
        if pred.get("status") == "succeeded":
            # Replicate returns a list of URLs under "output"
            return pred["output"][0]
        else:
            raise RuntimeError(f"Replicate generation failed: {pred.get('error')}")

# Helper to call Stability AI API
async def _stability_generate(prompt: str) -> str:
    """Generate a base64‑encoded PNG via Stability AI and return a data URL."""
    key = settings.STABILITY_API_KEY
    if not key:
        raise RuntimeError("Stability API key not configured")
    engine_id = getattr(settings, "STABILITY_ENGINE_ID", "stable-diffusion-v1-5")
    url = f"https://api.stability.ai/v1/generation/{engine_id}/text-to-image"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    payload = {
        "text_prompts": [{"text": prompt}],
        "cfg_scale": 7,
        "clip_guidance_preset": "FAST_GREEN",
        "height": 512,
        "width": 512,
        "samples": 1,
        "steps": 30,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        result = resp.json()
        # Stability returns base64‑encoded images under "artifacts"
        image_b64 = result["artifacts"][0]["base64"]
        return f"data:image/png;base64,{image_b64}"

async def generate_exterior(style: str) -> Dict[str, Any]:
    """Generate exterior rendering images.
    Returns dict with a primary image URL and metadata.
    """
    prompt = f"Luxury exterior architecture, {style} style, photorealistic rendering, day lighting"
    try:
        image_url = await _replicate_generate(prompt)
    except Exception:
        image_url = await _stability_generate(prompt)
    return {
        "style": style,
        "imageUrl": image_url,
        "title": f"Exterior Render – {style.capitalize()}",
    }

async def generate_elevation(style: str, floors: int = 2) -> Dict[str, Any]:
    """Generate elevation rendering for a building.
    Returns dict with image URLs and key features.
    """
    prompt = f"Architectural elevation, {style} style, {floors}-story building, photorealistic, front view"
    try:
        image_url = await _replicate_generate(prompt)
    except Exception:
        image_url = await _stability_generate(prompt)
    return {
        "style": style,
        "floors": floors,
        "imageUrl": image_url,
        "title": f"Elevation – {style.capitalize()} ({floors}‑story)",
    }
