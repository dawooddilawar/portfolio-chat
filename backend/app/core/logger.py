# backend/app/core/logger.py

import logging
import sys
from typing import Any

def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] %(levelname)s - %(message)s"
            )
        )
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    return logger

def log_error(logger: logging.Logger, error: Any, message: str) -> None:
    """Helper function to log errors with consistent format"""
    error_type = type(error).__name__
    error_msg = str(error)
    logger.error(f"{message} | Type: {error_type} | Message: {error_msg}")