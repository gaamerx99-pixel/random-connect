import asyncio
import copy
from datetime import datetime
import json
import os
from typing import Any, Dict, List, Optional
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
from pymongo.errors import (
    AutoReconnect,
    ConfigurationError,
    ConnectionFailure,
    NetworkTimeout,
    PyMongoError,
    ServerSelectionTimeoutError,
)

from app.config import MONGO_URI

# Ensure data directory exists for local persistence
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
LOCAL_DB_PATH = os.path.join(DATA_DIR, "local_db.json")

# Default seed profile for Shivam / guest user
DEFAULT_USERS: Dict[str, Any] = {
    "guest_user": {
        "clerk_id": "guest_user",
        "email": "shivam@example.com",
        "name": "Shivam",
        "gender": "male",
        "looking_for": "anyone",
        "age": 21,
        "country": "India",
        "city": "Mumbai",
        "languages": ["English", "Hindi"],
        "interests": ["Gaming", "3D", "Tech", "Music"],
        "image": "",
        "bio": "Just a normal guy who loves meeting new people and having great conversations.",
        "is_online": True,
        "is_profile_completed": True,
        "blocked_users": [],
        "friends": [],
        "female_reward_ads_completed": 0,
        "female_match_credits": 0,
        "female_reward_unlocks": 0,
        "female_match_credits_consumed": 0,
        "created_at": "2026-08-01T00:00:00.000000",
        "last_seen": "2026-09-05T00:00:00.000000",
    }
}


class LocalCursor:
    """Async cursor mimicking PyMongo/Motor cursor for find operations."""

    def __init__(self, docs: List[Dict[str, Any]], projection: Optional[Dict[str, Any]] = None):
        self._projection = projection
        self._docs = [apply_projection(d, projection) for d in docs]
        self._pos = 0

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for k, d in reversed(key_or_list):
                self._docs.sort(key=lambda x: str(x.get(k, "")), reverse=(d == -1))
        else:
            self._docs.sort(key=lambda x: str(x.get(key_or_list, "")), reverse=(direction == -1))
        return self

    def skip(self, n: int):
        self._docs = self._docs[n:]
        return self

    def limit(self, n: int):
        self._docs = self._docs[:n]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return copy.deepcopy(self._docs[:length])
        return copy.deepcopy(self._docs)

    def __aiter__(self):
        self._pos = 0
        return self

    async def __anext__(self):
        if self._pos < len(self._docs):
            doc = copy.deepcopy(self._docs[self._pos])
            self._pos += 1
            return doc
        raise StopAsyncIteration


def match_doc(doc: Dict[str, Any], query: Optional[Dict[str, Any]]) -> bool:
    """Match document against a MongoDB-style query filter."""
    if not query:
        return True

    for key, condition in query.items():
        if key == "$or":
            if not any(match_doc(doc, subq) for subq in condition):
                return False
            continue
        if key == "$and":
            if not all(match_doc(doc, subq) for subq in condition):
                return False
            continue

        val = doc.get(key)
        if isinstance(condition, dict):
            for op, target in condition.items():
                if op == "$gt":
                    if val is None or val <= target:
                        return False
                elif op == "$gte":
                    if val is None or val < target:
                        return False
                elif op == "$lt":
                    if val is None or val >= target:
                        return False
                elif op == "$lte":
                    if val is None or val > target:
                        return False
                elif op == "$ne":
                    if val == target:
                        return False
                elif op == "$in":
                    if val not in target:
                        return False
                elif op == "$nin":
                    if val in target:
                        return False
                elif op == "$exists":
                    exists = key in doc
                    if exists != bool(target):
                        return False
                else:
                    if val != target:
                        return False
        else:
            if val != condition:
                return False
    return True


