import datetime as dtm
import html

from pydantic import BaseModel

from akalisten.models.raw_api_models.forms import FormState, FullForm, Permission, ShareType


class FormInfo(BaseModel):
    form: FullForm

    @property
    def id(self) -> int:
        return self.form.id

    @property
    def expire_date(self) -> dtm.datetime | None:
        return self.form.expires

    @property
    def html_description(self) -> str | None:
        return html.escape(self.form.description) if self.form.description else None

    @property
    def html_title(self) -> str:
        return html.escape(self.form.title)

    @property
    def public_share_hash(self) -> str | None:
        try:
            return next(
                share.shareWith for share in self.form.shares if share.shareType == ShareType.LINK
            )
        except StopIteration:
            return None

    @property
    def url(self) -> str:
        return f"https://cloud.akablas.de/apps/forms/{self.form.hash}"

    @property
    def public_url(self) -> str | None:
        if not (hash_value := self.public_share_hash):
            return None
        return f"https://cloud.akablas.de/apps/forms/s/{hash_value}"

    @property
    def embed_url(self) -> str | None:
        # Currently doesn't work. See https://github.com/nextcloud/forms/issues/2931
        if Permission.EMBED not in self.form.permissions:
            return None
        if not (hash_value := self.public_share_hash):
            return None
        return f"https://cloud.akablas.de/apps/forms/embed/{hash_value}"

    @property
    def is_active_public_form(self) -> bool:
        if self.form.state != FormState.ACTIVE:
            return False
        if (date := self.form.expires) and date < dtm.datetime.now():  # noqa: DTZ005
            return False
        if (access := self.form.access) and access.permitAllUsers:
            return True
        return any(
            share.shareType == ShareType.LINK
            or (share.shareType == ShareType.GROUP and share.shareWith == "user")
            for share in self.form.shares
        )
