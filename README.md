# FinEdge - Personal Finance & Expense Tracker API

FinEdge is a clean, MVC-structured Node.js + Express REST API for tracking personal finances, expenses, category budgets, and savings targets. It uses local JSON files for persistent data storage and includes JWT-based route security and robust input validation.

---

## 📁 Folder Structure

```text
finedge-api/
│
├── src/
│   ├── app.js                 # Express app configuration & middleware mounting
│   │
│   ├── routes/                # Route definitions mapping endpoints to controllers
│   │   ├── userRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── summaryRoutes.js
│   │   └── budgetRoutes.js
│   │
│   ├── controllers/           # HTTP Request & Response handlers
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   ├── summaryController.js
│   │   └── budgetController.js
│   │
│   ├── services/              # Business logic & file persistence layer
│   │   ├── userService.js
│   │   ├── transactionService.js
│   │   ├── summaryService.js
│   │   └── budgetService.js
│   │
│   ├── middleware/            # Express request interceptors
│   │   ├── logger.js          # Console request logging
│   │   ├── validator.js       # Transaction & budget body validators
│   │   ├── auth.js            # JWT Bearer token authenticator
│   │   └── errorHandler.js    # Global centralized error handler
│   │
│   ├── utils/                 # General helpers and utilities
│   │   ├── customError.js     # Operational AppError class
│   │   └── analytics.js       # Math algorithms for summaries & monthly trends
│   │
│   ├── data/                  # Local JSON data store (Mock Database)
│   │   ├── users.json
│   │   ├── transactions.json
│   │   └── budgets.json
│   │
│   └── tests/                 # Test suites using Jest & Supertest
│       ├── app.test.js
│       ├── user.test.js
│       ├── transaction.test.js
│       ├── summary.test.js
│       ├── budget.test.js
│       └── validator.test.js
│
├── server.js                  # Entry point for starting the HTTP server
├── .env                       # Environment configurations (local, gitignored)
├── .env.example               # Reference template for environment variables
├── package.json               # Manifest file containing scripts and dependencies
└── FinEdge.postman_collection.json # Direct import file for Postman checking
```

---

## 🚀 API Endpoints

### 1. Utilities
* **`GET /health`**: Returns `{ "status": "UP" }` to verify the server is running.

### 2. Users (Protected Profile Management)
* **`POST /users`**: Register a new user. Returns user details and a signed `token`.
* **`PATCH /users/:id`** *(JWT Protected)*: Partially update user name/email. A user can only update their own profile.
* **`DELETE /users/:id`** *(JWT Protected)*: Delete user profile. Automatically cascades to delete all their transaction records.

### 3. Budgets
* **`POST /budgets`**: Set or update a monthly spending budget for a specific category. Overwrites duplicates.

### 4. Transactions
* **`POST /transactions`**: Log a new transaction (checks if `userId` exists).
* **`GET /transactions`**: Get all transactions. Supports optional filters:
  * `type` (`income` or `expense`)
  * `category` (case-insensitive)
  * `month` (e.g. `6`)
  * `year` (e.g. `2026`)
* **`GET /transactions/:id`**: View a single transaction by ID.
* **`PATCH /transactions/:id`**: Partially update transaction fields.
* **`DELETE /transactions/:id`**: Delete a transaction record.

### 5. Summary & Analytics
* **`GET /summary`**: Fetch financial report including:
  * `totalIncome`, `totalExpense`, `balance`, `transactionCount`.
  * Integrated budget comparisons (`totalBudget` and category-wise analysis).
* **`GET /summary/category`**: Returns total expenses grouped by category.
* **`GET /summary/monthly`**: Returns chronological month-on-month trend aggregates.
* **`GET /summary/top-categories`**: Returns top spending categories sorted descending (supports optional `?limit=N` parameter).

---

## 🛠️ Setup & Run instructions

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Configuration
Copy the environment template and configure your values:
```bash
cp .env.example .env
```
*(Ensure `PORT`, `NODE_ENV`, and `JWT_SECRET` are set in `.env`)*

### 3. Run Server
Start in development mode (with auto-reload):
```bash
npm run dev
```
Start in production mode:
```bash
npm start
```

### 4. Run Test Suite
To execute the automated unit and integration tests:
```bash
node node_modules/jest/bin/jest.js --coverage --runInBand
```
*(This will output statements and branch coverage. Target is $>80\%$, currently at **$>90\%$**)*
