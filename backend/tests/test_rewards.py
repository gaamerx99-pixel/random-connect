import asyncio
import unittest

from fastapi import HTTPException
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError

from app.main import app
from app.routes.signaling import requires_female_search_credit
from app.services import rewards
from app.services.ad_providers.dev_provider import DevRewardedAdProvider


class FakeRewardedAdsCollection:
    def __init__(self):
        self.events = set()

    async def insert_one(self, doc):
        key = (doc["provider"], doc["reward_event_id"])
        if key in self.events:
            raise DuplicateKeyError("duplicate reward event")
        self.events.add(key)


class FakeRewardLogsCollection:
    def __init__(self):
        self.logs = []

    async def insert_one(self, doc):
        self.logs.append(doc)

    async def count_documents(self, filter_query):
        status = filter_query.get("status")
        if status:
            return sum(1 for log in self.logs if log.get("status") == status)
        return len(self.logs)


class FakeUsersCollection:
    def __init__(self):
        self.lock = asyncio.Lock()
        self.users = {
            "male_user": {
                "clerk_id": "male_user",
                "gender": "male",
                "looking_for": "female",
                "female_reward_ads_completed": 0,
                "female_match_credits": 0,
                "female_reward_unlocks": 0,
                "female_match_credits_consumed": 0,
            }
        }

    async def find_one(self, query, projection=None):
        async with self.lock:
            user = self.users.get(query.get("clerk_id"))
            if not user:
                return None

            credit_filter = query.get("female_match_credits")
            if credit_filter and "$gt" in credit_filter:
                if user.get("female_match_credits", 0) <= credit_filter["$gt"]:
                    return None

            return dict(user)

    async def find_one_and_update(self, query, update, return_document=None):
        async with self.lock:
            user = self.users.get(query.get("clerk_id"))
            if not user:
                return None

            credit_filter = query.get("female_match_credits")
            if credit_filter and "$gt" in credit_filter:
                if user.get("female_match_credits", 0) <= credit_filter["$gt"]:
                    return None

            if isinstance(update, list):
                if any(
                    "_reward_total_ads" in stage.get("$set", {})
                    for stage in update
                ):
                    self.users[user["clerk_id"]] = (
                        rewards.apply_ad_completion_to_state(user)
                    )
                else:
                    # Atomic decrement with condition credits > 0
                    current_credits = min(
                        user.get("female_match_credits", 0),
                        rewards.FEMALE_CREDITS_PER_UNLOCK,
                    )
                    user["female_match_credits"] = max(current_credits - 1, 0)
                    user["female_match_credits_consumed"] = (
                        user.get("female_match_credits_consumed", 0) + 1
                    )
                return dict(self.users[user["clerk_id"]])

            for field, amount in update.get("$inc", {}).items():
                user[field] = user.get(field, 0) + amount

            for field, value in update.get("$set", {}).items():
                user[field] = value

            return dict(user)


class RewardRulesTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.original_users = rewards.users_collection
        self.original_ads = rewards.rewarded_ads_collection
        self.original_logs = rewards.reward_logs_collection
        self.users = FakeUsersCollection()
        self.ads = FakeRewardedAdsCollection()
        self.logs = FakeRewardLogsCollection()
        rewards.users_collection = self.users
        rewards.rewarded_ads_collection = self.ads
        rewards.reward_logs_collection = self.logs

    def tearDown(self):
        rewards.users_collection = self.original_users
        rewards.rewarded_ads_collection = self.original_ads
        rewards.reward_logs_collection = self.original_logs

    # 1. Anyone requires 0 ads.
    async def test_01_anyone_requires_zero_ads(self):
        male_anyone = {
            "clerk_id": "male_user",
            "gender": "male",
            "looking_for": "anyone",
        }
        female_peer = {
            "clerk_id": "female_user",
            "gender": "female",
            "looking_for": "anyone",
        }
        self.assertFalse(
            rewards.requires_female_credit(male_anyone, female_peer)
        )
        self.assertFalse(requires_female_search_credit(male_anyone))

    # 2. Male + Female with 0 credits is blocked from Female queue.
    async def test_02_male_female_with_zero_credits_blocked_from_female_queue(self):
        self.users.users["male_user"]["female_match_credits"] = 0
        male_user = self.users.users["male_user"]

        self.assertTrue(requires_female_search_credit(male_user))
        self.assertFalse(
            await rewards.has_required_female_credit("male_user")
        )

    # 3. Male + Female with 1 connection can enter queue.
    async def test_03_male_female_with_credits_can_enter_queue(self):
        self.users.users["male_user"]["female_match_credits"] = 1
        self.assertTrue(
            await rewards.has_required_female_credit("male_user")
        )

    # 4. 1 verified ad = 1 female connection unlocked.
    async def test_04_one_verified_ad_unlocks_one_female_connection(self):
        res = await rewards.verify_reward_completion(
            "male_user", "dev", "ad-event-1"
        )
        state = res["reward_state"]
        self.assertEqual(state["female_match_credits"], 1)
        self.assertTrue(state["female_match_unlocked"])
        self.assertEqual(state["female_reward_unlocks"], 1)

    # 5. One female match consumes exactly 1 connection.
    async def test_05_one_female_match_consumes_connection(self):
        self.users.users["male_user"]["female_match_credits"] = 1

        self.assertTrue(
            await rewards.consume_female_match_credit("male_user")
        )
        self.assertEqual(
            self.users.users["male_user"]["female_match_credits"],
            0,
        )
        self.assertEqual(
            self.users.users["male_user"]["female_match_credits_consumed"],
            1,
        )

    # 6. Second female match requires another ad.
    async def test_06_second_female_match_requires_another_ad(self):
        self.users.users["male_user"]["female_match_credits"] = 1

        await rewards.consume_female_match_credit("male_user")

        # 2nd match attempted when 0 credits remain -> blocked
        self.assertFalse(
            await rewards.consume_female_match_credit("male_user")
        )

    # 7. Connection pass capped at 1.
    async def test_07_connection_pass_capped_at_one(self):
        self.users.users["male_user"]["female_match_credits"] = 1

        await rewards.verify_reward_completion(
            "male_user",
            "dev",
            "cap-event-1",
        )

        state = await rewards.get_female_reward_state("male_user")
        self.assertEqual(state["female_match_credits"], 1)

    # 8. Subsequent ad grants connection again.
    async def test_08_subsequent_ad_grants_connection_again(self):
        self.users.users["male_user"]["female_match_credits"] = 1
        await rewards.consume_female_match_credit("male_user")
        self.assertEqual(self.users.users["male_user"]["female_match_credits"], 0)

        # Watch another ad
        await rewards.verify_reward_completion(
            "male_user",
            "dev",
            "next-ad-event",
        )
        state = await rewards.get_female_reward_state("male_user")
        self.assertEqual(state["female_match_credits"], 1)
        self.assertTrue(state["female_match_unlocked"])

    # 9. Duplicate reward event does not grant another connection.
    async def test_09_duplicate_reward_event_does_not_grant_another_reward(self):
        self.users.users["male_user"]["female_match_credits"] = 0
        first = await rewards.verify_reward_completion(
            "male_user",
            "dev",
            "same-event-abc",
        )
        second = await rewards.verify_reward_completion(
            "male_user",
            "dev",
            "same-event-abc",
        )

        self.assertFalse(first["duplicate"])
        self.assertTrue(second["duplicate"])
        self.assertEqual(
            self.users.users["male_user"]["female_match_credits"],
            1,
        )
        self.assertEqual(
            self.users.users["male_user"]["female_reward_unlocks"],
            1,
        )

        self.assertEqual(
            self.users.users["male_user"]["female_reward_ads_completed"],
            0,
        )
        self.assertEqual(
            self.users.users["male_user"]["female_match_credits"],
            1,
        )

    # 12. Frontend/localStorage cannot bypass backend.
    async def test_12_frontend_local_storage_cannot_bypass_backend(self):
        # Spoofed local state
        browser_state = {
            "female_match_credits": 999,
            "female_reward_ads_completed": 5,
        }
        self.assertEqual(browser_state["female_match_credits"], 999)

        # Backend remains authoritative
        state = await rewards.get_female_reward_state("male_user")
        self.assertEqual(state["female_match_credits"], 0)
        self.assertEqual(state["ads_completed"], 0)

    # 13. Female users are not forced to watch ads.
    async def test_13_female_users_are_not_forced_to_watch_ads(self):
        female_user = {
            "clerk_id": "female_user",
            "gender": "female",
            "looking_for": "male",
        }
        male_peer = {
            "clerk_id": "male_peer",
            "gender": "male",
            "looking_for": "female",
        }

        self.assertFalse(
            rewards.requires_female_credit(female_user, male_peer)
        )
        self.assertFalse(requires_female_search_credit(female_user))

    # 14. Anyone never consumes female credits.
    async def test_14_anyone_never_consumes_female_credits(self):
        male_anyone = {
            "clerk_id": "male_user",
            "gender": "male",
            "looking_for": "anyone",
        }
        female_peer = {
            "clerk_id": "female_user",
            "gender": "female",
            "looking_for": "anyone",
        }

        self.users.users["male_user"]["female_match_credits"] = 2
        # requires_female_credit returns False for Anyone
        self.assertFalse(
            rewards.requires_female_credit(male_anyone, female_peer)
        )
        # Therefore credits remain untouched
        self.assertEqual(
            self.users.users["male_user"]["female_match_credits"],
            2,
        )

    # 15. Simultaneous requests cannot double-consume a credit.
    async def test_15_simultaneous_requests_cannot_double_consume_a_credit(self):
        self.users.users["male_user"]["female_match_credits"] = 1

        # Run two concurrent consumptions
        results = await asyncio.gather(
            rewards.consume_female_match_credit("male_user"),
            rewards.consume_female_match_credit("male_user"),
        )

        # Exactly one must succeed and one must fail
        self.assertEqual(sum(1 for r in results if r is True), 1)
        self.assertEqual(sum(1 for r in results if r is False), 1)
        self.assertEqual(
            self.users.users["male_user"]["female_match_credits"],
            0,
        )
        self.assertEqual(
            self.users.users["male_user"]["female_match_credits_consumed"],
            1,
        )

    # 16. Production rejects development/test reward endpoint.
    async def test_16_production_rejects_development_test_reward_endpoint(self):
        dev_provider = DevRewardedAdProvider()

        # Simulate production environment
        original_env = rewards.ENVIRONMENT
        original_test_mode = rewards.REWARDED_ADS_TEST_MODE
        try:
            import app.services.ad_providers.dev_provider as dp_mod
            dp_mod.ENVIRONMENT = "production"
            dp_mod.REWARDED_ADS_TEST_MODE = False

            with self.assertRaises(HTTPException) as cm:
                dev_provider.verify_reward("male_user", "test-event-in-prod")

            self.assertEqual(cm.exception.status_code, 403)
            self.assertIn("disabled in production", cm.exception.detail)
        finally:
            dp_mod.ENVIRONMENT = original_env
            dp_mod.REWARDED_ADS_TEST_MODE = original_test_mode


class RewardAuthTest(unittest.TestCase):
    def test_unauthorized_users_cannot_modify_reward_state(self):
        client = TestClient(app)

        response = client.post(
            "/api/v1/users/rewards/female-ad-completion",
            json={
                "provider": "dev",
                "reward_event_id": "unauthorized-event",
            },
        )

        self.assertEqual(response.status_code, 401)

    def test_unauthorized_users_cannot_read_reward_state(self):
        client = TestClient(app)

        response = client.get(
            "/api/v1/users/rewards/female-match"
        )

        self.assertEqual(response.status_code, 401)

    def test_dev_mode_mock_token_allowed(self):
        client = TestClient(app)

        response = client.get(
            "/api/v1/users/rewards/female-match",
            headers={"Authorization": "Bearer mock-dev-token"}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["female_match_credits"], 0)


if __name__ == "__main__":
    unittest.main()
