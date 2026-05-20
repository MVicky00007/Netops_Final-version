# NetOpsOne — Network Operations Console

A full-stack microservices project: a network-operations management console with role-based dashboards, real-time incident tracking, capacity planning + approvals, health checks, KPIs and a tamper-evident audit log.

> 📖 **Detailed documentation:** [`FRONTEND.md`](FRONTEND.md) · [`BACKEND.md`](BACKEND.md)
> Both files include code snippets, request-flow diagrams, and design rationale.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Angular 18 frontend (port 4200)                                   │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ JWT bearer
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  Spring Cloud Gateway (port 9097)                                  │
└──┬──────────────┬─────────────┬──────────────┬─────────────┬───────┘
   │              │             │              │             │
   ▼              ▼             ▼              ▼             ▼
┌──────┐  ┌─────────────┐  ┌──────────────┐ ┌──────────┐ ┌──────────┐
│ user │  │ site-service│  │  incident-   │ │capacity- │ │   task   │
│ 9101 │  │    9102     │  │   service    │ │ service  │ │  9105    │
└──┬───┘  └──────┬──────┘  │     9103     │ │   9104   │ └────┬─────┘
   │             │         └──────┬───────┘ └────┬─────┘      │
   └──────┬──────┴────────────────┴──────────────┴────────────┘
          │                                  ▲
          ▼                                  │
  ┌───────────────┐              ┌───────────────────┐
  │  MySQL 8      │              │  Eureka Registry  │
  │  netopsone DB │              │  (port 8761)      │
  └───────────────┘              └───────────────────┘
