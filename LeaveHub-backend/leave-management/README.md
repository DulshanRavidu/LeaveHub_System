# LeaveHub Backend

Production-ready backend for the LeaveHub leave management system.

## Stack
- Go
- Gin
- GORM
- PostgreSQL
- JWT (HMAC)

## Key Features
- JWT-based authentication with role-aware access control.
- Employee self-registration and sign-in.
- Leave request lifecycle:
   - Create leave request (employee)
   - View own leave requests (employee)
   - Approve or reject requests (manager/admin)
- Dashboard metrics for management and employee views.
- Employee management (manager/admin):
   - Create employee
   - Update employee
   - Delete employee
- Strong business rules added:
   - `@company.com` is reserved for management usage.
   - Employee role cannot use `@company.com` email.
   - HR users must be manager or admin.
   - Employee edit/delete is restricted to manager/admin users who also have `@company.com` email.
- Startup maintenance:
   - Removes seeded/legacy `Kusal Perera` user record if present.
   - Ensures default manager account exists.

## Project Structure
- `main.go`: application entrypoint.
- `internal/config`: environment/config loading.
- `internal/database`: DB connection, migration, seeding.
- `internal/handlers`: route handlers.
- `internal/middleware`: auth and RBAC middleware.
- `internal/models`: GORM models.
- `internal/router`: route registration.

## Prerequisites
- Go 1.26+
- PostgreSQL 14+

## Environment Setup
1. Copy environment template:
```powershell
copy .env.example .env
```
2. Update `.env` values as needed.

Default `.env.example`:
```env
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/leavehub?sslmode=disable
JWT_SECRET=replace-with-strong-secret
DEFAULT_MANAGER_EMAIL=dulshan001@company.com
DEFAULT_MANAGER_PASSWORD=Manager@123
DEFAULT_MANAGER_NAME=Default Manager
```

## Run Locally
From backend folder (`LeaveHub-backend/leave-management`):

```powershell
go mod download
go run main.go
```

Server starts on:
- `http://localhost:8080`

Health check:
- `GET /api/health`

## Database Implementation

### Database Engine
- PostgreSQL is used as the primary relational database.
- GORM is used for ORM mapping, schema migration (`AutoMigrate`), and data access.

### Connection Configuration
Database connection is controlled by `DATABASE_URL` in `.env`.

Example:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/leavehub?sslmode=disable
```

### Schema Sources
- SQL baseline migration: `migrations/001_initial_schema.sql`
- Runtime schema sync: `internal/database/postgres.go` (via GORM `AutoMigrate`)
- Models:
   - `internal/models/user.go`
   - `internal/models/leave_request.go`

### Core Tables
- `users`
   - Stores employee and management accounts.
   - Important fields: `id`, `name`, `email`, `password`, `department`, `role`, timestamps.
- `leave_requests`
   - Stores leave lifecycle records.
   - Important fields: `id`, `employee_id`, `start_date`, `end_date`, `reason`, `status`, timestamps.
   - Linked to `users` through `employee_id`.

### Startup Migration and Seed Flow
On application startup:
1. Connect to PostgreSQL.
2. Run `AutoMigrate` for model-aligned schema updates.
3. Run seed logic from `internal/database/seed.go`:
    - Ensures default manager account exists.
    - Removes legacy `Kusal Perera` record if present.

### Deletion Behavior
- Employee deletion uses a database transaction.
- Related leave records for the employee are deleted before deleting the user to maintain data consistency.

### Manual Migration (Optional)
If you want to apply baseline SQL manually before app startup:

```powershell
psql "postgres://postgres:postgres@localhost:5432/leavehub?sslmode=disable" -f migrations/001_initial_schema.sql
```

### Quick Verification Queries
```sql
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_leave_requests FROM leave_requests;
SELECT id, name, email, role FROM users ORDER BY id DESC LIMIT 10;
```

## API Access Model
- Public:
   - `POST /api/auth/signup`
   - `POST /api/auth/signin`
   - `GET /api/health`
- Authenticated:
   - `GET /api/me`
   - `GET /api/dashboard/overview`
- Employee:
   - `POST /api/leaves`
   - `GET /api/leaves/my`
- Manager/Admin:
   - `GET /api/employees`
   - `POST /api/employees`
   - `PUT /api/employees/:id`
   - `DELETE /api/employees/:id`
   - `GET /api/leaves`
   - `PATCH /api/leaves/:id/approve`
   - `PATCH /api/leaves/:id/reject`

## Authentication Flow
1. Sign up (`/api/auth/signup`) or sign in (`/api/auth/signin`).
2. Receive JWT token.
3. Pass token in `Authorization` header:
    - `Bearer <token>`

## API Response Format (Best Practice)
All endpoints follow a consistent JSON envelope:

Success:
```json
{
   "status": "success",
   "message": "Operation completed",
   "data": {}
}
```

Error:
```json
{
   "status": "error",
   "message": "Validation failed"
}
```

## Notes for Team
- If route changes do not appear (for example, a new endpoint returning 404), restart the backend process from the correct directory.
- This service uses `AutoMigrate`, so schema can evolve from model changes on startup.
