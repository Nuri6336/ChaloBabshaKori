# ChaloBabshaKori.com (চলো ব্যবসা করি)

Business management platform for small and medium businesses in Bangladesh: products & stock, sales, purchases,
customers & suppliers, expenses, dashboard and reports. Bangla (default) and English UI, amounts in BDT (৳).

Product brief: [ChaloBabshaKori.txt](ChaloBabshaKori.txt) · Landing page design: [chalobabshakori.png](chalobabshakori.png)

## Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Frontend       | Next.js 15 (App Router), React 19, TypeScript           |
| Backend        | Java 17, Spring Boot 3.5 (modular monolith)             |
| Database       | PostgreSQL 16, schema managed by Flyway                 |
| Auth           | Spring Security + JWT (stateless)                       |
| API docs       | OpenAPI / Swagger UI                                    |
| Deployment     | Docker Compose                                          |

## MVP scope (from the brief)

- Business registration and login (each business is an isolated workspace)
- Product & inventory management (SKU/barcode, low-stock alerts, manual stock adjustment)
- Customers & suppliers with outstanding dues
- Sales and purchases (stock updates automatically), partial payments, delete with stock rollback
- Expenses
- Dashboard and reports (sales trend, gross/net profit, receivables/payables, stock summary, expenses by category)
- Printable sales invoice
- Landing page demo video (`frontend/public/videos/demo.webm`, opened by the "ভিডিও দেখুন" button)

## Run with Docker

```bash
cp .env.example .env     # then edit JWT_SECRET / DB_PASSWORD
docker compose up --build
```

- App: http://localhost:3000
- API: http://localhost:8080 · Swagger UI: http://localhost:8080/swagger-ui.html

## Run for development

Requires JDK 17, Node 20+ and a PostgreSQL database (`docker compose up db` provides one).

```bash
# backend (http://localhost:8080)
cd backend
./mvnw spring-boot:run          # DB_URL / DB_USER / DB_PASSWORD / JWT_SECRET override the defaults

# frontend (http://localhost:3000) - proxies /api/* to the backend
cd frontend
npm install
npm run dev                     # set BACKEND_URL if the API is not on localhost:8080
```

Tests (H2 in PostgreSQL mode, no database needed): `cd backend && ./mvnw test`

## Project layout

```
backend/   Spring Boot API   (config, security, domain, repo, service, web)
frontend/  Next.js app       (src/app: landing, auth, (app)/ authenticated screens)
```

## API overview

All endpoints except `/api/auth/register` and `/api/auth/login` need `Authorization: Bearer <token>`.
Every query is scoped to the business in the token.

| Area      | Endpoints                                                                                   |
| --------- | ------------------------------------------------------------------------------------------- |
| Auth      | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`                       |
| Products  | `/api/products` CRUD, `POST /api/products/{id}/adjust-stock`                                |
| Parties   | `/api/customers`, `/api/suppliers` CRUD (balance = receivable / payable)                    |
| Sales     | `/api/sales` (list, create, get, delete), `POST /api/sales/{id}/payments`                   |
| Purchases | `/api/purchases` (list, create, get, delete), `POST /api/purchases/{id}/payments`           |
| Expenses  | `/api/expenses` CRUD                                                                        |
| Reports   | `/api/dashboard`, `/api/reports/{summary,daily-sales,expenses-by-category,stock}`           |

## Notes and next steps

- Set a strong `JWT_SECRET` in production. The token is kept in `localStorage` for the MVP; move to an HttpOnly
  cookie if you need stricter XSS protection.
- The landing hero uses a CSS illustration; drop a real photo into `frontend/public/` and reference it from
  `.hero-visual` in `globals.css` to match the design mock-up exactly.
- Role-based permissions (OWNER/MANAGER/STAFF exist in the model), multi-branch, payroll, online payments and
  notifications are later-release items from the brief.
