from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    secret_key: str
    gemini_api_key: str
    env_state: str = "dev"

    class Config:
        env_file = ".env"

settings = Settings() # type: ignore