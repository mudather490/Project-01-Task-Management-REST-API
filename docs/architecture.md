# System Architecture

## ER Diagram (Users ↔ Tasks)

```mermaid
erDiagram
    USERS {
        int id PK
        string email UK "unique, indexed"
        string hashed_password
        string language "en|ar, default en"
        datetime created_at
        datetime updated_at
    }
    TASKS {
        int id PK
        int user_id FK "index, ondelete cascade"
        string title "1-200, trimmed"
        text description "optional, <=5000"
        string status "todo|in_progress|done, default todo"
        string priority "low|medium|high, default medium"
        date due_date "optional, past allowed"
        datetime created_at
        datetime updated_at
    }
    USERS ||--o{ TASKS : "owns"
```

## Relationship Notes

- **One-to-Many**: One `User` owns many `Task`s. Each `Task` has exactly one `User`.
- **Foreign Key**: `tasks.user_id → users.id` with `ON DELETE CASCADE` — deleting a user deletes their tasks (no orphaned tasks).
- **Unique**: `users.email` is unique and normalized to lowercase.
- **Derived data**: `is_overdue` is **never stored** — computed on read as `due_date < today AND status != done`.
- **Enum columns**: stored as `String` with application-level strict validation (`pattern` regex), portable between SQLite and Postgres.

## Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant F as FastAPI
    participant D as get_current_user
    participant DB as Supabase Postgres / SQLite
    activate F

    C->>F: POST /api/auth/login {email, password}
    F->>DB: SELECT user WHERE email = normalized_email
    F->>F: verify_password(plain, bcrypt_hash)
    F-->>C: {access_token}  (JWT {sub: user_id, exp})

    C->>F: POST /api/tasks + Bearer token
    F->>D: decode_token → user_id (sub)
    D->>DB: SELECT user WHERE id = sub → current_user
    F->>DB: INSERT task WHERE user_id = current_user.id
    F-->>C: 201 TaskRead
    deactivate F
```

## Design Decisions (D1–D11)

| # | Decision | Reason |
|---|---|---|
| D1 | `status` and `priority` as strict enums | Prevent corrupt values like `"finished"`; ensures filter correctness |
| D2 | `priority` is ordered (`low < medium < high`) | Used in sorting, not free text |
| D3 | Defaults `todo` + `medium` | Lowers friction for daily use |
| D4 | `due_date` = `Date` only | Avoids Timezone complexity in MVP; upgrade path clear |
| D5 | Past `due_date` allowed | Useful for backlog; overdue handled by filter, not a create-time gate |
| D6 | `is_overdue` never stored | Derived data must not fight stored state |
| D7 | Every task query scoped by `user_id` from token | Data isolation is a security boundary |
| D8 | Passwords bcrypt-hashed only | Even a DB leak cannot recover plain passwords |
| D9 | `users.language` + translation at presentation edge | Bilingual without duplicate columns in tasks |
| D10 | SQLite (dev) → Supabase Postgres (prod) via `DATABASE_URL` | Fast local iteration + durable production storage |
| D11 | Hard delete in MVP | Soft delete deferred to a later upgrade exercise |
| D12 | One Vercel project (Services): `/` → Next.js, `/api/*` → FastAPI | Single domain + single deployment; browser calls same-origin `/api`, no `NEXT_PUBLIC_API_URL` or browser CORS |

## Deployment Diagram

```mermaid
flowchart LR
    subgraph Client
        U[User / Browser / Mobile]
    end
    subgraph Vercel ["One Vercel Project (Services)"]
        W[Next.js — frontend/]
        F[FastAPI — backend/app.main:app]
    end
    subgraph Supabase
        DB[(Postgres<br/>managed, encrypted)]
    end
    U --HTTPS--> W
    U --HTTPS /api/*--> F
    F --TLS--> DB
    F -->|JWT verify| F
```

### Why serverless + Supabase?

- **Vercel Functions** have ephemeral filesystem — SQLite files disappear between invocations ("hotel room" problem).
- **Supabase Postgres** persists data on managed storage with encryption and connection pooling.
- Switching environments = changing `DATABASE_URL` only (SQLAlchemy abstracts the driver; psycopg 3 handles `postgresql://` → `postgresql+psycopg://`).

## API Surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check |
| POST | `/api/auth/register` | Create user |
| POST | `/api/auth/login` | Issue JWT |
| GET | `/api/users/me` | Profile |
| PATCH | `/api/users/me` | Update language |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks` | List + filters |
| GET | `/api/tasks/counts` | Sidebar counters |
| GET | `/api/tasks/today` | Today queue |
| GET | `/api/tasks/{id}` | Detail |
| PATCH | `/api/tasks/{id}` | Partial update |
| DELETE | `/api/tasks/{id}` | Delete |
| GET | `/api/docs` | FastAPI Swagger UI |
