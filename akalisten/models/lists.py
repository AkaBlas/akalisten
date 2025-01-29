import datetime as dtm
import html
from typing import Self

from pydantic import AnyUrl, BaseModel, Field, RootModel, model_validator


class List(BaseModel):
    id: int | str
    display_title: str
    description: str | None = None
    available_offline: bool
    basic_url: AnyUrl | None = None
    login_url: AnyUrl | None = None
    expire_date: dtm.datetime | None = None

    @model_validator(mode="after")
    def _validate_on_init(self) -> Self:
        if not any([self.basic_url, self.login_url, self.available_offline]):
            raise ValueError("At least one URL must be provided or the list must be offline.")
        return self

    @property
    def html_title(self) -> str:
        return html.escape(self.display_title)

    @property
    def html_description(self) -> str:
        return html.escape(self.description) if self.description else ""


class Lists(RootModel):
    root: list[List] = Field(default_factory=list)
