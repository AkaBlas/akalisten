import asyncio
import datetime as dtm
import logging
import os
import zoneinfo
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
from typing import TYPE_CHECKING

from dotenv import load_dotenv
from jinja2 import FileSystemLoader, StrictUndefined

from akalisten.clients.circles import CirclesAPI
from akalisten.clients.polls import PollAPI
from akalisten.clients.wordpress import WordPressAPI
from akalisten.jinja2 import MuckenListenData, RelImportEnvironment, TemplateData

if TYPE_CHECKING:
    from akalisten.models.polls import PollInfo

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


async def get_template_data() -> TemplateData:
    if DEBUG_MODE and DUMMY_DATA.exists():
        template_data = TemplateData.model_validate_json(DUMMY_DATA.read_text(encoding="utf-8"))
        for poll_votes in template_data.mucken_listen.poll_votes.values():
            poll_votes.sanitize_nos()
    else:
        async with CirclesAPI() as circles_client:
            mucken_listen_data = MuckenListenData(
                polls={}, poll_votes={}, registers=await circles_client.aggregate_registers()
            )

        async with PollAPI() as poll_client:
            other_polls: list[PollInfo] = []
            for poll in await poll_client.get_polls_info():
                if poll.is_active_mucken_liste:
                    votes = await poll_client.aggregate_poll_votes(poll.id)
                    mucken_listen_data.poll_votes[poll.id] = votes
                    mucken_listen_data.polls[poll.id] = poll
                elif poll.is_active_poll:
                    poll.public_tokens.update(await poll_client.get_public_share_token(poll.id))
                    other_polls.append(poll)
                else:
                    continue

        # Compute the members that have not voted yet
        for poll_votes in mucken_listen_data.poll_votes.values():
            poll_votes.add_register_users(mucken_listen_data.registers)

        template_data = TemplateData(mucken_listen=mucken_listen_data, polls=other_polls)

        if DEBUG_MODE:
            DUMMY_DATA.write_text(template_data.model_dump_json(indent=2), encoding="utf-8")

    return template_data


async def main() -> None:
    template_data = await get_template_data()

    environment = RelImportEnvironment(
        loader=FileSystemLoader(ROOT / Path("akalisten/template")),
        lstrip_blocks=True,
        trim_blocks=True,
        undefined=StrictUndefined,
    )
    timezone = zoneinfo.ZoneInfo("Europe/Berlin")
    kwargs = {
        "mucken_listen": template_data.mucken_listen,
        "polls": template_data.polls,
        "now": dtm.datetime.now(timezone),
    }

    # Write to file
    (ROOT / "index.html").write_text(
        environment.get_template("index.j2").render(wordpress=False, **kwargs), encoding="utf-8"
    )

    if DEBUG_MODE:
        # Don't update WordPress Page in debug mode
        return

    # Update WordPress Page
    wp_content = environment.get_template("index.j2").render(wordpress=True, **kwargs)
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
