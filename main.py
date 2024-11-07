import asyncio
import datetime as dtm
import html
import os
import zoneinfo
from collections import defaultdict
from contextlib import AbstractAsyncContextManager
from dataclasses import dataclass, field
from pathlib import Path
from types import TracebackType
from typing import Any, Optional

import httpx
import markdown
from dotenv import load_dotenv

load_dotenv(override=True)

CSS = """
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
}

.header {
    text-align: center; /* Center the title */
    margin: 20px 0; /* Add some margin for spacing */
}

.tab-container {
    max-width: 1000px;
    margin: 0 auto;
}

.tab-buttons {
    display: flex;
    border-bottom: 1px solid #ccc;
    position: sticky;
    top: 0;
    z-index: 1001;
    background-color: #fff;
}

.tab-button {
    padding: 10px 20px;
    background-color: #f1f1f1;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
    flex-grow: 1;
    text-align: center;
}

.tab-button:hover {
    background-color: #ddd;
}

.tab-button.active {
    background-color: #fff;
    border-bottom: 2px solid #4CAF50;
}

.tab-content {
    display: none;
    padding: 20px;
    border: 1px solid #ccc;
    border-top: none;
}

.tab-content.active {
    display: block;
}

.table-container {
    overflow-y: auto;
    max-height: calc(100vh - 100px); /* Adjust based on your needs */
}

table {
    width: 90%;
    max-width: 800px;
    margin: 1rem auto;
    border-collapse: collapse;
}

th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

th {
    background-color: #add8e6;
    font-weight: bold;
    position: sticky;
    top: 0;
    z-index: 1000;
}

tr:nth-child(even) {
    background-color: #f2f2f2;
}

tr:nth-child(odd) {
    background-color: #ffffff;
}

@media screen and (max-width: 600px) {
    table {
        border: 0;
        width: 100%;
        max-width: none;
    }

    table thead {
        display: none;
    }

    table tr {
        margin-bottom: 0.5rem;
        display: block;
        border-bottom: 2px solid #ddd;
    }

    table td {
        display: block;
        text-align: right;
        border-bottom: 1px dotted #ddd;
    }

    table td:last-child {
        border-bottom: 0;
    }

    table td:before {
        content: attr(data-label);
        float: left;
        font-weight: bold;
        text-align: left;
    }
}
"""


@dataclass
class RegisterVotes:
    yes: list[str] = field(default_factory=list)
    no: list[str] = field(default_factory=list)
    maybe: list[str] = field(default_factory=list)


class PollAPI(AbstractAsyncContextManager):
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            auth=(os.environ["USERNAME"], os.environ["PASSWORD"]), timeout=10
        )
        self.base_url = "https://cloud.akablas.de/index.php/apps/polls/api/v1.0/"

    async def __aenter__(self) -> "PollAPI":
        return self

    async def __aexit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        await self.client.aclose()

    async def get_polls(self) -> Any:
        response = await self.client.get(self.base_url + "polls")
        return response.json()

    async def get_poll(self, poll_id: int) -> Any:
        response = await self.client.get(self.base_url + f"poll/{poll_id}")
        return response.json()

    async def get_poll_votes(self, poll_id: int) -> Any:
        response = await self.client.get(self.base_url + f"poll/{poll_id}/votes")
        return response.json()

    async def aggregate_poll_votes(self, poll_id: int) -> dict[str, RegisterVotes]:
        votes = (await self.get_poll_votes(poll_id))["votes"]
        register_votes: dict[str, RegisterVotes] = defaultdict(RegisterVotes)
        for vote in votes:
            register = vote["optionText"]
            name = vote["user"]["displayName"]
            if vote["answer"] == "yes":
                register_votes[register].yes.append(name)
            elif vote["answer"] == "no":
                register_votes[register].no.append(name)
            elif vote["answer"] == "maybe":
                register_votes[register].maybe.append(name)

        return register_votes


