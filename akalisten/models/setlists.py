from pydantic import BaseModel

from akalisten.clients._utils import OptionalDateTimeField


class Setlist(BaseModel):
    id: int
    title: str
    description: str | None
    startDateTime: OptionalDateTimeField
    duration: int | None
    defaultModerationDuration: int | None
    folderCollectionVersionId: int | None
    isDraft: bool
    isPublished: bool

    @property
    def url(self) -> str:
        return f"https://cloud.akablas.de/index.php/apps/orchestrascoresmanager/setlists/{self.id}"
