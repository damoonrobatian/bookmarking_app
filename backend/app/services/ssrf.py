from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

BLOCKED_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
    "metadata",
}

BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

ALLOWED_PORTS = {80, 443, None}


class UnsafeURLError(ValueError):
    pass


def _is_blocked_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
        return True
    if ip.is_unspecified:
        return True
    return any(ip in network for network in BLOCKED_NETWORKS)


def _hostname_looks_internal(hostname: str) -> bool:
    host = hostname.lower().rstrip(".")
    if host in BLOCKED_HOSTNAMES:
        return True
    return host.endswith((".local", ".internal", ".localhost", ".lan"))


def validate_public_http_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise UnsafeURLError("Only http and https URLs are allowed.")
    if parsed.username or parsed.password:
        raise UnsafeURLError("URLs with credentials are not allowed.")
    hostname = parsed.hostname
    if not hostname:
        raise UnsafeURLError("URL is missing a hostname.")
    if parsed.port not in ALLOWED_PORTS:
        raise UnsafeURLError("Only ports 80 and 443 are allowed.")
    if _hostname_looks_internal(hostname):
        raise UnsafeURLError("Internal hostnames are not allowed.")

    try:
        ip = ipaddress.ip_address(hostname)
    except ValueError:
        ip = None

    if ip is not None and _is_blocked_ip(ip):
        raise UnsafeURLError("Private or reserved IP addresses are not allowed.")

    resolve_and_check_hostname(hostname)


def resolve_and_check_hostname(hostname: str) -> list[str]:
    try:
        infos = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise UnsafeURLError("Could not resolve hostname.") from exc

    addresses: list[str] = []
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if _is_blocked_ip(ip):
            raise UnsafeURLError("Hostname resolves to a private or reserved address.")
        addresses.append(str(ip))
    if not addresses:
        raise UnsafeURLError("Hostname did not resolve to a usable address.")
    return addresses
