import html

from pydantic import BaseModel

from akalisten.models.general import User


class RegisterCircle(BaseModel):
    name: str
    id: str
    members: set[User]

    @property
    def display_name(self) -> str:
        return self.name.removeprefix("Register ")

    @property
    def html_display_name(self) -> str:
        return html.escape(self.display_name)


class Registers(BaseModel):
    registers: list[RegisterCircle]

    def get_from_name(self, name: str) -> RegisterCircle | None:
        circle_name = {
            "Schlagzeug": "Schlagwerk",
            "Flöte/Oboe": "Flöte+Oboe",
            "Klarinette": "Klarinette",
            "Altsaxophon": "Saxophon",
            "Tenorsaxophon": "Saxophon",
            "Ba(ri)ssklagott": None,
            "Trompete": "Trompete+Flügelhorn",
            "Flügelhorn": "Trompete+Flügelhorn",
            "Horn": "Horn",
            "TenBarEuph": "TenBarEuph",
            "Posaune": "Posaune",
            "Tuba": "Bass",
            "Gitarre": "Bass",
        }.get(name)

        if circle_name is None:
            return None

        try:
            return next(circle for circle in self.registers if circle.name.endswith(circle_name))
        except StopIteration:
            return None
