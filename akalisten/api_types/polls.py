"""Models for the polls API.
Documentation:
https://github.com/nextcloud/polls/blob/346f37964c53bb6cc132edbb1f113642d2bb2c39/docs/API_v1.0.md
"""

import datetime as dtm
import html
from typing import Optional, Union

import markdown
from pydantic import BaseModel


class PollConfiguration(BaseModel):
    title: str
    description: str
    access: str
    allowComment: bool
    allowMaybe: bool
    allowProposals: str
    anonymous: bool
    autoReminder: bool
    expire: dtm.datetime
    hideBookedUp: bool
    proposalsExpire: dtm.datetime
    showResults: str
    useNo: bool
    maxVotesPerOption: int


class PollOwner(BaseModel):
    userId: str
    displayName: str
    emailAddress: str
    subName: Optional[str] = None
    subtitle: Optional[str] = None
    isNoUser: bool
    desc: Optional[str] = None
    type: str
    id: str
    user: Optional[str] = None
    organisation: Optional[str] = None
    languageCode: Optional[str] = None
    localeCode: Optional[str] = None
    timeZone: Optional[str] = None
    icon: Optional[str] = None
    categories: Optional[list[str]] = None


class PollStatus(BaseModel):
    lastInteraction: dtm.datetime
    created: dtm.datetime
    deleted: bool
    expired: bool
    relevantThreshold: dtm.datetime


class PollCurrentUserStatus(BaseModel):
    userRole: str
    isLocked: bool
    isLoggedIn: bool
    isNoUser: bool
    isOwner: bool
    userId: str
    orphanedVotes: int
    yesVotes: int
    countVotes: int
    shareToken: str
    groupInvitations: Union[dict[str, str], list[str]]


class PollPermissions(BaseModel):
    addOptions: bool
    archive: bool
    comment: bool
    delete: bool
    edit: bool
    seeResults: bool
    seeUsernames: bool
    subscribe: bool
    view: bool
    vote: bool


class Poll(BaseModel):
    id: int
    type: str
    descriptionSafe: str
    configuration: PollConfiguration
    owner: PollOwner
    status: PollStatus
    currentUserStatus: PollCurrentUserStatus
    permissions: PollPermissions

    @property
    def html_description(self) -> str:
        return markdown.markdown(self.descriptionSafe)

    @property
    def html_title(self) -> str:
        return html.escape(self.configuration.title.removeprefix("Muckenliste: "))

    @property
    def is_mucken_liste(self) -> bool:
        if self.status.expired or self.status.deleted:
            return False
        return self.configuration.access != "private"

    @property
    def url(self) -> str:
        return f"https://cloud.akablas.de/index.php/apps/polls/vote/{self.id}"


# The below classes are reverse engineered from the JSON response of the polls API


class PollVoteUser(BaseModel):
    displayName: str
    emailAddress: str
    id: str
    isNoUser: bool
    type: str
    userId: str


class PollVote(BaseModel):
    answer: str
    deleted: dtm.datetime
    id: int
    optionId: int
    optionText: str
    pollId: int
    user: PollVoteUser


class PollOptionOwner(BaseModel):
    displayName: Optional[str] = None
    emailAddress: Optional[str] = None
    id: Optional[str] = None
    isNoUser: bool
    type: str
    userID: Optional[str] = None


class PollOptionVotes(BaseModel):
    count: int
    currentUser: Optional[str] = None
    maybe: int
    no: int
    yes: int


class PollOption(BaseModel):
    confirmed: int
    deleted: int
    duration: int
    hash: str
    id: int
    locked: bool
    order: int
    owner: PollOptionOwner
    pollId: int
    text: str
    timestamp: dtm.datetime
    votes: PollOptionVotes
