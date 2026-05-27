# MarginBoard — common dev commands.
# Run from the repo root. Requires `make` (Git Bash, WSL, or any Unix shell).

.PHONY: help install install-dev test lint format train serve docker-up docker-down clean

help:
	@echo "Targets:"
	@echo "  install      - install backend runtime deps"
	@echo "  install-dev  - install backend dev deps (pytest, ruff, mypy, notebooks)"
	@echo "  test         - run pytest"
	@echo "  lint         - ruff check"
	@echo "  format       - ruff check --fix"
	@echo "  train        - run ml.train_all to (re)build model artifacts"
	@echo "  serve        - uvicorn dev server on :8000"
	@echo "  docker-up    - docker compose up --build"
	@echo "  docker-down  - docker compose down"
	@echo "  clean        - drop caches and processed artifacts"

install:
	cd backend && pip install -r requirements.txt

install-dev:
	cd backend && pip install -r requirements-dev.txt

test:
	cd backend && pytest -q

lint:
	cd backend && ruff check app/ ml/ tests/ scripts/

format:
	cd backend && ruff check --fix app/ ml/ tests/ scripts/

train:
	cd backend && python -m ml.train_all

serve:
	cd backend && python -m uvicorn app.main:app --reload --port 8000

docker-up:
	docker compose up --build

docker-down:
	docker compose down

clean:
	rm -rf backend/data/processed/artifacts/*
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
	find . -type d -name .pytest_cache -prune -exec rm -rf {} +
	find . -type d -name .ruff_cache -prune -exec rm -rf {} +
