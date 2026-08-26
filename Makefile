.PHONY: dev backend frontend test test-backend test-frontend lint format migrate seed install

install:
	cd backend && uv sync --extra dev
	cd frontend && npm install

dev:
	docker compose up --build

backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	cd backend && uv run pytest -q

test-frontend:
	cd frontend && npm test

lint:
	cd backend && uv run ruff check .
	cd frontend && npm run lint

format:
	cd backend && uv run ruff format .
	cd frontend && npm run format

migrate:
	cd backend && uv run alembic upgrade head

seed:
	cd backend && uv run python -m app.seed
