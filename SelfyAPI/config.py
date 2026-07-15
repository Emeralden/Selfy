from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    redis_token: str
    secret_key: str
    gemini_api_key: str
    env_state: str = "prod"
    engine_url: str = "http://localhost:8001"
    engine_api_key: str = "dev-key"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings() # type: ignore