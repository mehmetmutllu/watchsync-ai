"""Download SAM 2 model checkpoint."""

import os
import sys
import urllib.request
from pathlib import Path

MODEL_URL = "https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2_hiera_small.pt"
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODEL_DIR / "sam2_hiera_small.pt"


def download():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    if MODEL_PATH.exists():
        size_mb = MODEL_PATH.stat().st_size / (1024 * 1024)
        print(f"Model already exists at {MODEL_PATH} ({size_mb:.1f} MB)")
        return

    print(f"Downloading SAM 2 (hiera_small) to {MODEL_PATH} ...")

    def progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        pct = min(downloaded / total_size * 100, 100) if total_size > 0 else 0
        mb = downloaded / (1024 * 1024)
        total_mb = total_size / (1024 * 1024)
        sys.stdout.write(f"\r  {mb:.1f}/{total_mb:.1f} MB ({pct:.0f}%)")
        sys.stdout.flush()

    urllib.request.urlretrieve(MODEL_URL, str(MODEL_PATH), reporthook=progress)
    print("\nDownload complete.")


if __name__ == "__main__":
    download()
