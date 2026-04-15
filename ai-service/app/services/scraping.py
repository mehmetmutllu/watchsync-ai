import logging
import os
import json
import re
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


# ============================================================
# Chrono24 — JSON-LD structured data extraction (low risk)
# Reads only schema.org markup meant for search engines.
# No JavaScript execution, no headless browser, no automation.
# ============================================================

async def scrape_chrono24(ref: str) -> list[ScanResultItem]:
    """
    Extract watch prices from Chrono24 using JSON-LD structured data.
    This reads schema.org markup that Chrono24 embeds for search engines
    (Google, Bing etc.) — same technique, minimal footprint, no ban risk.
    """
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(
                "https://www.chrono24.com/search/index.htm",
                params={"query": ref, "dosearch": "true"},
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                    "Accept": "text/html,application/xhtml+xml",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )

            if resp.status_code != 200:
                logger.warning("Chrono24 returned %d for %s", resp.status_code, ref)
                return []

            html = resp.text
            items = []

            # Extract JSON-LD structured data
            json_ld_matches = re.findall(
                r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
                html, re.DOTALL,
            )
            for match in json_ld_matches:
                try:
                    ld = json.loads(match.strip())
                    if isinstance(ld, list):
                        for item in ld:
                            p = _extract_jsonld_price(item, "chrono24")
                            if p:
                                items.append(p)
                    elif isinstance(ld, dict):
                        if ld.get("@type") == "ItemList":
                            for elem in ld.get("itemListElement", []):
                                inner = elem.get("item", elem)
                                p = _extract_jsonld_price(inner, "chrono24")
                                if p:
                                    items.append(p)
                        else:
                            p = _extract_jsonld_price(ld, "chrono24")
                            if p:
                                items.append(p)
                except json.JSONDecodeError:
                    continue

            if items:
                logger.info("Chrono24 JSON-LD returned %d results for %s", len(items), ref)

            return items[:20]
    except Exception as e:
        logger.warning("Chrono24 error for %s: %s", ref, str(e))
        return []


# ============================================================
# Watchfinder — JSON-LD + regex price extraction (low risk)
# ============================================================

async def scrape_watchfinder(ref: str) -> list[ScanResultItem]:
    """
    Extract watch prices from Watchfinder using JSON-LD and regex fallback.
    """
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(
                f"https://www.watchfinder.com/search/?q={ref}",
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                    "Accept": "text/html,application/xhtml+xml",
                    "Accept-Language": "en-GB,en;q=0.9",
                },
            )
            if resp.status_code != 200:
                return []

            html = resp.text
            items = []

            # JSON-LD extraction
            json_ld_matches = re.findall(
                r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
                html, re.DOTALL,
            )
            for match in json_ld_matches:
                try:
                    ld = json.loads(match.strip())
                    if isinstance(ld, list):
                        for item in ld:
                            p = _extract_jsonld_price(item, "watchfinder")
                            if p:
                                items.append(p)
                    elif isinstance(ld, dict):
                        if ld.get("@type") == "ItemList":
                            for elem in ld.get("itemListElement", []):
                                inner = elem.get("item", elem)
                                p = _extract_jsonld_price(inner, "watchfinder")
                                if p:
                                    items.append(p)
                        else:
                            p = _extract_jsonld_price(ld, "watchfinder")
                            if p:
                                items.append(p)
                except json.JSONDecodeError:
                    continue

            # Regex fallback: extract price patterns like £12,345
            if not items:
                price_pattern = re.compile(r'[£€$]([\d,]+(?:\.\d{2})?)')
                found_prices = price_pattern.findall(html)
                seen: set[float] = set()
                for price_str in found_prices[:20]:
                    price_num = float(price_str.replace(",", ""))
                    if 500 < price_num < 500000 and price_num not in seen:
                        seen.add(price_num)
                        items.append(ScanResultItem(
                            source="watchfinder",
                            price=price_num,
                            currency="GBP",
                            condition=None,
                            seller="Watchfinder",
                            url=f"https://www.watchfinder.com/search/?q={ref}",
                            country="UK",
                        ))

            if items:
                logger.info("Watchfinder returned %d results for %s", len(items), ref)

            return items[:20]
    except Exception as e:
        logger.warning("Watchfinder error for %s: %s", ref, str(e))
        return []


# ============================================================
# Shared JSON-LD price extractor
# ============================================================

def _extract_jsonld_price(item: dict, source: str) -> ScanResultItem | None:
    """Extract price from a JSON-LD Product/Offer object."""
    offers = item.get("offers", {})
    if isinstance(offers, list):
        offers = offers[0] if offers else {}

    price = offers.get("price", offers.get("lowPrice", 0))
    try:
        price = float(price)
    except (ValueError, TypeError):
        return None

    if price <= 0:
        return None

    currency = offers.get("priceCurrency", "EUR")
    seller_info = offers.get("seller", {})
    seller_name = seller_info.get("name") if isinstance(seller_info, dict) else None
    url = offers.get("url", item.get("url"))
    condition_raw = item.get("itemCondition", "")
    condition = condition_raw.split("/")[-1] if condition_raw else None

    return ScanResultItem(
        source=source,
        price=price,
        currency=currency,
        condition=condition,
        seller=seller_name,
        url=url,
        country=None,
    )
