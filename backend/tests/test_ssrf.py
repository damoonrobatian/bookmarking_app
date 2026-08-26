import pytest
from app.services.ssrf import UnsafeURLError, validate_public_http_url


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/",
        "http://localhost/",
        "http://10.0.0.5/",
        "http://192.168.1.1/",
        "http://169.254.169.254/latest/meta-data/",
        "http://[::1]/",
        "ftp://example.com/",
        "https://user:pass@example.com/",
        "https://example.com:8080/",
    ],
)
def test_rejects_unsafe_urls(url: str) -> None:
    with pytest.raises(UnsafeURLError):
        validate_public_http_url(url)
