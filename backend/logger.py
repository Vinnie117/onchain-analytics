import logging


class CustomFormatter(logging.Formatter):
    # ANSI escape codes for coloring text
    RED = "\033[91m"
    GREEN = "\033[92m"
    RESET = "\033[0m"

    # format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"
    format = '%(levelname)s:  %(module)s.py  --  %(message)s'

    FORMATS = {
        # logging.DEBUG: grey + format + reset,
        logging.INFO: GREEN + format + RESET,
        # logging.WARNING: yellow + format + reset,
        logging.ERROR: RED + format + RESET,
        # logging.CRITICAL: bold_red + format + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)


# create logger
logger = logging.getLogger("regression_logger")
logger.setLevel(logging.INFO)

# create stream handler to define logs displayed in console
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
handler.setFormatter(CustomFormatter())

logger.addHandler(handler)