class GroqError(Exception):
    pass


class GroqAuthError(GroqError):
    pass


class GroqRateLimitError(GroqError):
    pass


class GroqTimeoutError(GroqError):
    pass


class GroqServerError(GroqError):
    pass


class GroqBadResponseError(GroqError):
    pass
