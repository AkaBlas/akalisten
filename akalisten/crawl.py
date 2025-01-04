"""Functions and classes to crawl the data from the different APIs and return the data in a
format that can be used by the Jinja2 template
"""

from pathlib import Path

from pydantic import BaseModel

from .clients.circles import CirclesAPI
from .clients.forms import FormsAPI
from .clients.polls import PollAPI
from .models.forms import FormInfo
from .models.polls import PollInfo, PollVotes
from .models.register import Registers


class MuckenListenData(BaseModel):
    polls: dict[int, PollInfo]
    poll_votes: dict[int, PollVotes]
    registers: Registers


class TemplateData(BaseModel):
    mucken_listen: MuckenListenData
    polls: list[PollInfo]
    forms: list[FormInfo]


async def get_template_data(debug: bool, dummy_data_path: Path) -> TemplateData:
    if debug and dummy_data_path.exists():
        template_data = TemplateData.model_validate_json(
            dummy_data_path.read_text(encoding="utf-8")
        )
        for poll_votes in template_data.mucken_listen.poll_votes.values():
            poll_votes.sanitize_votes()
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
            # post-process the votes
            poll_votes.sanitize_votes()

        async with FormsAPI() as forms_client:
            forms = list(
                filter(lambda f: f.is_active_public_form, await forms_client.get_all_forms())
            )

        template_data = TemplateData(
            mucken_listen=mucken_listen_data, polls=other_polls, forms=forms
        )

        if debug:
            dummy_data_path.write_text(template_data.model_dump_json(indent=2), encoding="utf-8")

    return template_data
