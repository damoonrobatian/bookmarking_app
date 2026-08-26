import pytest
from app.utils.urls import InvalidURLError, normalize_url, parse_user_url


def test_adds_https_and_lowercases_host() -> None:
    assert normalize_url("Example.COM/Path/") == "https://example.com/Path"


def test_strips_default_port_fragment_and_tracking() -> None:
    url = "https://example.com:443/article/?utm_source=x&id=1#section"
    assert normalize_url(url) == "https://example.com/article?id=1"


def test_keeps_non_default_port() -> None:
    assert normalize_url("https://example.com:8443/app") == "https://example.com:8443/app"


def test_rejects_non_http_schemes() -> None:
    with pytest.raises(InvalidURLError):
        parse_user_url("javascript:alert(1)")
