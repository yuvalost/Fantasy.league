# ⚽ Fantasy Premier League (FPL) Web App  
Created by **Yuval Ostrowsky (@yuvalost)**

This is a full-stack Fantasy Premier League web app that lets users build their dream team, track player stats, view fixtures, and follow the Premier League season interactively. Built with React, Node.js, PostgreSQL, and Express.

---

## 🧠 What This Website Does

- 🌍 Choose a Premier League team and view its players
- 🧩 View detailed player stats and recent gameweek performance
- 📅 Explore upcoming fixtures with color-coded design
- 🧠 Build your **own fantasy team** in the **"My Team"** tab
- 📈 Visualize player performance with charts (goals, xG, points)
- 🔐 (Coming soon) Save your team with user login
- 🤖 (Coming soon) AI-driven suggestions for top picks

---

## 🔧 Tech Stack

- **Frontend:** React, React Router DOM, CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Visualization:** Recharts / Chart.js
- **Authentication (Planned):** JWT
- **Other:** dotenv, nodemon

---

## 🌍 Features (Live & Planned)

### ✅ Live Now
- Team selection and squad viewing
- Player detail view with gameweek stats
- Fixtures page with club colors and countdowns
- My Team selection (static for now)
- Backend APIs connected to PostgreSQL

### 🛠️ In Progress / Planned
- ✅ Drag & drop team builder
- 💰 Budget tracker (£100m limit)
- 🔍 Player filters (position, team, price, points)
- 📅 Fixture planner with filtering and matchup highlights
- 📊 Stats charts and radar comparisons
- 🔐 Save “My Team” with login/auth
- 🏆 Leaderboards, transfer news ticker
- 🤖 AI-powered pick suggestions

---

## 🗂️ Project Structure

/frontend  
├── /components  
├── App.js  
├── index.js  
└── /pages  
  ├── Home.js  
  ├── Players.js  
  ├── PlayerDetail.js  
  ├── Fixtures.js  
  └── MyTeam.js  

/backend  
├── server.js  
├── /routes  
└── db.js  

/database  
└── schema.sql (optional)

---

## 🛠️ Environment Setup

You need to create a `.env` file in the backend root with the following:

```env
DB_DATABASE=fpl_data_db  
DB_USER=postgres  
DB_PASSWORD=your_password_here  
DB_HOST=localhost  
DB_PORT=5432
```

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/yuvalost/Fantasy.league
cd Fantasy.league

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Start backend
cd ../backend
npm start

# Start frontend
cd ../frontend
npm start
```

Frontend runs at `http://localhost:3000`  
Backend runs at `http://localhost:5000` or as defined in `.env`

---

## 📫 Contact

Created by **Yuval Ostrowsky**  
GitHub: [@yuvalost](https://github.com/yuvalost)  
Email: yuvalostrowsky@gmail.com

> 🛠️ This project is in active development — stay tuned for new features!
