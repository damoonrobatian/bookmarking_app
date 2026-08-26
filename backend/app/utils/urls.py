from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

TRACKING_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
}


class InvalidURLError(ValueError):
    pass


def parse_user_url(raw: str) -> str:
    """Return a cleaned original URL, adding https:// when the scheme is missing."""
    url = raw.strip()
    if not url:
        raise InvalidURLError("URL is required.")
    parsed = urlparse(url)
    if not parsed.scheme:
        parsed = urlparse(f"https://{url}")
    if parsed.scheme not in {"http", "https"}:
        raise InvalidURLError("Only http and https URLs are supported.")
    if not parsed.hostname:
        raise InvalidURLError("URL is missing a hostname.")
    return urlunparse(parsed)


def normalize_url(raw: str) -> str:
    """Produce a comparison URL without changing the meaning of arbitrary URLs."""
    url = parse_user_url(raw)
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    port = parsed.port
    if port and not ((parsed.scheme == "https" and port == 443) or (parsed.scheme == "http" and port == 80)):
        netloc = f"{host}:{port}"
    else:
        netloc = host

    query_pairs = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key.lower() not in TRACKING_PARAMS
    ]
    query = urlencode(query_pairs, doseq=True)

    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")

    return urlunparse((parsed.scheme, netloc, path, "", query, ""))


def domain_from_url(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    return (parsed.hostname or "").lower()
