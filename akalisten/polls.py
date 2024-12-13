import contextlib
import datetime as dtm
import html
import re
from collections.abc import Collection, Sequence
from typing import Literal, Optional, Union

import markdown
from dateutil.parser import ParserError, parse
from pydantic import BaseModel, ConfigDict, Field

from akalisten.api_types.polls import Poll, PollOption, PollVote

_INFO_PATTERN = re.compile(r"(?P<header>#+ Infos\n+)(?P<items>(\* [^:]+ ?[^\n]+(\n|$))+)")
_INFO_ITEM_PATTERN = re.compile(r"\* (?P<key>[^:]+): ?(?P<value>[^\n]+)(\n|$)")
_CLEAN_TIME_PATTERN = re.compile(r"(Uhr|ca\.|~|h)\s*")


class MuckenInfo(BaseModel):
    date: Optional[dtm.date] = None
    location: Optional[str] = None
    time_m2: Optional[dtm.time] = None
    time_meeting: Optional[dtm.time] = None
    time_start: Optional[dtm.time] = None
    time_end: Optional[dtm.time] = None
    additional: Optional[str] = None

    def is_complete(self) -> bool:
        return all(
            (
                self.date is not None,
                self.location is not None,
                self.time_m2 is not None,
                self.time_meeting is not None,
                self.time_start is not None,
                self.time_end is not None,
            )
        )

    def has_any_info(self) -> bool:
        return any(
            filter(
                None,
                (
                    self.date,
                    self.location,
                    self.time_m2,
                    self.time_meeting,
                    self.time_start,
                    self.time_end,
                    self.additional,
                ),
            )
        )

    @property
    def html_additional(self) -> Optional[str]:
        if self.additional is None:
            return None
        return markdown.markdown(self.additional)

    @staticmethod
    def _parse_date_or_time(value: str) -> Optional[dtm.datetime]:
        time_string = _CLEAN_TIME_PATTERN.sub("", value).strip()
        # try a few custom formats first
        with contextlib.suppress(ValueError):
            return dtm.datetime.strptime(time_string, "%H")  # noqa: DTZ007
        with contextlib.suppress(ValueError):
            return dtm.datetime.strptime(time_string, "%H.%M")  # noqa: DTZ007

        with contextlib.suppress(ParserError):
            # Remove 'Uhr' and 'ca.' if present
            return parse(time_string)
        return None

    @classmethod
    def from_string(cls, info: str) -> "MuckenInfo":
        match = _INFO_PATTERN.search(info)
        if not match:
            return cls(additional=info)

        items = match.group("items")
        info_part = match.group(0)

        date: Optional[dtm.date] = None
        location: Optional[str] = None
        time_m2: Optional[dtm.time] = None
        time_meeting: Optional[dtm.time] = None
        time_start: Optional[dtm.time] = None
        time_end: Optional[dtm.time] = None
        additional: Optional[str] = None

        for item_match in _INFO_ITEM_PATTERN.finditer(items):
            key = item_match.group("key").strip().lower()
            value = item_match.group("value").strip()

            match_found = False

            if key == "datum" and (out := cls._parse_date_or_time(value)) is not None:
                date = out.date()
                match_found = True
            elif key == "ort":
                location = value
                match_found = True
            elif ("m2" in key or "mensa 2" in key) and (
                out := cls._parse_date_or_time(value)
            ) is not None:
                time_m2 = out.time()
                match_found = True
            elif ("direkt" in key) and (out := cls._parse_date_or_time(value)) is not None:
                time_meeting = out.time()
                match_found = True
            elif ("start" in key or "beginn" in key or "erster ton" in key) and (
                out := cls._parse_date_or_time(value)
            ) is not None:
                time_start = out.time()
                match_found = True
            elif "ende" in key and (out := cls._parse_date_or_time(value)) is not None:
                time_end = out.time()
                match_found = True

            if match_found:
                # We remove everything that we could parse from the info string so that we can
                # set additional to the remaining, unparsed info
                info = info.replace(item_match.group(0), "")
                info_part = info_part.replace(item_match.group(0), "")

        if info_part == match.group("header"):
            info = info.replace(match.group("header"), "")
        if info:
            additional = info.strip()

        return cls(
            date=date,
            location=location,
            time_m2=time_m2,
            time_meeting=time_meeting,
            time_start=time_start,
            time_end=time_end,
            additional=additional,
        )


class PollInfo(BaseModel):
    poll: Poll
    _mucken_info: Union[MuckenInfo, Literal["not-computed"]] = "not-computed"

    @property
    def id(self) -> int:
        return self.poll.id

    @property
    def mucken_info(self) -> MuckenInfo:
        if isinstance(self._mucken_info, MuckenInfo):
            return self._mucken_info

        mucken_info = MuckenInfo.from_string(self.poll.descriptionSafe)
        self._mucken_info = mucken_info
        return mucken_info

    @property
    def html_title(self) -> str:
        return html.escape(self.poll.configuration.title.removeprefix("Muckenliste: "))

    @property
    def is_active_mucken_liste(self) -> bool:
        if self.poll.status.deleted:
            return False
        if (date := self.mucken_info.date) and date < dtm.date.today():  # noqa: DTZ011
            return False
        return self.poll.configuration.access != "private"

    @property
    def url(self) -> str:
        return f"https://cloud.akablas.de/index.php/apps/polls/vote/{self.id}"


