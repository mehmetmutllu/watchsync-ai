import logging
import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# --- Schemas ---

class ScanRequest(BaseModel):
    reference_number: str

class ScanResultItem(BaseModel):
    source: str
    price: float
    currency: str = "EUR"
    condition: str | None = None
    seller: str | None = None
    url: str | None = None
    country: str | None = None

class ScanResponse(BaseModel):
    reference_number: str
    results: list[ScanResultItem]
    total: int

# --- Mock scraper (production: Playwright/Selenium) ---

async def scrape_chrono24(ref: str) -> list[ScanResultItem]:
    """
    Scrape Chrono24 listings for a given reference number.
    In production, this would use Playwright with headless Chromium.
    Currently returns data from Chrono24's public search API.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                "https://www.chrono24.com/search/index.htm",
                params={"query": ref, "dosearch": "true", "format": "json"},
                headers={"User-Agent": "WatchSyncAI/1.0 MarketScanner"},
            )
            # Parse if available, otherwise return empty
            if resp.status_code != 200:
                logger.warning("Chrono24 scrape returned %d for %s", resp.status_code, ref)
                return []

            # Chrono24 may block or return HTML — handle gracefully
            try:
                data = resp.json()
                items = []
                for listing in data.get("items", data.get("watches", []))[:20]:
                    items.append(ScanResultItem(
                        source="chrono24",
                        price=float(listing.get("price", listing.get("priceValue", 0))),
                        currency=listing.get("currency", "EUR"),
                        condition=listing.get("condition"),
                        seller=listing.get("merchantName", listing.get("seller")),
                        url=listing.get("url"),
                        country=listing.get("country"),
                    ))
                return items
            except (ValueError, KeyError):
                logger.info("Chrono24 returned non-JSON for %s, using fallback", ref)
                return []
    except Exception as e:
        logger.warning("Chrono24 scrape error for %s: %s", ref, str(e))
        return []


async def scrape_watchfinder(ref: str) -> list[ScanResultItem]:
    """
    Scrape Watchfinder for price data.
    Currently a placeholder — production would use Playwright.
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"https://www.watchfinder.com/search?q={ref}",
                headers={"User-Agent": "WatchSyncAI/1.0 MarketScanner"},
            )
            if resp.status_code != 200:
                return []
            # Placeholder: would parse HTML with BeautifulSoup in production
            return []
    except Exception as e:
        logger.warning("Watchfinder scrape error for %s: %s", ref, str(e))
        return []
