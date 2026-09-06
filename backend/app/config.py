import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/randomconnect")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
CLERK_PEM_PUBLIC_KEY = os.getenv("CLERK_PEM_PUBLIC_KEY", "")
CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "RS256")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
REWARDED_AD_PROVIDER = os.getenv("REWARDED_AD_PROVIDER", "").strip().lower()
REWARDED_ADS_TEST_MODE = (
    os.getenv(
        "REWARDED_ADS_TEST_MODE",
        "true" if ENVIRONMENT != "production" else "false",
    )
    .strip()
    .lower()
    in {"1", "true", "yes", "on"}
)

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://random-connect-ten.vercel.app",
    "https://65.2.150.177.sslip.io",
]
