import datetime as dtm
import html

from pydantic import BaseModel, Field, RootModel


class ChatGroup(BaseModel):
    title: str
    sorting: int = 0
    description: str | None = None
    signal_url: str | None = None
    whatsapp_url: str | None = None
    expire_date: dtm.datetime | None = None

    @property
    def html_title(self) -> str:
        return html.escape(self.title)

    @property
    def html_description(self) -> str:
        return html.escape(self.description) if self.description else ""


class ChatGroups(RootModel):
    root: list[ChatGroup] = Field(default_factory=list)

    @property
    def active_groups(self) -> list[ChatGroup]:
        now = dtm.datetime.now(tz=dtm.UTC)
        return sorted(
            (g for g in self.root if g.expire_date is None or g.expire_date >= now),
            key=lambda g: g.sorting,
        )
