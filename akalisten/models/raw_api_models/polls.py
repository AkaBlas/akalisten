"""Models for the polls API.
Documentation:
https://github.com/nextcloud/polls/blob/346f37964c53bb6cc132edbb1f113642d2bb2c39/docs/API_v1.0.md
"""

from typing import Annotated

from pydantic import BaseModel, BeforeValidator, HttpUrl

from akalisten.clients._utils import OptionalDateTimeField, RequiredDateTimeField


class PollConfiguration(BaseModel):
    title: str
    description: str
    access: str
    allowComment: bool
    allowMaybe: bool
    allowProposals: str
    anonymous: bool
    autoReminder: bool
    expire: OptionalDateTimeField
    hideBookedUp: bool
    proposalsExpire: OptionalDateTimeField
    showResults: str
    useNo: bool
    maxVotesPerOption: int


class PollOwner(BaseModel):
    userId: str
    displayName: str
    emailAddress: str
    subName: str | None = None
    subtitle: str | None = None
    isNoUser: bool
    desc: str | None = None
    type: str
    id: str
    user: str | None = None
    organisation: str | None = None
    languageCode: str | None = None
    localeCode: str | None = None
    timeZone: str | None = None
    icon: str | None = None
    categories: Annotated[list[str] | None, BeforeValidator(lambda v: None if v == "" else v)] = (
        None
    )


class PollStatus(BaseModel):
    lastInteraction: RequiredDateTimeField
    created: RequiredDateTimeField
    deleted: bool | None = None
    expired: bool | None = None
    relevantThreshold: RequiredDateTimeField


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
    groupInvitations: dict[str, str] | list[str]


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
    deleted: OptionalDateTimeField
    id: int
    optionId: int
    optionText: str
    pollId: int
    user: PollVoteUser


class PollOptionOwner(BaseModel):
    displayName: str | None = None
    emailAddress: str | None = None
    id: str | None = None
    isNoUser: bool
    type: str
    userID: str | None = None


class PollOptionVotes(BaseModel):
    count: int
    currentUser: str | None = None
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
    owner: PollOptionOwner | None = None
    pollId: int
    text: str
    timestamp: OptionalDateTimeField
    votes: PollOptionVotes


class PollShare(BaseModel):
    type: str
    id: int
    token: str
    pollId: int
    userId: str | None = None
    emailAddress: str | None = None
    invitationSent: bool
    reminderSent: bool
    locked: bool
    label: str
    URL: HttpUrl
    showLogin: bool | None = None
    publicPollEmail: str
    voted: bool
    deleted: bool
    user: PollOwner
