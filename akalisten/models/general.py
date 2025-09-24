import html
import re

from pydantic import BaseModel, ConfigDict


class User(BaseModel):
    model_config = ConfigDict(frozen=True)
    name: str
    id: str

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, User):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        return hash(self.id)

    @property
    def display_name(self) -> str:
        # remove any text in parentheses, e.g. "John Doe (JD)" - sometimes used for nicknames
        name = re.sub(r" +\([^\)]+\) *", "", self.name).strip()
        if " " not in name:
            return name
        names = name.split(" ")
        # in case the last name has several parts, we take the first letter of each part
        return f"{names[0]} {''.join(part[0] for part in names[1:])}."

    @property
    def html_display_name(self) -> str:
        return html.escape(self.display_name)
