# 💸 SplitEase — Smart Expense Sharing with Analytics

A full-stack **Splitwise-style expense sharing app** with advanced statistical analytics, built with an **Apple Liquid Glass UI**.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)

## ✨ Features

### Core
- 👥 **Group Management** — Create & manage expense groups (Trip, Roommates, Project, Custom)
- 💰 **Expense Tracking** — Add expenses with equal, exact, or percentage splits
- 🤝 **Smart Settlements** — Simplified debt algorithm to minimize transactions
- 🔐 **Authentication** — JWT-based login/signup with secure password hashing
- 🔄 **Real-time Updates** — WebSocket-powered live expense notifications

### Analytics Engine
- 📊 **Category Breakdown** — Pie chart of spending by category
- 📈 **Monthly Trends** — Area chart showing spending over time
- 📐 **Simple Linear Regression (SLR)** — Time-series prediction of future expenses
- 📐 **Multiple Linear Regression (MLR)** — Category-based spending prediction with coefficient analysis
- 🔗 **Pearson & Partial Correlation** — Category relationship matrices
- 🧮 **MLE** — Normal, Exponential, and Poisson distribution fitting
- ⚖️ **T-Tests** — Paired (first vs second half) & Independent (category comparison) with bar chart graphs
- 🔍 **Sampling Engine** — 6-filter dynamic filtering (category, date range, member, amount range)

### Export & Validation
- 📤 **CSV Export** — Spreadsheet-compatible multi-user balance columns (INR)
- ✅ **Percentage Validation** — Live progress bar ensuring splits total 100%
- 🤖 **AI Classifier** — Auto-categorize expenses from title keywords

### UI/UX
- 🍎 **Apple Liquid Glass** — Premium dark theme with `backdrop-blur(25px)`, soft shadows, spring animations
- 🎯 **iOS Tactile Feel** — `scale(0.96)` button press, floating action button with idle bob
- 📱 **Responsive** — Works on desktop and mobile

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Python, FastAPI, SQLAlchemy, SQLite |
| **Frontend** | React 19, Vite, Framer Motion, Recharts |
| **Auth** | JWT (python-jose), bcrypt |
| **Statistics** | NumPy, SciPy |
| **Real-time** | WebSockets |

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The backend runs at `http://localhost:8000` and auto-seeds with sample data on first run.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend runs at `http://localhost:5173`.

### Default Login Credentials
| User | Email | Password |
|------|-------|----------|
| Krish | krish@example.com | password123 |
| Arjun | arjun@example.com | password123 |
| Priya | priya@example.com | password123 |
| Neha | neha@example.com | password123 |
| Rahul | rahul@example.com | password123 |
| Sneha | sneha@example.com | password123 |
| Vikram | vikram@example.com | password123 |
| Ananya | ananya@example.com | password123 |

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # Database configuration
│   ├── auth.py              # JWT authentication
│   ├── seed.py              # Sample data seeder
│   ├── routes/
│   │   ├── auth_routes.py   # Login/Signup
│   │   ├── groups.py        # Group CRUD
│   │   ├── expenses.py      # Expense CRUD with split logic
│   │   ├── settlements.py   # Settle up
│   │   ├── analytics.py     # Analytics endpoints
│   │   └── csv_export.py    # CSV export endpoint
│   └── services/
│       ├── analytics_engine.py  # Statistical analysis
│       └── classifier.py       # Expense categorization
├── frontend/
│   ├── src/
│   │   ├── pages/           # React page components
│   │   ├── components/      # Reusable UI components
│   │   ├── api.js           # API client
│   │   ├── auth.jsx         # Auth context
│   │   └── index.css        # Liquid Glass design system
│   └── index.html
└── README.md
```

## 📊 Statistical Methods

| Method | Description |
|--------|-------------|
| **SLR** | Predicts next month's spending from time trend |
| **MLR** | Models total spending as function of category sums |
| **Pearson Correlation** | Measures linear relationship between categories |
| **Partial Correlation** | Category relationships controlling for confounders |
| **MLE** | Fits Normal, Exponential, Poisson to expense amounts |
| **Paired T-Test** | Compares first-half vs second-half monthly spending |
| **Independent T-Test** | Compares mean expense between top 2 categories |

## 📄 License

MIT License
