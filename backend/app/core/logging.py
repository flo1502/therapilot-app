import logging
import sys

from app.core.config import get_settings

_CONFIGURED = False

# Fields that are safe to log: ids, flags, timings, model names. Never pass
# user_message / response text / memory content / document content to a
# logger call anywhere in this codebase - that's the line between an
# application log and a patient record. Log those to the DB (the actual
# clinical record) instead, via db/models, not via logging.
_SAFE_LOG_FORMAT = (
    "%(asctime)s level=%(levelname)s logger=%(name)s msg=%(message)s"
)


def configure_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    settings = get_settings()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(_SAFE_LOG_FORMAT))
    root = logging.getLogger()
    root.setLevel(settings.log_level)
    root.handlers = [handler]
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)
