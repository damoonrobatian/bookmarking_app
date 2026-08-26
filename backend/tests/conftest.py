import os

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-automated-tests")
os.environ.setdefault("COOKIE_SECURE", "false")

from collections.abc import Generator

import pytest
from app.database import Base, get_db
from app.main import app
from app.models import Bookmark, Folder, Tag, User  # noqa: F401
from app.services.metadata import PageMetadata
from app.utils.urls import domain_from_url
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def engine():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(test_engine, "connect")
    def _fk(dbapi_connection, _record):  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(test_engine)
    yield test_engine
    Base.metadata.drop_all(test_engine)


@pytest.fixture
def db(engine) -> Generator[Session, None, None]:
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def _stub_metadata(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_extract(url: str) -> PageMetadata:
        return PageMetadata(None, None, None, domain_from_url(url), "skipped")

    monkeypatch.setattr("app.services.bookmark.extract_metadata", fake_extract)


@pytest.fixture
def client(engine) -> Generator[TestClient, None, None]:
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

    def override_get_db() -> Generator[Session, None, None]:
        session = TestingSession()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register_user(
    client: TestClient,
    email: str = "ada@example.com",
    password: str = "correct-horse",
    display_name: str = "Ada",
) -> TestClient:
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "display_name": display_name},
    )
    assert response.status_code == 201, response.text
    return client
