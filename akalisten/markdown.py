import re

import bleach
import markdown

# Keep the allowlist small but support common markdown output.
_ALLOWED_TAGS = set(bleach.sanitizer.ALLOWED_TAGS) | {
    "p",
    "br",
    "hr",
    "pre",
    "code",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
}
_ALLOWED_ATTRIBUTES: dict[str, list[str]] = {
    **{key: list(value) for key, value in bleach.sanitizer.ALLOWED_ATTRIBUTES.items()},
    "a": ["href", "title"],
}
_ALLOWED_PROTOCOLS = set(bleach.sanitizer.ALLOWED_PROTOCOLS) | {"mailto"}


_HEADING_TAG_PATTERN = re.compile(r"<(/?)h([1-6])(\b[^>]*)>", flags=re.IGNORECASE)
_HEADING_LEVEL_MAP = {"1": "3", "2": "4", "3": "5", "4": "6", "5": "p", "6": "p"}


def _downgrade_headings(html_text: str) -> str:
    """Shift headings down for better visual hierarchy in cards."""

    def _replace(match: re.Match[str]) -> str:
        closing_slash, level, attributes = match.groups()
        replacement = _HEADING_LEVEL_MAP[level]
        if replacement == "p":
            return f"<{closing_slash}p>"
        return f"<{closing_slash}h{replacement}{attributes}>"

    return _HEADING_TAG_PATTERN.sub(_replace, html_text)


def render_markdown(markdown_text: str | None) -> str:
    """Render markdown text to sanitized HTML."""
    if not markdown_text:
        return ""

    rendered = markdown.markdown(markdown_text, extensions=["extra", "sane_lists", "nl2br"])
    rendered = _downgrade_headings(rendered)
    return bleach.clean(
        rendered,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRIBUTES,
        protocols=_ALLOWED_PROTOCOLS,
        strip=True,
    )
