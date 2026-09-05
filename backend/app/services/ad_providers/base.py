from abc import ABC, abstractmethod
from typing import Any, Optional


class RewardedAdProvider(ABC):
    """
    Abstract interface for rewarded-ad providers.
    Supports development test mode as well as real web ad providers.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier (e.g. 'dev', 'google_web', 'adinplay')."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if the provider is fully configured with credentials."""
        pass

    @abstractmethod
    def verify_reward(
        self,
        clerk_id: str,
        reward_event_id: str,
        payload: Optional[dict[str, Any]] = None,
    ) -> tuple[bool, Optional[str]]:
        """
        Verify that a reward event is valid.

        Returns:
            (is_valid: bool, error_message: str | None)
        """
        pass

    @abstractmethod
    def handle_callback(
        self,
        payload: dict[str, Any],
        headers: dict[str, str],
    ) -> dict[str, Any]:
        """
        Handle server-side verification (SSV) webhook or provider callback.
        """
        pass
