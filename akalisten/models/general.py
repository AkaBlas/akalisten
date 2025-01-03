import html

from pydantic import BaseModel, ConfigDict


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
