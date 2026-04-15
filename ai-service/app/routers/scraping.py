import asyncio
import logging
from fastapi import APIRouter

from app.services.scraping import (
    ScanRequest,
    ScanResponse,
    scrape_chrono24,
    scrape_watchfinder,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/scan", response_model=ScanResponse)
async def scan_market(request: ScanRequest):
    """
    Scan Chrono24 + Watchfinder for a watch reference via JSON-LD extraction.
    Zero ban risk — reads only schema.org structured data.
    eBay Browse API is called from the Laravel backend directly.
    """
    ref = request.reference_number.strip()
    logger.info("Market scan requested for: %s", ref)

    chrono24_results, watchfinder_results = await asyncio.gather(
        scrape_chrono24(ref),
        scrape_watchfinder(ref),
        return_exceptions=True,
    )

    results = []
    for source_results in [chrono24_results, watchfinder_results]:
        if isinstance(source_results, list):
            results.extend(source_results)

    # Deduplicate by (source, price, seller)
    seen = set()
    deduped = []
    for item in results:
        key = (item.source, round(item.price, 2), item.seller)
        if key not in seen:
            seen.add(key)
            deduped.append(item)

    deduped = [item for item in deduped if item.price > 0]

    return ScanResponse(
        reference_number=ref,
        results=deduped,
        total=len(deduped),
    )


@router.get("/health")
async def scraping_health():
    return {
        "status": "ok",
        "service": "scraping",
        "strategies": ["chrono24_jsonld", "watchfinder_jsonld"],
        "note": "eBay Browse API handled by Laravel backend",
    }
