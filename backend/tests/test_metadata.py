from app.services.metadata import _parse_html


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
    assert tags == ["javascript", "docs", "hooks"]
