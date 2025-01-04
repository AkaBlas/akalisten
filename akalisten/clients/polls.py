import os
from collections.abc import Sequence

import httpx

from akalisten.clients._utils import BaseAPI
from akalisten.models.polls import PollInfo, PollVotes
from akalisten.models.raw_api_models.polls import Poll, PollOption, PollShare, PollVote


class PollAPI(BaseAPI):
    def __init__(self) -> None:
        super().__init__(
            base_url="https://cloud.akablas.de/index.php/apps/polls/api/v1.0/",
            httpx_kwargs={"auth": (os.environ["NC_USERNAME"], os.environ["NC_PASSWORD"])},
        )

        self.client = httpx.AsyncClient(
            auth=(os.environ["NC_USERNAME"], os.environ["NC_PASSWORD"]), timeout=10
        )

    async def get_polls(self) -> Sequence[Poll]:
        async with self.json_content("polls") as json:
            return [Poll(**poll) for poll in json["polls"]]

    async def get_polls_info(self) -> Sequence[PollInfo]:
        return [PollInfo(poll=poll) for poll in await self.get_polls()]

    async def get_poll(self, poll_id: int) -> Poll:
        async with self.json_content(f"poll/{poll_id}") as json:
            return Poll(**json)

    async def get_poll_info(self, poll_id: int) -> PollInfo:
        return PollInfo(poll=await self.get_poll(poll_id))

    async def get_poll_options(self, poll_id: int) -> Sequence[PollOption]:
        async with self.json_content(f"poll/{poll_id}/options") as json:
            return [PollOption(**option) for option in json["options"]]

    async def get_poll_votes(self, poll_id: int) -> Sequence[PollVote]:
        async with self.json_content(f"poll/{poll_id}/votes") as json:
            return [PollVote(**vote) for vote in json["votes"]]

    async def get_poll_shares(self, poll_id: int) -> Sequence[PollShare]:
        async with self.json_content(f"poll/{poll_id}/shares") as json:
            return [PollShare(**share) for share in json["shares"]]

    async def get_public_share_token(self, poll_id: int) -> set[str]:
        shares = await self.get_poll_shares(poll_id)
        return {share.token for share in shares if share.type == "public"}

    async def aggregate_poll_votes(self, poll_id: int) -> PollVotes:
        votes = await self.get_poll_votes(poll_id)
        options = await self.get_poll_options(poll_id)
        poll_votes = PollVotes(poll_id=poll_id)

        # Adding Options first is important! Python dicts are ordered since 3.7, so this makes
        # sure that the options are added in the order reported by the API. We assume that this
        # is the order displayed to the user on NextCloud.
        for option in options:
            poll_votes.add_option(option)
        for vote in votes:
            poll_votes.add_vote(vote)

        return poll_votes