class User(BaseModel):
    model_config = ConfigDict(frozen=True)
    name: str
    id: str

    @property
    def display_name(self) -> str:
        if " " not in self.name:
            return self.name
        names = self.name.split(" ")
        # in case the last name has several parts, we take the first letter of each part
        return f"{names[0]} {''.join(part[0] for part in names[1:])}."

    @property
    def html_display_name(self) -> str:
        return html.escape(self.display_name)


class PollOptionVotes(BaseModel):
    poll_id: int
    id: int
    text: str
    yes: set[User] = Field(default_factory=set)
    no: set[User] = Field(default_factory=set)
    maybe: set[User] = Field(default_factory=set)
    _sanitized_no: Optional[set[User]] = None

    @property
    def sanitized_no(self) -> set[User]:
        """The `no` votes without users that have voted yes or maybe in any option.
        Available after :meth:`sanitize_nos` has been called.
        """
        if self._sanitized_no is None:
            raise ValueError("No votes have not been sanitized yet.")
        return self._sanitized_no

    def sanitize_nos(self, user_answers: Collection["PollUserAnswers"]) -> None:
        """Compute all users that have voted yes or maybe in any option. This method must have
        been called for :attr:`sanitized_no` to be available."""
        self._sanitized_no = self.no - {
            poll_user_answer.user
            for poll_user_answer in user_answers
            if (poll_user_answer.yes or poll_user_answer.maybe)
        }

    def add_vote(self, vote: PollVote) -> None:
        if vote.answer == "yes":
            self.yes.add(User(name=vote.user.displayName, id=vote.user.id))
        elif vote.answer == "no":
            self.no.add(User(name=vote.user.displayName, id=vote.user.id))
        elif vote.answer == "maybe":
            self.maybe.add(User(name=vote.user.displayName, id=vote.user.id))

    @property
    def max_votes(self) -> int:
        return max(len(self.yes), len(self.no), len(self.maybe))

    @property
    def sanitized_max_votes(self) -> int:
        return max(len(self.yes), len(self.sanitized_no), len(self.maybe))

    @staticmethod
    def _sort_names(names: Collection[User], html_escape: bool) -> Sequence[User]:
        if html_escape:
            return sorted(names, key=lambda x: x.html_display_name)
        return sorted(names, key=lambda x: x.display_name)

    def sorted_yes(self, html_escape: bool = True) -> Sequence[User]:
        return self._sort_names(self.yes, html_escape=html_escape)

    def sorted_no(self, html_escape: bool = True) -> Sequence[User]:
        return self._sort_names(self.no, html_escape=html_escape)

    def sorted_sanitized_no(self, html_escape: bool = True) -> Sequence[User]:
        return self._sort_names(self.sanitized_no, html_escape=html_escape)

    def sorted_maybe(self, html_escape: bool = True) -> Sequence[User]:
        return self._sort_names(self.maybe, html_escape=html_escape)


class PollUserAnswers(BaseModel):
    poll_id: int
    user: User
    yes: set[str] = Field(default_factory=set)
    no: set[str] = Field(default_factory=set)
    maybe: set[str] = Field(default_factory=set)

    def add_answer(self, poll_vote: PollVote) -> None:
        if poll_vote.answer == "yes":
            self.yes.add(poll_vote.optionText)
        elif poll_vote.answer == "no":
            self.no.add(poll_vote.optionText)
        elif poll_vote.answer == "maybe":
            self.maybe.add(poll_vote.optionText)


class PollVotes(BaseModel):
    poll_id: int
    options: dict[int, PollOptionVotes] = Field(default_factory=dict)
    users: dict[str, PollUserAnswers] = Field(default_factory=dict)

    def _get_option_votes(self, option_text: str, poll_id: int) -> PollOptionVotes:
        return self.options.setdefault(
            poll_id, PollOptionVotes(poll_id=self.poll_id, id=poll_id, text=option_text)
        )

    def _get_user_answers(self, user: User) -> PollUserAnswers:
        return self.users.setdefault(user.id, PollUserAnswers(poll_id=self.poll_id, user=user))

    def add_vote(self, vote: PollVote) -> None:
        option = self._get_option_votes(vote.optionText, vote.optionId)
        option.add_vote(vote)

        user = self._get_user_answers(User(name=vote.user.displayName, id=vote.user.id))
        user.add_answer(vote)

    def add_option(self, poll_option: PollOption) -> None:
        self._get_option_votes(poll_option.text, poll_option.id)

    def sanitize_nos(self) -> None:
        for option in self.options.values():
            option.sanitize_nos(self.users.values())
