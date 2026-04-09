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
    Scan multiple marketplaces for a watch reference number.
    Aggregates results from Chrono24, Watchfinder, etc.
    """
    ref = request.reference_number.strip()
    logger.info("Market scan requested for: %s", ref)

    # Run scrapers concurrently
    import asyncio
    chrono24_results, watchfinder_results = await asyncio.gather(
        scrape_chrono24(ref),
        scrape_watchfinder(ref),
        return_exceptions=True,
    )

    results = []
    if isinstance(chrono24_results, list):
        results.extend(chrono24_results)
    if isinstance(watchfinder_results, list):
        results.extend(watchfinder_results)

    return ScanResponse(
        reference_number=ref,
        results=results,
        total=len(results),
    )


@router.get("/health")
async def scraping_health():
    return {"status": "ok", "service": "scraping"}