def html_votes_table(votes: dict[str, RegisterVotes]) -> str:
    # sort entries of votes dictionary by key: Anzähler first, rest alphabetically
    sorted_votes = dict(sorted(votes.items(), key=lambda x: (x[0] != "Anzähler", x[0])))
    table = "<div class='table-container'>"
    table += "<table>"
    table += "<tr><th>Register</th><th>Ja</th><th>Nein</th><th>Vielleicht</th></tr>"
    for register, register_votes in sorted_votes.items():
        # each cell content should be a bullet list sorted by last name
        yes = (
            "<ul>"
            + "".join([f"<li>{html.escape(name)}</li>" for name in sorted(register_votes.yes)])
            + "</ul>"
        )
        no = (
            "<ul>"
            + "".join([f"<li>{html.escape(name)}</li>" for name in sorted(register_votes.no)])
            + "</ul>"
        )
        maybe = (
            "<ul>"
            + "".join([f"<li>{html.escape(name)}</li>" for name in sorted(register_votes.maybe)])
            + "</ul>"
        )
        table += (
            f"<tr><td>{html.escape(register)}</td><td>{yes}</td><td>{no}</td><td>{maybe}</td></tr>"
        )
    table += "</table></div>"

    return table


def md_to_html(md: str) -> str:
    return markdown.markdown(md)


def build_html_page(tables: dict[str, tuple[int, str, str]]) -> str:
    # build a html page with tha tables as tabs
    now = dtm.datetime.now(tz=zoneinfo.ZoneInfo("Europe/Berlin"))
    tabs = "".join(
        [
            f'<button class="tab-button" data-tab="{html.escape(title)}">'
            f"{html.escape(title)}</button>"
            for title in tables
        ]
    )
    html_tables = "".join(
        [
            f'<div id="{title}" class="tab-content">'
            f'<b>🔗 <a href="https://cloud.akablas.de/index.php/apps/polls/vote/{poll_id}">'
            f"Hier zur Mucke eintragen</a></b>"
            f"{md_to_html(description)}{table}</div>"
            for title, (poll_id, description, table) in tables.items()
        ]
    )

    return f"""<!DOCTYPE html>
<html>
<head>
    <title>Muckenlisten</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        {CSS}
    </style>
</head>
<body>
    <div class="header">
        <h1>Muckenlisten</h1>
        <h2>🚧 <i>Erster, grober Entwurf</i></h2>
        <p>💡 Eingegangene Verbesserungsvorschläge sind
        <a href="https://github.com/AkaBlas/akalisten/issues">hier</a> zu finden.</p>
        <p>🕓 Zuletzt aktualisiert: {now.strftime("%d.%m.%Y %H:%M:%S")}</p>
    </div>
    <div class="tab-container">
        <div class="tab-buttons">
            {tabs}
        </div>
        {html_tables}
    </div>

<script>
    document.addEventListener('DOMContentLoaded', function() {{
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        // Show the first tab by default
        tabButtons[0].classList.add('active');
        tabContents[0].classList.add('active');

        tabButtons.forEach(button => {{
            button.addEventListener('click', () => {{
                const tabId = button.getAttribute('data-tab');

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            }});
        }});
    }});
</script>
</body>
</html>"""


async def main() -> None:
    async with PollAPI() as client:
        polls = (await client.get_polls())["polls"]
        html_tables = {
            poll["configuration"]["title"]: (
                poll["id"],
                poll["descriptionSafe"],
                html_votes_table(await client.aggregate_poll_votes(poll["id"])),
            )
            for poll in polls
            if not ((status := poll["status"])["expired"] or status["expired"])
            and poll["configuration"]["title"] != "Muckenliste: <Titel>"
        }

        (Path(__file__).parent.resolve() / "index.html").write_text(
            build_html_page(html_tables), encoding="utf-8"
        )


if __name__ == "__main__":
    asyncio.run(main())