def apply_projection(doc: Dict[str, Any], projection: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Apply MongoDB-style projection to document."""
    if not projection:
        return copy.deepcopy(doc)

    is_exclusion = all(v == 0 for k, v in projection.items())
    if is_exclusion:
        res = copy.deepcopy(doc)
        for k in projection:
            res.pop(k, None)
        return res

    res = {}
    for k, v in projection.items():
        if v and k in doc:
            res[k] = copy.deepcopy(doc[k])
    if projection.get("_id", 1) and "_id" in doc and "_id" not in res:
        res["_id"] = doc["_id"]
    elif projection.get("_id") == 0:
        res.pop("_id", None)
    return res


def apply_update(doc: Dict[str, Any], update: Any) -> Dict[str, Any]:
    """Apply MongoDB update operators ($set, $inc, $addToSet, $push, pipeline) to a document."""
    if isinstance(update, list):
        for stage in update:
            if isinstance(stage, dict) and "$set" in stage:
                for k, v in stage["$set"].items():
                    doc[k] = copy.deepcopy(v)
        return doc

    if not isinstance(update, dict):
        return doc

    if "$set" in update:
        for k, v in update["$set"].items():
            doc[k] = copy.deepcopy(v)

    if "$inc" in update:
        for k, v in update["$inc"].items():
            doc[k] = doc.get(k, 0) + v

    if "$addToSet" in update:
        for k, v in update["$addToSet"].items():
            if k not in doc or not isinstance(doc[k], list):
                doc[k] = []
            if isinstance(v, dict) and "$each" in v:
                for item in v["$each"]:
                    if item not in doc[k]:
                        doc[k].append(copy.deepcopy(item))
            else:
                if v not in doc[k]:
                    doc[k].append(copy.deepcopy(v))

    if "$push" in update:
        for k, v in update["$push"].items():
            if k not in doc or not isinstance(doc[k], list):
                doc[k] = []
            if isinstance(v, dict) and "$each" in v:
                for item in v["$each"]:
                    doc[k].append(copy.deepcopy(item))
            else:
                doc[k].append(copy.deepcopy(v))

    if "$unset" in update:
        for k in update["$unset"]:
            doc.pop(k, None)

    return doc


class PersistentStorage:
    """Thread-safe persistent JSON database storage."""

    def __init__(self, filepath: str):
        self._filepath = filepath
        self._lock = asyncio.Lock()
        self._data: Dict[str, List[Dict[str, Any]]] = {
            "users": [],
            "matches": [],
            "reports": [],
            "blocks": [],
            "friends": [],
            "rewarded_ads": [],
            "reward_logs": [],
        }
        self._load()

    def _load(self):
        if os.path.exists(self._filepath):
            try:
                with open(self._filepath, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                if isinstance(loaded, dict):
                    for col, docs in loaded.items():
                        if isinstance(docs, list):
                            self._data[col] = docs
            except Exception as e:
                print(f"[DB Warning] Error loading {self._filepath}: {e}")

        # Seed default users if empty
        if not self._data["users"]:
            for u in DEFAULT_USERS.values():
                self._data["users"].append(copy.deepcopy(u))
            self._save_sync()

    def _save_sync(self):
        try:
            tmp_path = f"{self._filepath}.tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, ensure_ascii=False)
            os.replace(tmp_path, self._filepath)
        except Exception as e:
            print(f"[DB Warning] Error saving {self._filepath}: {e}")

    async def save(self):
        async with self._lock:
            self._save_sync()

    def get_collection_docs(self, col_name: str) -> List[Dict[str, Any]]:
        if col_name not in self._data:
            self._data[col_name] = []
        return self._data[col_name]


_global_storage = PersistentStorage(LOCAL_DB_PATH)


class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int, upserted_id=None):
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.upserted_id = upserted_id


class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class ResilientCollection:
    """
    Transparent proxy for Motor collection that automatically fails over
    to local persistent storage when MongoDB Atlas connection fails (e.g. SSL / timeout).
    """

    def __init__(self, motor_col, name: str):
        self._motor_col = motor_col
        self._name = name
        self._storage = _global_storage

    async def find_one(self, filter: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        try:
            return await self._motor_col.find_one(filter, projection)
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            # Fallback to local persistence
            docs = self._storage.get_collection_docs(self._name)
            for d in docs:
                if match_doc(d, filter):
                    return apply_projection(d, projection)
            return None

    def find(self, filter: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        """Returns cursor that executes find against Atlas or local store."""
        motor_cursor = self._motor_col.find(filter, projection)
        return ResilientCursor(self, motor_cursor, filter, projection)

    async def insert_one(self, doc: Dict[str, Any]) -> InsertOneResult:
        doc_copy = copy.deepcopy(doc)
        try:
            res = await self._motor_col.insert_one(doc)
            # Mirror to local store
            async with self._storage._lock:
                docs = self._storage.get_collection_docs(self._name)
                if "clerk_id" in doc_copy:
                    docs[:] = [d for d in docs if d.get("clerk_id") != doc_copy.get("clerk_id")]
                docs.append(doc_copy)
                self._storage._save_sync()
            return res
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            async with self._storage._lock:
                docs = self._storage.get_collection_docs(self._name)
                if "clerk_id" in doc_copy:
                    docs[:] = [d for d in docs if d.get("clerk_id") != doc_copy.get("clerk_id")]
                docs.append(doc_copy)
                self._storage._save_sync()
            return InsertOneResult(inserted_id=doc_copy.get("_id", doc_copy.get("clerk_id", "local_id")))

    async def update_one(self, filter: Dict[str, Any], update: Any, upsert: bool = False) -> UpdateResult:
        try:
            res = await self._motor_col.update_one(filter, update, upsert=upsert)
            # Also apply locally to keep store consistent
            async with self._storage._lock:
                docs = self._storage.get_collection_docs(self._name)
                matched = False
                for d in docs:
                    if match_doc(d, filter):
                        apply_update(d, update)
                        matched = True
                        break
                if not matched and upsert:
                    new_doc = copy.deepcopy(filter)
                    apply_update(new_doc, update)
                    docs.append(new_doc)
                self._storage._save_sync()
            return res
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            async with self._storage._lock:
                docs = self._storage.get_collection_docs(self._name)
                matched = 0
                for d in docs:
                    if match_doc(d, filter):
                        apply_update(d, update)
                        matched += 1
                        break
                if matched == 0 and upsert:
                    new_doc = copy.deepcopy(filter)
                    apply_update(new_doc, update)
                    docs.append(new_doc)
                    matched = 1
                self._storage._save_sync()
            return UpdateResult(matched_count=matched, modified_count=matched)

    async def find_one_and_update(self, filter: Dict[str, Any], update: Any, return_document=None) -> Optional[Dict[str, Any]]:
        try:
            res = await self._motor_col.find_one_and_update(filter, update, return_document=return_document)
            # Sync update to local store
            async with self._storage._lock:
                docs = self._storage.get_collection_docs(self._name)
                for d in docs:
                    if match_doc(d, filter):
                        apply_update(d, update)
                        break
                self._storage._save_sync()
            return res
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            async with self._storage._lock:
                docs = self._storage.get_collection_docs(self._name)
                for d in docs:
                    if match_doc(d, filter):
                        apply_update(d, update)
                        self._storage._save_sync()
                        return copy.deepcopy(d)
                return None

    async def count_documents(self, filter: Optional[Dict[str, Any]] = None) -> int:
        try:
            return await self._motor_col.count_documents(filter or {})
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            docs = self._storage.get_collection_docs(self._name)
            return sum(1 for d in docs if match_doc(d, filter))

    async def delete_one(self, filter: Dict[str, Any]) -> DeleteResult:
        try:
            res = await self._motor_col.delete_one(filter)
            async with self._storage._lock:
                docs = self._storage.get_collection_docs(self._name)
                for idx, d in enumerate(docs):
                    if match_doc(d, filter):
                        docs.pop(idx)
                        break
                self._storage._save_sync()
            return res
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            async with self._storage._lock:
                docs = self._storage.get_collection_docs(self._name)
                deleted = 0
                for idx, d in enumerate(docs):
                    if match_doc(d, filter):
                        docs.pop(idx)
                        deleted = 1
                        break
                self._storage._save_sync()
            return DeleteResult(deleted_count=deleted)

    async def create_index(self, *args, **kwargs):
        try:
            return await self._motor_col.create_index(*args, **kwargs)
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            return str(args[0]) if args else "index"

    def aggregate(self, pipeline: List[Dict[str, Any]]):
        motor_cursor = self._motor_col.aggregate(pipeline)
        return ResilientAggregateCursor(self, motor_cursor, pipeline)


class ResilientCursor:
    def __init__(self, parent: ResilientCollection, motor_cursor, filter, projection):
        self._parent = parent
        self._motor_cursor = motor_cursor
        self._filter = filter
        self._projection = projection
        self._sort_params = None
        self._skip_val = 0
        self._limit_val = None

    def sort(self, key_or_list, direction=1):
        self._sort_params = (key_or_list, direction)
        try:
            self._motor_cursor = self._motor_cursor.sort(key_or_list, direction)
        except Exception:
            pass
        return self

    def skip(self, n: int):
        self._skip_val = n
        try:
            self._motor_cursor = self._motor_cursor.skip(n)
        except Exception:
            pass
        return self

    def limit(self, n: int):
        self._limit_val = n
        try:
            self._motor_cursor = self._motor_cursor.limit(n)
        except Exception:
            pass
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        try:
            return await self._motor_cursor.to_list(length=length)
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            docs = self._parent._storage.get_collection_docs(self._parent._name)
            matched = [d for d in docs if match_doc(d, self._filter)]
            cursor = LocalCursor(matched, self._projection)
            if self._sort_params:
                cursor.sort(*self._sort_params)
            if self._skip_val:
                cursor.skip(self._skip_val)
            if self._limit_val is not None:
                cursor.limit(self._limit_val)
            return await cursor.to_list(length)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return await self._motor_cursor.__anext__()
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            docs = await self.to_list()
            cursor = LocalCursor(docs)
            return await cursor.__anext__()


class ResilientAggregateCursor:
    def __init__(self, parent: ResilientCollection, motor_cursor, pipeline):
        self._parent = parent
        self._motor_cursor = motor_cursor
        self._pipeline = pipeline

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        try:
            return await self._motor_cursor.to_list(length=length)
        except (ServerSelectionTimeoutError, AutoReconnect, NetworkTimeout, ConfigurationError, ConnectionFailure):
            docs = self._parent._storage.get_collection_docs(self._parent._name)
            return [{
                "_id": None,
                "female_ad_unlocks": sum(int(d.get("female_reward_unlocks") or 0) for d in docs),
                "female_connection_credits_consumed": sum(int(d.get("female_match_credits_consumed") or 0) for d in docs),
                "remaining_female_connection_credits": sum(int(d.get("female_match_credits") or 0) for d in docs),
            }]


# Configure Motor AsyncIOMotorClient
client_kwargs = {
    "serverSelectionTimeoutMS": 2000,
    "connectTimeoutMS": 2000,
    "socketTimeoutMS": 4000,
}

if "mongodb+srv://" in MONGO_URI or "tls=true" in MONGO_URI.lower() or "ssl=true" in MONGO_URI.lower():
    client_kwargs["tlsCAFile"] = certifi.where()

client = AsyncIOMotorClient(
    MONGO_URI,
    **client_kwargs,
)

db = client.randomconnect

# Resilient collection instances
users_collection = ResilientCollection(db.users, "users")
matches_collection = ResilientCollection(db.matches, "matches")
reports_collection = ResilientCollection(db.reports, "reports")
blocks_collection = ResilientCollection(db.blocks, "blocks")
friends_collection = ResilientCollection(db.friends, "friends")
rewarded_ads_collection = ResilientCollection(db.rewarded_ads, "rewarded_ads")
reward_logs_collection = ResilientCollection(db.reward_logs, "reward_logs")


async def init_indexes():
    """Create indexes for faster matchmaking and queries."""
    try:
        await users_collection.create_index("clerk_id", unique=True)
        await users_collection.create_index("gender")
        await users_collection.create_index("is_online")
        await reports_collection.create_index("reporter_clerk_id")
        await users_collection.create_index([
            ("gender", ASCENDING),
            ("looking_for", ASCENDING),
            ("female_match_credits", ASCENDING),
        ])
        await rewarded_ads_collection.create_index([
            ("provider", ASCENDING),
            ("reward_event_id", ASCENDING),
        ], unique=True)
        await rewarded_ads_collection.create_index("clerk_id")
        await reward_logs_collection.create_index("status")
        await reward_logs_collection.create_index([
            ("clerk_id", ASCENDING),
            ("created_at", ASCENDING),
        ])
        print("[DB] MongoDB indexes ready.")
    except Exception as e:
        print(f"[DB Index Warning]: {e}")

