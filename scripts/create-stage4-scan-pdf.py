from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageChops
from pypdf import PdfReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artifacts" / "live-acceptance" / "teacher-vision-input.png"
OUTPUT_DIR = ROOT / "artifacts" / "stage4-live-input"
OUTPUT = OUTPUT_DIR / "learner-writing.pdf"
METADATA = OUTPUT_DIR / "acceptance-metadata.json"
RENDER = ROOT / "tmp" / "pdfs" / "stage4-live-input" / "learner-writing-page-1.png"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
RENDER.parent.mkdir(parents=True, exist_ok=True)

with Image.open(SOURCE) as source_image:
    source_rgb = source_image.convert("RGB")
    width, height = source_rgb.size
    source_sha256 = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    source_pixels_sha256 = hashlib.sha256(source_rgb.tobytes()).hexdigest()

pdf = canvas.Canvas(str(OUTPUT), pagesize=(width, height), pageCompression=1)
pdf.setTitle("EOT Stage 4 learner writing scan")
pdf.setAuthor("EOT acceptance tooling")
pdf.drawImage(str(SOURCE), 0, 0, width=width, height=height, preserveAspectRatio=True, mask="auto")
pdf.showPage()
pdf.save()

reader = PdfReader(OUTPUT)
if len(reader.pages) != 1:
    raise RuntimeError(f"expected one page, got {len(reader.pages)}")
page = reader.pages[0]
xobjects = page["/Resources"]["/XObject"].get_object()
images = [item.get_object() for item in xobjects.values() if item.get_object().get("/Subtype") == "/Image"]
if len(images) != 1:
    raise RuntimeError(f"expected one embedded page image, got {len(images)}")
embedded = images[0]
embedded_size = (int(embedded["/Width"]), int(embedded["/Height"]))
if embedded_size != (width, height):
    raise RuntimeError(f"embedded image dimensions changed: {embedded_size} != {(width, height)}")
embedded_pixels_sha256 = hashlib.sha256(embedded.get_data()).hexdigest()
if embedded_pixels_sha256 != source_pixels_sha256:
    raise RuntimeError("embedded RGB pixels differ from the authentic source image")

document = pdfium.PdfDocument(OUTPUT)
rendered = document[0].render(scale=1).to_pil().convert("RGB")
rendered.save(RENDER)
if rendered.size != (width, height):
    raise RuntimeError(f"rendered dimensions changed: {rendered.size} != {(width, height)}")
difference = ImageChops.difference(source_rgb, rendered)
bounds = difference.getbbox()

metadata = {
    "schemaVersion": 1,
    "assetType": "DERIVED_SCAN_PDF_FROM_REAL_LEARNER_WORK_IMAGE",
    "source": "artifacts/live-acceptance/teacher-vision-input.png",
    "output": "artifacts/stage4-live-input/learner-writing.pdf",
    "independentLearnerSample": False,
    "purpose": "Qualify the production PDF container/intake path using the same authentic learner-work page as image qualification",
    "pageCount": 1,
    "sourcePixelDimensions": {"width": width, "height": height},
    "embeddedPixelDimensions": {"width": embedded_size[0], "height": embedded_size[1]},
    "sourceFileSha256": source_sha256,
    "sourceRgbPixelsSha256": source_pixels_sha256,
    "embeddedRgbPixelsSha256": embedded_pixels_sha256,
    "embeddedPixelsExact": True,
    "renderedDimensionsMatch": True,
    "renderDifferenceBounds": list(bounds) if bounds else None,
    "semanticAlteration": False,
    "paidAiCalls": 0,
}
METADATA.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
print(json.dumps(metadata, indent=2))
