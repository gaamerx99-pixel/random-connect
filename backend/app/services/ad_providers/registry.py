from typing import Optional
from app.config import ENVIRONMENT, REWARDED_AD_PROVIDER, REWARDED_ADS_TEST_MODE
from app.services.ad_providers.base import RewardedAdProvider
from app.services.ad_providers.dev_provider import DevRewardedAdProvider
from app.services.ad_providers.production_provider import WebRewardedAdProvider


def get_reward_provider(provider_name: Optional[str] = None) -> RewardedAdProvider:
    """
    Factory function to retrieve the appropriate rewarded ad provider.

    Resolution order:
    1. If explicit provider_name is given and equals 'dev':
       - In development test mode: returns DevRewardedAdProvider
       - In production: returns DevRewardedAdProvider (which will enforce the 403 Forbidden check)
    2. If REWARDED_AD_PROVIDER is set and not 'dev':
       - returns WebRewardedAdProvider
    3. If ENVIRONMENT != 'production' and REWARDED_ADS_TEST_MODE is True:
       - returns DevRewardedAdProvider
    4. Otherwise returns WebRewardedAdProvider (which will be marked as unconfigured if credentials missing)
    """
    req_name = (provider_name or "").strip().lower()

    if req_name == "dev":
        return DevRewardedAdProvider()

    configured_provider = (REWARDED_AD_PROVIDER or "").strip().lower()

    if req_name:
        # User specified a specific provider
        if req_name == configured_provider:
            return WebRewardedAdProvider()
        # If neither dev nor configured provider:
        return WebRewardedAdProvider()

    if configured_provider and configured_provider != "dev":
        return WebRewardedAdProvider()

    if ENVIRONMENT != "production" and REWARDED_ADS_TEST_MODE:
        return DevRewardedAdProvider()

    return WebRewardedAdProvider()
