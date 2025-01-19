import asyncio
import datetime as dtm
import logging
import os
import re
import zoneinfo
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

from dotenv import load_dotenv
from jinja2 import FileSystemLoader, StrictUndefined

from akalisten.clients.wordpress import WordPressAPI
from akalisten.crawl import get_template_data
from akalisten.jinja2 import RelImportEnvironment

load_dotenv(override=True)

ROOT = Path(__file__).parent
OUTPUT_DIR = ROOT / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
DUMMY_DATA_PATH = OUTPUT_DIR / "dummy_data.json"
INDEX_PATH = OUTPUT_DIR / "index.html"
DATA_PATH = ROOT / "data"
LINKS_PATH = DATA_PATH / "links.json"
LOGS_DIR = ROOT / "logs"
LOGS_DIR.mkdir(exist_ok=True)
DEBUG_MODE = os.getenv("DEBUG") is not None

handler = TimedRotatingFileHandler(
    filename=LOGS_DIR / "akalisten.log",
    when="midnight",
    interval=1,
    backupCount=30,
    encoding="utf-8",
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.WARNING,
    handlers=[handler] if not DEBUG_MODE else [logging.StreamHandler()],
)


async def main() -> None:
    template_data = await get_template_data(
        debug=DEBUG_MODE, dummy_data_path=DUMMY_DATA_PATH, links_path=LINKS_PATH
    )

    environment = RelImportEnvironment(
        loader=FileSystemLoader(ROOT / Path("akalisten/template")),
        lstrip_blocks=True,
        trim_blocks=True,
        undefined=StrictUndefined,
    )
    timezone = zoneinfo.ZoneInfo("Europe/Berlin")
    kwargs = {
        "links": template_data.links,
        "mucken_listen": template_data.mucken_listen,
        "polls": template_data.polls,
        "forms": template_data.forms,
        "now": dtm.datetime.now(timezone),
    }

    # Write to file
    INDEX_PATH.write_text(
        environment.get_template("index.j2").render(wordpress=False, **kwargs), encoding="utf-8"
    )

    if DEBUG_MODE:
        # Don't update WordPress Page in debug mode
        return

    # Update WordPress Page
    wp_content = environment.get_template("wordpress.j2").render(wordpress=True, **kwargs)
    async with WordPressAPI() as wp_client:
        page_id = int(os.getenv("WP_PAGE_ID"))  # type: ignore[arg-type]

        current_content = await wp_client.get_page_raw_content(page_id)

        pattern = re.compile(r"Zuletzt aktualisiert: [\d\.: ]+\n")
        compare_wp_content = pattern.sub("", wp_content)
        compare_current_content = pattern.sub("", current_content)

        if compare_wp_content == compare_current_content:
            return
        await wp_client.edit_page(page_id, wp_content)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        logging.exception(exc)
