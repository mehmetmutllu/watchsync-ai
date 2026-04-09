"""
AI Service Tests — FastAPI endpoint tests
Requires: pip install pytest httpx pytest-asyncio
"""
import io
import pytest
from unittest.mock import patch, MagicMock
from PIL import Image
import numpy as np

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _create_test_image(width=200, height=200, mode="RGB"):
    """Create a test image in memory."""
    img = Image.new(mode, (width, height), color=(128, 128, 128))
    if mode == "RGBA":
        # Add non-transparent alpha
        pixels = img.load()
        for x in range(width):
            for y in range(height):
                pixels[x, y] = (128, 128, 128, 255)
    buf = io.BytesIO()
    fmt = "PNG" if mode == "RGBA" else "JPEG"
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf


# ─── Health Check ─────────────────────────────────────────

class TestHealthEndpoint:
    def test_health_returns_ok(self):
        response = client.get("/api/ai/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data

    def test_health_has_correct_structure(self):
        response = client.get("/api/ai/health")
        data = response.json()
        assert isinstance(data["status"], str)
        assert isinstance(data["model_loaded"], bool)


# ─── Segment Endpoint ────────────────────────────────────

class TestSegmentEndpoint:
    @patch("app.routers.ai.segment_image")
    @patch("app.routers.ai.extract_rgba")
    def test_segment_valid_image(self, mock_extract, mock_segment):
        mock_mask = np.zeros((200, 200), dtype=bool)
        mock_mask[50:150, 50:150] = True
        mock_segment.return_value = mock_mask
        mock_extract.return_value = Image.new("RGBA", (200, 200))

        img_buf = _create_test_image()
        response = client.post(
            "/api/ai/segment",
            files={"image": ("watch.jpg", img_buf, "image/jpeg")},
            data={"point_x": "0.5", "point_y": "0.5"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "mask_url" in data
        assert "rgba_url" in data
        assert data["width"] == 200
        assert data["height"] == 200

    def test_segment_rejects_invalid_format(self):
        buf = io.BytesIO(b"not an image")
        response = client.post(
            "/api/ai/segment",
            files={"image": ("test.txt", buf, "text/plain")},
            data={"point_x": "0.5", "point_y": "0.5"},
        )
        assert response.status_code == 400

    def test_segment_validates_point_range(self):
        img_buf = _create_test_image()
        response = client.post(
            "/api/ai/segment",
            files={"image": ("watch.jpg", img_buf, "image/jpeg")},
            data={"point_x": "1.5", "point_y": "0.5"},
        )
        assert response.status_code == 422  # Validation error


# ─── Replace Background Endpoint ─────────────────────────

class TestReplaceBackgroundEndpoint:
    @patch("app.routers.ai.replace_background")
    def test_replace_background_white_studio(self, mock_replace):
        mock_replace.return_value = Image.new("RGB", (800, 800), (255, 255, 255))

        img_buf = _create_test_image(200, 200, "RGBA")
        response = client.post(
            "/api/ai/replace-background",
            files={"image": ("rgba.png", img_buf, "image/png")},
            data={"preset": "white_studio", "shadow": "true"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "result_url" in data

    @patch("app.routers.ai.replace_background")
    def test_replace_background_all_presets(self, mock_replace):
        mock_replace.return_value = Image.new("RGB", (800, 800))

        for preset in ["white_studio", "black_velvet", "marble", "gradient_gray"]:
            img_buf = _create_test_image(200, 200, "RGBA")
            response = client.post(
                "/api/ai/replace-background",
                files={"image": ("rgba.png", img_buf, "image/png")},
                data={"preset": preset, "shadow": "false"},
            )
            assert response.status_code == 200, f"Failed for preset: {preset}"


# ─── Enhance Endpoint ────────────────────────────────────

class TestEnhanceEndpoint:
    @patch("app.routers.ai.replace_background")
    @patch("app.routers.ai.extract_rgba")
    @patch("app.routers.ai.segment_image")
    def test_enhance_full_pipeline(self, mock_segment, mock_extract, mock_replace):
        mock_mask = np.zeros((200, 200), dtype=bool)
        mock_mask[50:150, 50:150] = True
        mock_segment.return_value = mock_mask
        mock_extract.return_value = Image.new("RGBA", (200, 200))
        mock_replace.return_value = Image.new("RGB", (800, 800))

        img_buf = _create_test_image()
        response = client.post(
            "/api/ai/enhance",
            files={"image": ("watch.jpg", img_buf, "image/jpeg")},
            data={"point_x": "0.5", "point_y": "0.5", "shadow": "true"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "original_url" in data
        assert "rgba_url" in data
        assert "results" in data
        assert isinstance(data["results"], list)


# ─── Scraping Endpoint ───────────────────────────────────

class TestScrapingEndpoint:
    @patch("app.routers.scraping.scrape_chrono24")
    def test_scan_returns_results(self, mock_chrono):
        mock_chrono.return_value = [
            {
                "source": "chrono24",
                "price": 12500.0,
                "currency": "EUR",
                "condition": "Very Good",
                "seller": "WatchDealer",
                "url": "https://chrono24.com/test",
                "country": "DE",
            }
        ]

        response = client.post(
            "/api/scraping/scan",
            json={"reference_number": "126610LN"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["reference_number"] == "126610LN"
        assert len(data["results"]) >= 1
        assert data["results"][0]["source"] == "chrono24"

    @patch("app.routers.scraping.scrape_chrono24")
    def test_scan_empty_results(self, mock_chrono):
        mock_chrono.return_value = []

        response = client.post(
            "/api/scraping/scan",
            json={"reference_number": "NONEXISTENT-REF"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
