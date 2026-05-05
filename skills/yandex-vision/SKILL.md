---
name: yandex-vision
description: "Яндекс Vision + OCR — распознавание текста, объектов, лиц. Ключ Yandex Cloud."
metadata:
  openclaw:
    emoji: "👁️"
    requires:
      env: ["YANDEX_VISION_API_KEY"]
      note: "Yandex Cloud API key with ai.vision and ai.ocr roles. OCR endpoint verified: 400 (correct body needed). Vision endpoint verified: 401 (auth needed)."
---

# Yandex Vision + OCR Skill

## Verified Endpoints

```
ocr.api.cloud.yandex.net/ocr/v1/recognizeText → 400 ✅ (POST, needs body)
vision.api.cloud.yandex.net/vision/v1/batchAnalyze → 401 ✅ (auth needed)
```

## Prerequisites

```bash
export YANDEX_VISION_API_KEY="AQVN..."
# From Yandex Cloud → Service Accounts → API key
# Roles: ai.vision.user, ai.ocr.user
# Or use folderId + IAM token
export YANDEX_VISION_FOLDER_ID="b1g..."
```

## OCR — Text Recognition

### From a URL

```bash
curl -X POST "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText" \
  -H "Authorization: Api-Key $YANDEX_VISION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-folder-id: $YANDEX_VISION_FOLDER_ID" \
  -d '{
    "mimeType": "image/png",
    "languageCodes": ["ru", "en"],
    "content": "<base64-encoded-image>"
  }'
```

Or with a public URL:

```bash
curl -X POST "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText" \
  -H "Authorization: Api-Key $YANDEX_VISION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-folder-id: $YANDEX_VISION_FOLDER_ID" \
  -d '{
    "mimeType": "image/jpeg",
    "languageCodes": ["ru", "en"],
    "uri": "https://example.com/receipt.jpg"
  }'
```

### Extract text from local image

```python
import os, base64, requests, json

with open("receipt.jpg", "rb") as f:
    content = base64.b64encode(f.read()).decode("utf-8")

resp = requests.post(
    "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText",
    headers={
        "Authorization": f"Api-Key {os.environ['YANDEX_VISION_API_KEY']}",
        "x-folder-id": os.environ.get("YANDEX_VISION_FOLDER_ID", ""),
        "Content-Type": "application/json",
    },
    json={
        "mimeType": "image/jpeg",
        "languageCodes": ["ru", "en"],
        "content": content,
    },
)

result = resp.json()
for block in result.get("textAnnotations", {}).get("blocks", []):
    for line in block.get("lines", []):
        text = " ".join(w["text"] for w in line.get("words", []))
        confidence = max(w.get("confidence", 0) for w in line.get("words", []))
        if confidence > 0.5:
            print(text)
```

### OCR with bounding boxes (for layout)

```python
for block in result.get("textAnnotations", {}).get("blocks", []):
    bbox = block.get("boundingBox", {})
    vertices = bbox.get("vertices", [])
    if vertices:
        x = int(vertices[0].get("x", 0))
        y = int(vertices[0].get("y", 0))
        text = " ".join(
            w["text"]
            for line in block.get("lines", [])
            for w in line.get("words", [])
        )
        print(f"[{x},{y}] {text}")
```

## Object Detection

```bash
curl -X POST "https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze" \
  -H "Authorization: Api-Key $YANDEX_VISION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-folder-id: $YANDEX_VISION_FOLDER_ID" \
  -d '{
    "analyzeSpecs": [{
      "content": "<base64-image>",
      "features": [{
        "type": "OBJECT_DETECTION",
        "config": "standard"
      }]
    }],
    "folderId": "'$YANDEX_VISION_FOLDER_ID'"
  }'
```

### Parse detection results

```python
resp = requests.post(
    "https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze",
    headers={
        "Authorization": f"Api-Key {os.environ['YANDEX_VISION_API_KEY']}",
        "x-folder-id": os.environ.get("YANDEX_VISION_FOLDER_ID", ""),
        "Content-Type": "application/json",
    },
    json={
        "analyzeSpecs": [{
            "content": content,
            "features": [{"type": "OBJECT_DETECTION", "config": "standard"}],
        }],
        "folderId": os.environ.get("YANDEX_VISION_FOLDER_ID", ""),
    },
)

data = resp.json()
for result in data.get("results", []):
    for obj in result.get("results", [])[0].get("objects", []):
        name = obj.get("name", "unknown")
        confidence = obj.get("confidence", 0)
        vertices = obj.get("boundingBox", {}).get("vertices", [])
        print(f"{name} ({confidence:.1%})")
```

