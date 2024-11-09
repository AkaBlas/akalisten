import html
from collections.abc import Sequence
from typing import Union

from pydantic import BaseModel, Field

from akalisten.api_types.polls import PollOption, PollVote


class PollOptionVotes(BaseModel):
    poll_id: int
    yes: list[str] = Field(default_factory=list)
    no: list[str] = Field(default_factory=list)
    maybe: list[str] = Field(default_factory=list)

    def add_vote(self, vote: PollVote) -> None:
        if vote.answer == "yes":
            self.yes.append(vote.user.displayName)
        elif vote.answer == "no":
            self.no.append(vote.user.displayName)
        elif vote.answer == "maybe":
            self.maybe.append(vote.user.displayName)

    @property
    def max_votes(self) -> int:
        return max(len(self.yes), len(self.no), len(self.maybe))

    @staticmethod
    def _sort_names(names: Sequence[str], html_escape: bool) -> Sequence[str]:
        sorted_names = sorted(
            [", ".join(name.rsplit(" ", 1)[::-1]) if " " in name else name for name in names]
        )
        if not html_escape:
            return sorted_names
        return list(map(html.escape, sorted_names))

    def sorted_yes(self, html_escape: bool = True) -> Sequence[str]:
        return self._sort_names(self.yes, html_escape=html_escape)

    def sorted_no(self, html_escape: bool = True) -> Sequence[str]:
        return self._sort_names(self.no, html_escape=html_escape)

    def sorted_maybe(self, html_escape: bool = True) -> Sequence[str]:
        return self._sort_names(self.maybe, html_escape=html_escape)


class PollVotes(BaseModel):
    poll_id: int
    options: dict[str, PollOptionVotes] = Field(default_factory=dict)

    def _get(self, option_text: str) -> PollOptionVotes:
        return self.options.setdefault(option_text, PollOptionVotes(poll_id=self.poll_id))

    def add_vote(self, vote: PollVote) -> None:
        option = self._get(vote.optionText)
        option.add_vote(vote)

    def add_option(self, option_text: Union[str, PollOption]) -> None:
        if isinstance(option_text, PollOption):
            option_text = option_text.text
        self._get(option_text)

    def sorted_option_names(self) -> Sequence[str]:
        return sorted(self.options.keys())
