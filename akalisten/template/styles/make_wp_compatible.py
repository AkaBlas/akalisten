# noqa: INP001
# This script converts a CSS file such that all global selectors are prefixed with
# a specific class (e.g., '.bootstrap-scope') to avoid conflicts when embedding the
# CSS in a WordPress site. Otherwise, the CSS would "leak" out of the intended scope.
# Based on https://stackoverflow.com/a/20051649/10606962
# Tested with cssutils==2.11.1
from pathlib import Path

import cssutils

prefix = ".bootstrap-scope"


def prefix_selector(sel: cssutils.css.Selector) -> str:
    sel = sel.strip()
    if sel == ":root":
        return prefix
    if sel.startswith("@"):
        return sel
    import re

    m = re.match(r"^(body|html)(\W.*)?$", sel, re.I)
    if m:
        rest = m.group(2) or ""
        return f"{prefix}{rest}"
    return f"{prefix} {sel}"


def process_rule(rule: cssutils.css.CSSRule) -> None:
    STYLE_RULE = getattr(rule, "STYLE_RULE", 1)
    MEDIA_RULE = getattr(rule, "MEDIA_RULE", 4)
    # SUPPORTS_RULE gibt es evtl. nicht, daher Default auf None
    SUPPORTS_RULE = getattr(rule, "SUPPORTS_RULE", None)

    if rule.type == STYLE_RULE:
        selectors = [s.strip() for s in rule.selectorText.split(",")]
        rule.selectorText = ", ".join(prefix_selector(s) for s in selectors)
    elif rule.type == MEDIA_RULE or (SUPPORTS_RULE and rule.type == SUPPORTS_RULE):
        for r in rule.cssRules:
            process_rule(r)
    # andere Rule-Typen werden ignoriert


if __name__ == "__main__":
    root = Path(__file__).parent
    cssutils.log.setLevel("FATAL")  # Fehlerausgabe minimieren
    for source, target in (
        (root / "layout-styles.css", root / "layout-styles.wp.css"),
        (root / "bootstrap5.3.2.min.css", root / "bootstrap5.3.2.wp.min.css"),
    ):
        sheet = cssutils.parseFile(source)
        for rule in sheet:
            process_rule(rule)

        target.write_text(sheet.cssText.decode("utf-8"), encoding="utf-8")
