# ─────────────────────────────────────────────────────────────────────────────
# PulseHR — Makefile
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help dev dev-stop fullstack fullstack-stop prod prod-stop \
        build-prod logs logs-backend logs-frontend \
        migrate seed studio shell-backend shell-db \
        ps clean

# Default target
help:
	@echo ""
	@echo "  PulseHR — available commands"
	@echo ""
	@echo "  ── Local dev (recommended) ────────────────────────────────"
	@echo "  make dev              Start postgres + redis only"
	@echo "  make dev-stop         Stop infra containers"
	@echo ""
	@echo "  ── Full containerized dev ────────────────────────────────"
	@echo "  make fullstack        Start all services with hot reload"
	@echo "  make fullstack-stop   Stop fullstack containers"
	@echo ""
	@echo "  ── Production ───────────────────────────────────────────"
	@echo "  make build-prod       Build production images"
	@echo "  make prod             Start production stack"
	@echo "  make prod-stop        Stop production stack"
	@echo ""
	@echo "  ── Database ─────────────────────────────────────────────"
	@echo "  make migrate          Run pending migrations (prod)"
	@echo "  make seed             Seed demo data (prod)"
	@echo "  make studio           Open Prisma Studio (local backend)"
	@echo ""
	@echo "  ── Utilities ────────────────────────────────────────────"
	@echo "  make logs             Tail all dev infra logs"
	@echo "  make logs-backend     Tail backend logs (fullstack)"
	@echo "  make logs-frontend    Tail frontend logs (fullstack)"
	@echo "  make shell-backend    Shell into backend container (prod)"
	@echo "  make shell-db         psql into postgres container"
	@echo "  make ps               Show running containers"
	@echo "  make clean            Remove volumes + containers (DESTRUCTIVE)"
	@echo ""

# ── Local dev ─────────────────────────────────────────────────────────────────
dev:
	docker compose up -d
	@echo ""
	@echo "  postgres → localhost:5432"
	@echo "  redis    → localhost:6379"
	@echo ""
	@echo "  Now run:"
	@echo "    cd frontend && npm run dev   (port 8080)"
	@echo "    cd backend  && npm run dev   (port 4000)"
	@echo ""

dev-stop:
	docker compose down

# ── Full containerized dev ────────────────────────────────────────────────────
fullstack:
	docker compose -f docker-compose.fullstack.yml up

fullstack-stop:
	docker compose -f docker-compose.fullstack.yml down

# ── Production ────────────────────────────────────────────────────────────────
build-prod:
	docker compose -f docker-compose.prod.yml build --no-cache

prod:
	docker compose -f docker-compose.prod.yml up -d

prod-stop:
	docker compose -f docker-compose.prod.yml down

# ── Logs ──────────────────────────────────────────────────────────────────────
logs:
	docker compose logs -f

logs-backend:
	docker compose -f docker-compose.fullstack.yml logs -f backend

logs-frontend:
	docker compose -f docker-compose.fullstack.yml logs -f frontend

# ── Database ──────────────────────────────────────────────────────────────────
migrate:
	docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

seed:
	docker compose -f docker-compose.prod.yml exec backend npm run db:seed

studio:
	cd backend && npx prisma studio

shell-backend:
	docker compose -f docker-compose.prod.yml exec backend sh

shell-db:
	docker compose up -d postgres
	docker compose exec postgres psql -U $${POSTGRES_USER:-postgres} $${POSTGRES_DB:-pulsehr}

# ── Utilities ─────────────────────────────────────────────────────────────────
ps:
	docker compose ps
	@echo ""
	docker compose -f docker-compose.fullstack.yml ps 2>/dev/null || true
	@echo ""
	docker compose -f docker-compose.prod.yml ps 2>/dev/null || true

clean:
	@echo "WARNING: This will delete all volumes (database data will be lost)."
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ]
	docker compose down -v
	docker compose -f docker-compose.fullstack.yml down -v 2>/dev/null || true
	docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
