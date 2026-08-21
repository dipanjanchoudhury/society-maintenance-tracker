# Society Maintenance Tracker

A comprehensive, containerized platform for apartment societies to streamline maintenance request handling, priority triaging, notices management, and automated email updates. Built with a modern, high-performance tech stack.

---

## 🚀 Tech Stack

- **Backend**: FastAPI (Python 3.11) with SQLAlchemy ORM.
- **Frontend**: React (Vite) styled with Tailwind CSS and Lucide Icons.
- **Database**: PostgreSQL 15.
- **Task Queue**: Celery with Redis for asynchronous email processing.
- **Infrastructure**: Multi-container Docker Compose.

---

## 🌟 Key Features

1. **Role-Based Access Control**:
   - **Residents** can register, log in, raise maintenance requests with details and photos, and view progress history.
   - **Admins** can review all complaints, filter by category/status, adjust priority/status, write notes, and post notices.
2. **Recorded Lifecycle History**: Tracks every state transition (Open $\rightarrow$ In Progress $\rightarrow$ Resolved), capturing timestamps, admin comments, and actors.
3. **Smart Overdue Triaging**: Dynamically flags requests exceeding a customizable SLA period and pins them to the top of the admin panel.
4. **Interactive Dashboard**: Metric highlights for Total, Pending, and Overdue issues, plus category analytics graphs.
5. **Notice Board**: Post standard or important announcements. Pinned notices are featured on top and broadcasted to residents.
6. **Async Email Delivery**: Leverages Celery tasks to send status notifications to residents asynchronously.

---

## 🛠️ Getting Started (Docker Compose)

The entire application is orchestrated using Docker Compose. Ensure you have Docker Desktop running on your machine.

### 1. Configure the Environment
Clone the project, copy the environment file, and edit it if necessary:
```bash
cp .env.example .env
```
*(By default, `USE_MOCK_EMAIL=true` is enabled, which outputs email notifications to console logs and writes them to a local file, so you do not need to supply real SMTP credentials to run and evaluate the app).*

### 2. Build and Launch Containers
Run the following command in the root folder of the project:
```bash
docker compose up --build
```

This commands spins up:
- **Database (PostgreSQL)** at `localhost:5432` (persistent storage).
- **Broker (Redis)** at `localhost:6379`.
- **Backend API (FastAPI)** at `http://localhost:8000`.
- **Worker (Celery)** in the background.
- **Frontend (React)** at `http://localhost:5173`.

### 3. Accessing the Application
- **Frontend**: Open `http://localhost:5173` in your browser.
- **API Swagger Docs**: Open `http://localhost:8000/docs` to inspect/test endpoints.
- **Static Assets/Photos**: Uploaded photos are served from `http://localhost:8000/uploads/`.

---

## 👥 Demo Accounts

The database is seeded automatically with system configurations, accounts, and demo complaints:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@society.com` | `admin123` | Can adjust statuses, view metrics, and post notices. |
| **Resident** | `resident@society.com` | `resident123` | Resident (Alice Green, Flat 402) who can raise and check complaints. |

*You can also use the registration page to create new custom accounts with chosen roles.*

---

## 📬 Evaluating Email Notifications

When `USE_MOCK_EMAIL=true` is set:
1. Every time a complaint status is updated or an important notice is posted, the mail content prints to the `celery_worker` container stdout.
2. The raw HTML email is written to `/uploads/email_logs.txt` inside the container.
3. You can inspect this file on your host machine in the local uploads directory or through the backend container.

If you wish to test with a real SMTP client (e.g., Google SMTP):
- Set `USE_MOCK_EMAIL=false` in `.env`.
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`.


---

## ☁️ Production Deployment (Vercel & Render)

This application is ready to be deployed to production using **Render** (for the Backend, Database, and Background Worker) and **Vercel** (for the Frontend).

### 1. Deploy the Backend & Database on Render

We have included a blueprint configuration (`render.yaml`) that configures the entire backend stack with a single click.

1. Go to your **Render Dashboard** -> **Blueprints** -> **New Blueprint Instance**.
2. Select your GitHub repository.
3. Render will automatically detect `render.yaml` and configure:
   - A PostgreSQL Database (`society-db`).
   - A Redis server (`society-redis`).
   - A FastAPI Web Service (`society-backend`).
   - A Celery Worker (`society-worker`).
4. Click **Apply**.
5. Once deployed, copy your backend Web Service URL (e.g. `https://society-backend.onrender.com`).

### 2. Deploy the Frontend on Vercel

We have configured `frontend/vercel.json` to handle React Router client-side page routing.

1. Go to your **Vercel Dashboard** -> **Add New** -> **Project**.
2. Select your GitHub repository.
3. In the project configuration:
   - Set **Framework Preset** to **Vite**.
   - Set **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:
   - Key: `VITE_API_URL`
   - Value: `https://YOUR_RENDER_BACKEND_URL` (replace with the URL from Render).
5. Click **Deploy**. Vercel will build and host your frontend website!

---

## 📊 Database Schema

```
1. users
   ├── id (PK, Serial)
   ├── email (Unique, Index)
   ├── hashed_password
   ├── full_name
   ├── role ("resident" | "admin")
   ├── unit_number (Nullable)
   └── created_at

2. complaints
   ├── id (PK, Serial)
   ├── title
   ├── description
   ├── category
   ├── photo_url (Nullable)
   ├── status ("Open" | "In_Progress" | "Resolved")
   ├── priority ("Low" | "Medium" | "High")
   ├── creator_id (FK -> users.id)
   ├── created_at
   └── updated_at

3. complaint_status_history
   ├── id (PK, Serial)
   ├── complaint_id (FK -> complaints.id, CASCADE)
   ├── status
   ├── priority
   ├── note (Nullable)
   ├── actor_id (FK -> users.id)
   └── created_at

4. notices
   ├── id (PK, Serial)
   ├── title
   ├── content
   ├── is_important (Boolean)
   ├── author_id (FK -> users.id)
   └── created_at

5. system_settings
   ├── id (PK, Serial)
   ├── key (Unique, Index)
   └── value
```

---

## 🔌 API Endpoints Documentation

### Authentication (`/api/auth`)
- `POST /register`: Registers a new account. Expects `UserCreate` JSON body.
- `POST /login`: Log in to receive a JWT access token. Expects standard OAuth2 form payload (`username` and `password`).
- `GET /me`: Fetches info of the authenticated client.

### Complaints (`/api/complaints`)
- `POST /`: Raises a new complaint. Expects `multipart/form-data` with `title`, `description`, `category`, and optional file `photo`. (Resident only).
- `GET /`: Returns complaints queue. Admins see all issues (sorted with overdue first), residents see their own issues. Filters: `category`, `status`, `date_from`, `date_to`.
- `GET /{id}`: Returns detailed complaint schema including its lifecycle history logs.
- `PUT /{id}/status`: Modifies status and priority of a complaint, records a note, and sends email update. (Admin only).
- `GET /dashboard`: Returns statistics (Total, Open, In Progress, Resolved, Overdue count, Category breakdown). (Admin only).

### Notice Board (`/api/notices`)
- `GET /`: Returns notices sorted by pinned (important) notices first.
- `POST /`: Publishes a notice. If marked important, pushes email broadcasts to all residents. (Admin only).

### Configuration (`/api/settings`)
- `GET /`: Lists all configuration key-values. (Admin only).
- `PUT /{key}`: Adjusts system thresholds (e.g., `overdue_threshold_days`). (Admin only).
