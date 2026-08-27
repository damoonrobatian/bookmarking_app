from __future__ import annotations

import logging
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.config import get_settings
from app.services.ssrf import UnsafeURLError, validate_public_http_url
from app.utils.urls import domain_from_url

logger = logging.getLogger(__name__)

USER_AGENT = "NeshanakBookmarkManager/0.1 (+https://github.com/damoonrobatian/bookmarking_app)"


@dataclass
class PageMetadata:
    title: str | None
    description: str | None
    favicon_url: str | None
    page_domain: str | None
    status: str


def extract_metadata(url: str) -> PageMetadata:
    domain = domain_from_url(url)
    try:
        validate_public_http_url(url)
    except UnsafeURLError as exc:
        logger.info("Skipping metadata fetch for unsafe URL %s: %s", url, exc)
        return PageMetadata(None, None, None, domain, "blocked")

    settings = get_settings()
    try:
        with httpx.Client(
            timeout=settings.metadata_timeout_seconds,
            follow_redirects=False,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"},
        ) as client:
            html, final_url = _fetch_html(client, url, settings.metadata_max_bytes)
    except httpx.TimeoutException:
        logger.info("Metadata fetch timed out for %s", url)
        return PageMetadata(None, None, None, domain, "timeout")
    except httpx.HTTPError as exc:
        logger.info("Metadata fetch failed for %s: %s", url, exc)
        return PageMetadata(None, None, None, domain, "unreachable")
    except UnsafeURLError as exc:
        logger.info("Redirect to unsafe URL for %s: %s", url, exc)
        return PageMetadata(None, None, None, domain, "blocked")

    if html is None:
        return PageMetadata(None, None, None, domain, "unavailable")

    title, description, favicon = _parse_html(html, final_url or url)
    return PageMetadata(title, description, favicon, domain, "ok")


def _fetch_html(client: httpx.Client, url: str, max_bytes: int, redirects_left: int = 3) -> tuple[str | None, str]:
    validate_public_http_url(url)
    response = client.get(url)
    if response.is_redirect:
        location = response.headers.get("location")
        if not location or redirects_left <= 0:
            return None, url
        next_url = urljoin(url, location)
        validate_public_http_url(next_url)
        return _fetch_html(client, next_url, max_bytes, redirects_left - 1)

    if response.status_code >= 400:
        return None, str(response.url)

    content_type = response.headers.get("content-type", "")
    if "html" not in content_type.lower() and content_type:
        return None, str(response.url)

    content = response.content[:max_bytes]
    return content.decode(response.encoding or "utf-8", errors="replace"), str(response.url)


def _parse_html(html: str, base_url: str) -> tuple[str | None, str | None, str | None]:
    soup = BeautifulSoup(html, "html.parser")
    og_title = _meta(soup, property="og:title")
    title = og_title or (soup.title.string.strip() if soup.title and soup.title.string else None)
    description = _meta(soup, property="og:description") or _meta(soup, name="description")
    favicon = _favicon(soup, base_url)
    return title, description, favicon


def _meta(soup: BeautifulSoup, *, property: str | None = None, name: str | None = None) -> str | None:
    if property:
        tag = soup.find("meta", attrs={"property": property})
    else:
        tag = soup.find("meta", attrs={"name": name})
    if not tag:
        return None
    content = tag.get("content")
    if not content:
        return None
    return str(content).strip() or None


def _favicon(soup: BeautifulSoup, base_url: str) -> str | None:
    icon = soup.find("link", rel=lambda value: value and "icon" in value.lower())  # type: ignore[arg-type]
    href = icon.get("href") if icon else None
    if href:
        return urljoin(base_url, str(href))
    parsed = urlparse(base_url)
    return f"{parsed.scheme}://{parsed.netloc}/favicon.ico"
