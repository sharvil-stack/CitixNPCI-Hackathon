"""Local OCR (EasyOCR, Hindi + English). Images never leave this machine and are never saved."""
import io

_reader = None


def read_text(data):
    global _reader
    try:
        import easyocr
    except ImportError:
        raise RuntimeError("OCR is not installed. In the backend folder run: pip install -r requirements-ocr.txt")
    import numpy as np
    from PIL import Image
    if _reader is None:
        _reader = easyocr.Reader(["hi", "en"], gpu=False)  # first run downloads the models
    im = Image.open(io.BytesIO(data)).convert("RGB")
    im.thumbnail((1600, 1600))
    return "\n".join(_reader.readtext(np.array(im), detail=0, paragraph=False))
