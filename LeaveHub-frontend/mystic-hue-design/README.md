# LeaveHub Frontend

Modern responsive web frontend for the LeaveHub leave management platform.

## Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- React Query
- Framer Motion

## Key Features
- Role-aware application shell and navigation.
- Login and registration flows.
- Dashboard views for employees and management.
- Employee management module:
	- Add employee
	- Edit employee
	- Delete employee with confirmation modal and toast notifications
- Leave request management:
	- Employee: create and view own requests
	- Manager/Admin: approve and reject requests
- Enhanced validation and access-aware UX:
	- Employee actions are shown only to eligible roles.
	- Delete flow uses in-app confirmation dialog instead of browser prompt.
- Responsive behavior for both mobile and desktop:
	- Improved card/button stacking on small screens
	- Scroll-safe table layout for narrow devices
	- Mobile-friendly auth pages and forms

## Prerequisites
- Node.js 20+
- npm 10+

## Environment Configuration
Frontend reads API base URL from:
- `VITE_API_BASE_URL`

Default behavior:
- If not set, client calls `/api`
- Vite dev server proxies `/api` to backend `http://localhost:8080`

Optional `.env` example:
```env
VITE_API_BASE_URL=/api
```

## Run Locally
From frontend folder (`LeaveHub-frontend/mystic-hue-design`):

1. Install dependencies:
```powershell
npm install
```

2. Start dev server:
```powershell
npm run dev
```

3. Open:
- `http://localhost:5173`

## Build and Preview
Build production bundle:
```powershell
npm run build
```

Preview production build:
```powershell
npm run preview
```

## Quality Commands
- Lint:
```powershell
npm run lint
```
- Test:
```powershell
npm run test
```

## Backend Integration
Expected backend URL:
- `http://localhost:8080`

Important:
- Backend must be running for login, employee operations, leave requests, approvals, and dashboard data.

## API Contract (Response Envelope)
Frontend is compatible with standardized backend responses in this format:

```json
{
	"status": "success",
	"message": "Employees fetched successfully",
	"data": []
}
```

Error shape:

```json
{
	"status": "error",
	"message": "Unauthorized"
}
```

Notes:
- Frontend API client unwraps `data` automatically for normal component usage.
- Backward compatibility is preserved for older non-enveloped payloads.
