from app.services.metadata import _parse_html, looks_like_keyword_list


def test_parse_html_suggests_keyword_and_article_tags() -> None:
    html = """
    <html>
      <head>
        <title>Fallback Title</title>
        <meta property="og:title" content="React Docs" />
        <meta name="keywords" content="javascript, the, docs" />
        <meta property="article:tag" content="hooks" />
      </head>
    </html>
    """
    title, _description, _favicon, tags = _parse_html(html, "https://react.dev/learn")
    assert title == "React Docs"
    assert "javascript" in tags
    assert "docs" in tags
    assert "hooks" in tags


def test_parse_html_skips_empty_data_favicon() -> None:
    html = """
    <html>
      <head>
        <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon" />
      </head>
    </html>
    """
    _title, _description, favicon, _tags = _parse_html(html, "https://continuingstudies.mcgill.ca/")
    assert favicon == "https://continuingstudies.mcgill.ca/favicon.ico"


def test_parse_html_prefers_apple_touch_icon() -> None:
    html = """
    <html>
      <head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
    </html>
    """
    _title, _description, favicon, _tags = _parse_html(html, "https://outlook.office.com/")
    assert favicon == "https://outlook.office.com/apple-touch-icon.png"


def test_parse_html_rejects_keyword_stuffed_titles() -> None:
    stuffed = (
        "Register Domain, .ca Domain, Domain Registration Canada, "
        "Canadian Domain, Web Hosting Canada, Canadian Hosting, "
        "Windows Hosting, Linux Hosting"
    )
    html = f"""
    <html>
      <head>
        <title>{stuffed}</title>
        <meta property="og:title" content="{stuffed}" />
        <meta name="Keywords" content="{stuffed}" />
      </head>
      <body><h1>Register A .ca Domain</h1></body>
    </html>
    """
    title, _description, _favicon, tags = _parse_html(html, "https://www.namespro.ca/domains")
    assert title == "Register A .ca Domain"
    assert not looks_like_keyword_list(title)
    assert "register domain" not in tags
    assert "namespro" in tags
