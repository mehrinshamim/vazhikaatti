from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import requests
from PIL import Image
from io import BytesIO
import torch
from transformers import CLIPProcessor, CLIPModel

app = FastAPI()
 
import os
@app.on_event("startup")
def load_model():
    global model, processor
    hf_token = os.getenv("HF_TOKEN")
    model = CLIPModel.from_pretrained(
        "openai/clip-vit-base-patch32",
        token=hf_token
    )
    processor = CLIPProcessor.from_pretrained(
        "openai/clip-vit-base-patch32",
        token=hf_token
    )

# #MODEL LOADING WITH HF TOKEN (for private models or to avoid rate limits)
# import os

# hf_token = os.getenv("HF_TOKEN")

# model = CLIPModel.from_pretrained(
#     "openai/clip-vit-base-patch32",
#     token=hf_token
# )

# processor = CLIPProcessor.from_pretrained(
#     "openai/clip-vit-base-patch32",
#     token=hf_token
# )


#MANUAL DOWNLOAD OF MODELS
# # Load CLIP once on startup
# model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
# processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Category → descriptive text labels for CLIP
CATEGORY_LABELS = {
    "pothole":        "pothole or damaged road surface",
    "flooding":       "flooded street or waterlogged road",
    "stray_dogs":     "stray dog on street",
    "poor_lighting":  "dark street with poor visibility at night",
    "construction":   "road construction or building work site",
    "harassment":     "crowded alley or isolated dangerous street",
    "accident":       "vehicle accident or road crash scene",
}

ACCEPT_THRESHOLD = 0.40
WARN_THRESHOLD   = 0.25


class ReportRequest(BaseModel):
    user_id:     str
    location:    str
    coordinates: Optional[str] = None
    category:    str           # must match a key in CATEGORY_LABELS
    title:       str
    description: Optional[str] = None
    rating:      Optional[int] = None
    image_url:   Optional[str] = None


@app.post("/validate")
def validate_report(report: ReportRequest):
    category = report.category.lower()

    # No image → reject
    if not report.image_url:
        return {
            "valid": False,
            "verdict": "rejected",
            "reason": "Image is required for validation."
                }
    # Category not recognized
    if category not in CATEGORY_LABELS:
        return {"valid": False, "verdict": "rejected", "reason": f"Unknown category: {report.category}"}

    # Fetch image
    try:
        resp = requests.get(report.image_url, timeout=10)
        image = Image.open(BytesIO(resp.content)).convert("RGB")
    except Exception as e:
        return {"valid": False, "verdict": "rejected", "reason": f"Could not load image: {str(e)}"}

    # Build label list — selected category first, rest as distractors
    labels = list(CATEGORY_LABELS.values())
    selected_label = CATEGORY_LABELS[category]

    # Run CLIP
    inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1)[0]

    selected_idx = labels.index(selected_label)
    confidence   = probs[selected_idx].item()

    if confidence >= ACCEPT_THRESHOLD:
        verdict = "accepted"
        valid   = True
        reason  = f"Image matches '{report.category}' (confidence: {confidence:.2f})"
    elif confidence >= WARN_THRESHOLD:
        verdict = "warning"
        valid   = True   # let it through but flag it
        reason  = f"Low confidence match for '{report.category}' ({confidence:.2f}). Please verify your image."
    else:
        verdict = "rejected"
        valid   = False
        reason  = f"Image does not appear to match '{report.category}' (confidence: {confidence:.2f})"

    return {
        "valid":      valid,
        "verdict":    verdict,
        "confidence": round(confidence, 4),
        "reason":     reason
    }