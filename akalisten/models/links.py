import html
from typing import Self

from pydantic import AnyUrl, BaseModel, Field, RootModel, model_validator

from akalisten.markdown import render_markdown


class Link(BaseModel):
    display_title: str
    basic_url: AnyUrl | None = None
    login_url: AnyUrl | None = None
    icon: str = "external-link"
    description: str | None = None

    @model_validator(mode="after")
    def _validate_on_init(self) -> Self:
        if not any([self.basic_url, self.login_url]):
            raise ValueError("At least one URL must be provided.")
        return self

    @property
    def html_title(self) -> str:
        return html.escape(self.display_title)

    @property
    def html_description(self) -> str:
        return render_markdown(self.description) if self.description else ""


class Links(RootModel):
    root: list[Link] = Field(default_factory=list)
