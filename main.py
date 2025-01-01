import asyncio
import datetime as dtm
import logging
import os
import zoneinfo
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

from dotenv import load_dotenv
from jinja2 import FileSystemLoader, StrictUndefined
from pydantic import BaseModel

from akalisten.clients.polls import PollAPI
from akalisten.clients.wordpress import WordPressAPI
from akalisten.jinja2 import RelImportEnvironment
from akalisten.polls import PollInfo, PollVotes

load_dotenv(override=True)


ROOT = Path(__file__).parent
DUMMY_DATA = ROOT / "dummy_data.json"
LOGS = ROOT / "logs"
LOGS.mkdir(exist_ok=True)

DEBUG_MODE = os.getenv("DEBUG") is not None

handler = TimedRotatingFileHandler(
    filename=LOGS / "akalisten.log", when="midnight", interval=1, backupCount=30, encoding="utf-8"
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.WARNING,
    handlers=[handler] if not DEBUG_MODE else [logging.StreamHandler()],
)


async def get_poll_data() -> tuple[dict[int, PollInfo], dict[int, PollVotes]]:
    class TempData(BaseModel):
        polls: dict[int, PollInfo]
        poll_votes: dict[int, PollVotes]

    if DEBUG_MODE and DUMMY_DATA.exists():
        tmp_data = TempData.model_validate_json(DUMMY_DATA.read_text(encoding="utf-8"))
        for poll_votes in tmp_data.poll_votes.values():
            poll_votes.sanitize_nos()
    else:
        tmp_data = TempData(polls={}, poll_votes={})

        async with PollAPI() as client:
            for poll in await client.get_polls_info():
                if not poll.is_active_mucken_liste:
                    continue
                votes = await client.aggregate_poll_votes(poll.id)
                tmp_data.poll_votes[poll.id] = votes
                tmp_data.polls[poll.id] = poll

        if DEBUG_MODE:
            DUMMY_DATA.write_text(tmp_data.model_dump_json(indent=2), encoding="utf-8")

    return tmp_data.polls, tmp_data.poll_votes


async def main() -> None:
    polls, poll_votes = await get_poll_data()

    environment = RelImportEnvironment(
        loader=FileSystemLoader(ROOT / Path("akalisten/templates")),
        lstrip_blocks=True,
        trim_blocks=True,
        undefined=StrictUndefined,
    )
    timezone = zoneinfo.ZoneInfo("Europe/Berlin")
    kwargs = {"polls": polls, "poll_votes": poll_votes, "now": dtm.datetime.now(timezone)}

    # Write to file
    (ROOT / "index.html").write_text(
        environment.get_template("lotsude/index.j2").render(wordpress=False, **kwargs),
        encoding="utf-8",
    )

    # Update WordPress Page
    wp_content = environment.get_template("lotsude/index.j2").render(wordpress=True, **kwargs)
    async with WordPressAPI() as wp_client:
        await wp_client.edit_page(
            int(os.getenv("WP_PAGE_ID")),  # type: ignore[arg-type]
            (
                "<!-- wp:paragraph -->"
                '<p><a href="https://listen.akablas.de" target="_blank" rel="noreferrer noopener">'
                " Klicke hier</a>, um den Inhalt unten in einer neuen Seite zu öffnen. Die "
                "Zugangsdaten sie die gleichen wie für den internen Bereich.</p>"
                "<!-- /wp:paragraph -->"
                "<!-- wp:html -->"
                f"{wp_content}"
                "<!-- /wp:html -->"
            ),
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        logging.exception(exc)
