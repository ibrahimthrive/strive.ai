from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Strive.ai"
    environment: str = Field(default="development", alias="ENVIRONMENT")

    database_url: str = Field(alias="DATABASE_URL")

    jwt_secret_key: str = Field(alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=60 * 24, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    openai_api_key: str = Field(alias="OPENAI_API_KEY")
    openai_base_url: str | None = Field(default=None, alias="OPENAI_BASE_URL")
    free_tier_model: str = Field(default="gpt-4o-mini", alias="FREE_TIER_MODEL")
    pro_tier_model: str = Field(default="gpt-4o", alias="PRO_TIER_MODEL")
    free_tier_daily_upload_limit: int = Field(default=10, alias="FREE_TIER_DAILY_UPLOAD_LIMIT")

    stripe_secret_key: str = Field(alias="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str = Field(alias="STRIPE_WEBHOOK_SECRET")
    stripe_pro_price_id: str = Field(alias="STRIPE_PRO_PRICE_ID")
    stripe_business_price_id: str | None = Field(default=None, alias="STRIPE_BUSINESS_PRICE_ID")

    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
