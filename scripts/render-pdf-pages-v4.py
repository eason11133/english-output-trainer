import base64
import hashlib
import io
import json
import sys

import pypdfium2 as pdfium


request = json.load(sys.stdin)
pdf_bytes = base64.b64decode(request["base64"], validate=True)
document = pdfium.PdfDocument(pdf_bytes)
pages = []
for index in range(len(document)):
    image = document[index].render(scale=2).to_pil().convert("RGB")
    encoded = io.BytesIO()
    image.save(encoded, format="PNG", optimize=False)
    png = encoded.getvalue()
    pages.append({
        "page": index + 1,
        "mimeType": "image/png",
        "base64": base64.b64encode(png).decode("ascii"),
        "width": image.width,
        "height": image.height,
        "sha256": hashlib.sha256(png).hexdigest(),
        "derivation": "DETERMINISTIC_PDF_PAGE_RENDER",
    })
json.dump({"pdfSha256": hashlib.sha256(pdf_bytes).hexdigest(), "pageCount": len(pages), "pages": pages}, sys.stdout)
