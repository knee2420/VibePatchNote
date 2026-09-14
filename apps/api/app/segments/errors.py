"""Domain errors translated to HTTP only in the segments router."""


class SegmentError(Exception):
    pass


class SegmentNotFoundError(SegmentError):
    pass


class SegmentExtractionEmptyError(SegmentError):
    pass


class SegmentRevisionConflictError(SegmentError):
    def __init__(self, current_artifact_id: str | None) -> None:
        super().__init__("The segment revision is no longer current. Reload before saving.")
        self.current_artifact_id = current_artifact_id


class SegmentRelationshipTargetError(SegmentError):
    pass