```

| Module | Port | Role |
|---|---|---|
| `discovery-server` | 8761 | Eureka service registry |
| `api-gateway` | 9097 | Spring Cloud Gateway — single entry point |
| `user-service` | 9101 | Auth, JWT, user management |
| `site-service` | 9102 | Sites, edge nodes, interfaces, vendors |
| `incident-service` | 9103 | Fault reports, tickets, SLA, notifications |
| `capacity-service` | 9104 | Capacity plans, records, health checks, KPIs, reports |
| `task-service` | 9105 | Tasks, audit log |
| `common` | (lib) | Shared entities, JPA repos, JWT util, exceptions |

## Tech stack

- **Backend:** Java 21, Spring Boot 3.4.5, Spring Cloud 2024.0.1, Spring Security, Spring Data JPA, JWT (jjwt 0.11.5), Lombok, MySQL 8
- **Frontend:** Angular 18, Angular Material 18, RxJS, TypeScript (strict)
- **Build:** Maven (multi-module), npm
- **Tests:** JUnit 5, Mockito, `@SpringBootTest` with H2

## Prerequisites

- JDK 21
- Node.js 18+ and npm
- MySQL 8 running on `localhost:3306`
- A database named `netopsone` (the services auto-create tables on first start)

## First-time setup

### 1. Database
Create the database:
```sql
CREATE DATABASE netopsone;
```
DB credentials default to `root` / `1234` — change in each service's `application.properties` if yours differ.

### 2. Backend
```bash
cd backend
./mvnw clean install -DskipTests
```

### 3. Frontend
```bash
cd frontend
npm install
```

## Running the stack

### Backend (7 services)

The easiest way — one PowerShell command that opens 7 terminals:
```powershell
cd backend
./start-all.ps1
```

Or use the bundled VS Code launch config:
- Open VS Code → Run & Debug panel (`Ctrl+Shift+D`)
- Pick **"All microservices (full stack)"** → click ▶

Or one terminal per service:
```bash
cd backend
./mvnw -pl discovery-server spring-boot:run     # start Eureka first
./mvnw -pl api-gateway spring-boot:run          # then gateway
./mvnw -pl user-service spring-boot:run         # then the 5 services
./mvnw -pl site-service spring-boot:run
./mvnw -pl incident-service spring-boot:run
./mvnw -pl capacity-service spring-boot:run
./mvnw -pl task-service spring-boot:run
```

### Frontend
```bash
cd frontend
npm start
```
Opens http://localhost:4200 automatically.

### Eureka dashboard
http://localhost:8761 — verify all 6 services + gateway are registered as `UP`.

## Seeding test data

After the services have started at least once (so Hibernate has created the tables), open `backend/seed-data.sql` in MySQL Workbench and run the whole script (`Ctrl+Shift+Enter`). It populates ~70 rows across 17 tables and creates the 5 test users (one per role).

## Test users (password is `secret` for all)

| Role | Email | What they can do |
|---|---|---|
| ADMIN | `alice@test.com` | Everything — full system management |
| MANAGER | `neha@netops.com` | Approve capacity plans, generate reports, manage KPIs |
| NETWORK_ENGINEER | `priya@netops.com` | Report faults, submit plans, record capacity, run health checks |
| FIELD_ENGINEER | `rahul@netops.com` | Field work — update tasks, report faults from the field |
| AUDITOR | `arjun@netops.com` | Read-only review + generate audit reports |

The dashboard, sidebar, and per-row action buttons all adapt automatically to whichever role you sign in as.

## Tests

| Layer | Run |
|---|---|
| Unit tests (Mockito) — **36 tests** | `./mvnw test "-Dtest=UserServiceImplTest,SiteServiceTest,VendorServiceTest,UserMapperTest" "-Dsurefire.failIfNoSpecifiedTests=false"` |
| Integration tests (`@SpringBootTest` + H2) — **8 tests** | `./mvnw test "-Dtest=UserAuthFlowIntegrationTest,SiteCrudIntegrationTest,SiteSecurityIntegrationTest,IncidentTicketIntegrationTest" "-Dsurefire.failIfNoSpecifiedTests=false"` |
| All endpoints smoke test (PowerShell) — **32 endpoints** | `./test-all-endpoints.ps1` |
| RBAC matrix — **192 access-control checks** | `./test-rbac.ps1` |

## Project structure

```
merged/
├── .vscode/                       # IDE launch configs + Java settings
├── backend/
│   ├── pom.xml                    # parent (packaging=pom)
│   ├── common/                    # shared entities, JPA repos, JWT util, exceptions
│   ├── discovery-server/          # Eureka
│   ├── api-gateway/               # Spring Cloud Gateway with CORS + routes
│   ├── user-service/
│   ├── site-service/
│   ├── incident-service/
│   ├── capacity-service/
│   ├── task-service/
│   ├── seed-data.sql              # populates the DB with realistic data
│   ├── start-all.ps1              # spins up all 7 services
│   ├── stop-all.ps1               # kills all java processes
│   ├── test-all-endpoints.ps1     # hits every GET endpoint through gateway
│   └── test-rbac.ps1              # 5 roles × 32 endpoints + anonymous
└── frontend/
    ├── package.json
    ├── angular.json
    └── src/app/
        ├── core/                  # AuthService, interceptors, guards, models
        ├── features/              # one folder per feature page (dashboard, sites, tickets, ...)
        └── shared/                # reusable data-table component
```

## Notable design decisions

**Shared kernel pattern.** All JPA entities + repositories live in `common/` instead of each service owning its own. This was a pragmatic choice: the original monolith had cross-domain `@ManyToOne` relationships (e.g. `IncidentTicket → User`, `FaultReport → Site`). Splitting them into per-service databases would have required rewriting those into Feign client calls. With a shared MySQL, the data layer stays simple while each service still has its own controllers, business services, mappers and DTOs — and each still runs as an independent Spring Boot app.

**Stateless JWT auth.** The same secret is configured in every service's `application.properties`. A token issued by `user-service` is validated locally by any service. No round-trip back to user-service for each request.

**Two-layer authorization.** The Angular sidebar hides pages the current role shouldn't see (UX). The `roleGuard` blocks direct-URL access (defence). The backend further enforces admin-only endpoints via Spring Security's `@PreAuthorize`.

**Gateway preserves endpoints.** The gateway listens on port 9097 — the same port the original monolith used. Every URL path is preserved exactly. Clients see no difference between the old monolith and the new microservices.

## API endpoint catalog (32)

Run `./test-all-endpoints.ps1` for a live check, or see the README's RBAC table for which roles can access which endpoints. The catalog is also encoded as the `$endpoints` array in `backend/test-rbac.ps1`.

---

Built as a microservices reference implementation. Issues and PRs welcome.
