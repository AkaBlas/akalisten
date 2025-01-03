import os
from collections.abc import Sequence
from contextlib import AbstractAsyncContextManager
from types import TracebackType

import httpx

from akalisten.clients._utils import response_handler
from akalisten.models.polls import PollInfo, PollVotes
from akalisten.models.raw_api_models.polls import Poll, PollOption, PollShare, PollVote


class PollAPI(AbstractAsyncContextManager):
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            auth=(os.environ["NC_USERNAME"], os.environ["NC_PASSWORD"]), timeout=10
        )
        self.base_url = "https://cloud.akablas.de/index.php/apps/polls/api/v1.0/"

    async def __aenter__(self) -> "PollAPI":
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        await self.client.aclose()

    async def get_polls(self) -> Sequence[Poll]:
        response = await self.client.get(self.base_url + "polls")
        with response_handler(response):
            return [Poll(**poll) for poll in response.json()["polls"]]

    async def get_polls_info(self) -> Sequence[PollInfo]:
        return [PollInfo(poll=poll) for poll in await self.get_polls()]

    async def get_poll(self, poll_id: int) -> Poll:
        response = await self.client.get(self.base_url + f"poll/{poll_id}")
        with response_handler(response):
            return Poll(**response.json())

    async def get_poll_info(self, poll_id: int) -> PollInfo:
        return PollInfo(poll=await self.get_poll(poll_id))

    async def get_poll_options(self, poll_id: int) -> Sequence[PollOption]:
        response = await self.client.get(self.base_url + f"poll/{poll_id}/options")
        with response_handler(response):
            return [PollOption(**option) for option in response.json()["options"]]

    async def get_poll_votes(self, poll_id: int) -> Sequence[PollVote]:
        response = await self.client.get(self.base_url + f"poll/{poll_id}/votes")
        with response_handler(response):
            return [PollVote(**vote) for vote in response.json()["votes"]]

    async def get_poll_shares(self, poll_id: int) -> Sequence[PollShare]:
        response = await self.client.get(self.base_url + f"poll/{poll_id}/shares")
        with response_handler(response):
            return [PollShare(**share) for share in response.json()["shares"]]

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
