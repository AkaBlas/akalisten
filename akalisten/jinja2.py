from pathlib import Path

from jinja2 import Environment
from pydantic import BaseModel

from akalisten.models.polls import PollInfo, PollVotes
from akalisten.models.register import Registers


class MuckenListenData(BaseModel):
    polls: dict[int, PollInfo]
    poll_votes: dict[int, PollVotes]
    registers: Registers


class TemplateData(BaseModel):
    mucken_listen: MuckenListenData
    polls: list[PollInfo]


class RelImportEnvironment(Environment):
    """Override join_path() to enable relative template paths."""

    def join_path(self, template: str, parent: str) -> str:
        """
        template: Path of the template to be loaded, as written in the "include" statement.
        parent: Path of the template that includes the template to be loaded.
        """
        return (Path(parent).parent / template).as_posix()
