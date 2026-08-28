from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from bs4.element import Tag

from app.config import get_settings
from app.repositories.tag import normalize_tag_name
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
    suggested_tags: list[str] = field(default_factory=list)


def extract_metadata(url: str) -> PageMetadata:
    domain = domain_from_url(url)
    try:
        validate_public_http_url(url)
    except UnsafeURLError as exc:
        logger.info("Skipping metadata fetch for unsafe URL %s: %s", url, exc)
        return PageMetadata(None, None, None, domain, "blocked", _url_tags(url, domain))

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
        return PageMetadata(None, None, None, domain, "timeout", _url_tags(url, domain))
    except httpx.HTTPError as exc:
        logger.info("Metadata fetch failed for %s: %s", url, exc)
        return PageMetadata(None, None, None, domain, "unreachable", _url_tags(url, domain))
    except UnsafeURLError as exc:
        logger.info("Redirect to unsafe URL for %s: %s", url, exc)
        return PageMetadata(None, None, None, domain, "blocked", _url_tags(url, domain))

    if html is None:
        return PageMetadata(None, None, None, domain, "unavailable", _url_tags(url, domain))

    title, description, favicon, suggested_tags = _parse_html(html, final_url or url)
    return PageMetadata(title, description, favicon, domain, "ok", suggested_tags)


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


def _parse_html(html: str, base_url: str) -> tuple[str | None, str | None, str | None, list[str]]:
    soup = BeautifulSoup(html, "html.parser")
    title = _best_title(soup)
    description = _meta(soup, property="og:description") or _meta(soup, name="description")
    favicon = _favicon(soup, base_url)
    return title, description, favicon, _suggested_tags(soup, base_url)


def _best_title(soup: BeautifulSoup) -> str | None:
    h1 = soup.find("h1")
    h1_text = _normalize_space(h1.get_text(" ", strip=True) if h1 else None)
    raw_title = None
    if soup.title:
        raw_title = _normalize_space(soup.title.get_text(" ", strip=True))
    candidates = [
        _meta(soup, property="og:title"),
        _meta(soup, name="twitter:title"),
        h1_text,
        raw_title,
    ]
    for candidate in candidates:
        if candidate and not looks_like_keyword_list(candidate):
            return candidate[:200]
    for candidate in candidates:
        if candidate:
            clause = _first_clause(candidate)
            if clause:
                return clause[:200]
    return None


def looks_like_keyword_list(text: str) -> bool:
    parts = [part.strip() for part in re.split(r"[,|;]", text) if part.strip()]
    return len(parts) >= 3


def _first_clause(text: str) -> str | None:
    parts = [part.strip() for part in re.split(r"[,|;]", text) if part.strip()]
    return parts[0] if parts else None


def _normalize_space(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = " ".join(value.split())
    return cleaned or None


def _meta(soup: BeautifulSoup, *, property: str | None = None, name: str | None = None) -> str | None:
    def match(tag: Tag) -> bool:
        if tag.name != "meta":
            return False
        if property:
            return str(tag.get("property") or "").lower() == property.lower()
        return str(tag.get("name") or "").lower() == (name or "").lower()

    tag = soup.find(match)
    if not tag or not isinstance(tag, Tag):
        return None
    content = tag.get("content")
    if not content:
        return None
    return _normalize_space(str(content))


def _favicon(soup: BeautifulSoup, base_url: str) -> str | None:
    candidates: list[tuple[int, str]] = []
    for tag in soup.find_all("link"):
        if not isinstance(tag, Tag):
            continue
        href = tag.get("href")
        if not href:
            continue
        rels = _link_rels(tag)
        if not any("icon" in rel for rel in rels):
            continue
        href_str = str(href)
        if not _usable_favicon_href(href_str):
            continue
        type_hint = str(tag.get("type") or "").lower()
        score = 0
        if "apple-touch-icon" in rels:
            score += 3
        if "svg" in type_hint or href_str.endswith(".svg"):
            score += 2
        if "png" in type_hint or href_str.endswith(".png"):
            score += 1
        candidates.append((score, urljoin(base_url, href_str)))
    if candidates:
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1]
    parsed = urlparse(base_url)
    return f"{parsed.scheme}://{parsed.netloc}/favicon.ico"


def _usable_favicon_href(href: str) -> bool:
    if not href.startswith("data:"):
        return True
    payload = href.split(",", 1)[1].strip() if "," in href else ""
    return bool(payload)


def _link_rels(tag: Tag) -> list[str]:
    rel = tag.get("rel")
    if rel is None:
        return []
    if isinstance(rel, list):
        return [str(item).lower() for item in rel]
    return str(rel).lower().split()


_SKIP_TAGS = {
    "a",
    "an",
    "and",
    "com",
    "for",
    "from",
    "html",
    "http",
    "https",
    "in",
    "of",
    "on",
    "or",
    "org",
    "the",
    "to",
    "www",
}

_SKIP_PATH = {
    "blog",
    "docs",
    "home",
    "html",
    "index",
    "learn",
    "page",
    "pages",
    "post",
    "posts",
    "www",
}


def _suggested_tags(soup: BeautifulSoup, base_url: str) -> list[str]:
    raw: list[str] = []
    keywords = _meta(soup, name="keywords") or _meta(soup, name="news_keywords")
    if keywords and not looks_like_keyword_list(keywords):
        raw.extend(re.split(r"[,|;]", keywords))
    elif keywords:
        # A long SEO keyword dump is not useful as tags; keep only short single tokens.
        for item in re.split(r"[,|;]", keywords):
            token = normalize_tag_name(item)
            if " " not in token:
                raw.append(token)
    for tag in soup.find_all("meta"):
        if not isinstance(tag, Tag):
            continue
        if str(tag.get("property") or "").lower() != "article:tag":
            continue
        content = tag.get("content")
        if content:
            raw.append(str(content))
    suggested: list[str] = []
    for item in raw:
        _push_tag(suggested, str(item))
        if len(suggested) >= 5:
            return suggested
    for item in _url_tags(base_url, domain_from_url(base_url)):
        _push_tag(suggested, item)
        if len(suggested) >= 5:
            break
    return suggested


def _url_tags(url: str, domain: str | None) -> list[str]:
    tags: list[str] = []
    host = (domain or "").removeprefix("www.")
    label = host.split(".")[0] if host else ""
    _push_tag(tags, label)
    path = urlparse(url).path
    for segment in reversed(path.split("/")):
        if not segment or "." in segment:
            continue
        name = normalize_tag_name(segment.replace("-", " "))
        if name in _SKIP_PATH:
            continue
        before = len(tags)
        _push_tag(tags, name)
        if len(tags) > before:
            break
    return tags


def _push_tag(suggested: list[str], raw: str) -> None:
    name = normalize_tag_name(raw)
    if (
        2 <= len(name) <= 32
        and name not in _SKIP_TAGS
        and name not in suggested
        and re.search(r"[a-z0-9]", name)
        and not name.startswith(".")
    ):
        suggested.append(name)


def tag_appears_in(name: str, haystack: str) -> bool:
    if len(name) < 2:
        return False
    if " " in name:
        return name in haystack
    return re.search(rf"(?<![a-z0-9]){re.escape(name)}(?![a-z0-9])", haystack) is not None