## Face Detection

```bash
# Same endpoint, different feature type
curl -X POST "https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze" \
  -H "Authorization: Api-Key $YANDEX_VISION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-folder-id: $YANDEX_VISION_FOLDER_ID" \
  -d '{
    "analyzeSpecs": [{
      "content": "<base64-image>",
      "features": [{"type": "FACE_DETECTION"}]
    }],
    "folderId": "'$YANDEX_VISION_FOLDER_ID'"
  }'
```

## Image Classification

```bash
curl -X POST "https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze" \
  -H "Authorization: Api-Key $YANDEX_VISION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "x-folder-id: $YANDEX_VISION_FOLDER_ID" \
  -d '{
    "analyzeSpecs": [{
      "content": "<base64-image>",
      "features": [{"type": "CLASSIFICATION", "classificationConfig": {"model": "default"}}]
    }],
    "folderId": "'$YANDEX_VISION_FOLDER_ID'"
  }'
```

## Unified Python Helper

```python
import os, base64, requests

def yv_ocr(image_path=None, image_url=None, langs=["ru", "en"]):
    """Extract text from image using Yandex OCR"""
    url = "https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText"
    headers = {
        "Authorization": f"Api-Key {os.environ['YANDEX_VISION_API_KEY']}",
        "x-folder-id": os.environ.get("YANDEX_VISION_FOLDER_ID", ""),
        "Content-Type": "application/json",
    }
    body = {"mimeType": "image/jpeg", "languageCodes": langs}
    
    if image_url:
        body["uri"] = image_url
    elif image_path:
        with open(image_path, "rb") as f:
            body["content"] = base64.b64encode(f.read()).decode("utf-8")
    else:
        raise ValueError("Need image_path or image_url")
    
    resp = requests.post(url, headers=headers, json=body)
    data = resp.json()
    
    lines = []
    for block in data.get("textAnnotations", {}).get("blocks", []):
        for line in block.get("lines", []):
            text = " ".join(w["text"] for w in line.get("words", []))
            conf = min(w.get("confidence", 0) for w in line.get("words", []))
            lines.append((text, conf))
    return lines

def yv_detect(image_path, feature="OBJECT_DETECTION"):
    """Detect objects or faces in image"""
    url = "https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze"
    headers = {
        "Authorization": f"Api-Key {os.environ['YANDEX_VISION_API_KEY']}",
        "x-folder-id": os.environ.get("YANDEX_VISION_FOLDER_ID", ""),
        "Content-Type": "application/json",
    }
    with open(image_path, "rb") as f:
        content = base64.b64encode(f.read()).decode("utf-8")
    
    resp = requests.post(url, headers=headers, json={
        "analyzeSpecs": [{"content": content, "features": [{"type": feature}]}],
        "folderId": os.environ.get("YANDEX_VISION_FOLDER_ID", ""),
    })
    return resp.json()

# Usage:
# lines = yv_ocr(image_url="https://example.com/doc.jpg")
# for text, conf in lines:
#     if conf > 0.5: print(text)
#
# objects = yv_detect("photo.jpg", "OBJECT_DETECTION")
# faces = yv_detect("selfie.jpg", "FACE_DETECTION")
```

## Important Notes

- **OCR auth:** `Authorization: Api-Key <key>` OR `Authorization: Bearer <token>`
- **Vision auth:** same, + `x-folder-id` header
- **Image formats:** JPEG, PNG, PDF (single page), TIFF
- **Max size:** 20 MB for OCR, 10 MB for Vision
- **Languages:** `ru`, `en`, `tr`, `fr`, `de`, `es`, etc. — 60+ languages
- **OCR model:** `page` (default, structured) or `line` (simple text lines)
- **Confidence:** 0.0-1.0, filter < 0.5 for noise
- **Rate limits:** ~5 requests/second for OCR, ~1 req/s for Vision
- **Pricing:** OCR ~1₽ per page, Vision ~1₽ per image
