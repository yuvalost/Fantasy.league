### 🎯 Fantasy Premier League (FPL) Web App  
Created by Yuval Ostrowsky (@yuvalost)

This is a full-stack Fantasy Premier League web app that lets users build their dream team, track player stats, view fixtures, and follow the Premier League season interactively. Built with React, Node.js, PostgreSQL (preferred) or MySQL, and Express.

🧠 What This Website Does  
🌍 Choose a Premier League team and view its players  
🧩 View detailed player stats and recent gameweek performance  
📅 Explore upcoming fixtures with color-coded design  
🧠 Build your own fantasy team in the "My Team" tab  
📈 Visualize player performance with charts (goals, xG, points)  
🔐 (Coming soon) Save your team with user login  
🤖 (Coming soon) AI-driven suggestions for top picks  

🔧 Tech Stack  
Frontend: React, React Router DOM, CSS  
Backend: Node.js, Express.js  
Database: PostgreSQL (preferred) or MySQL  
Visualization: Recharts / Chart.js  
Authentication (Planned): JWT  
Other: dotenv, nodemon  

🌍 Features (Live & Planned)  
✅ Live Now  
- Team selection and squad viewing  
- Player detail view with gameweek stats  
- Fixtures page with club colors and countdowns  
- My Team selection (static for now)  
- Backend APIs connected to PostgreSQL/MySQL  

🛠️ In Progress / Planned  
- 📅 Fixture planner with filtering and matchup highlights  
- 📊 Stats charts and radar comparisons  
- 🔐 Save “My Team” with login/auth  
- 🏆 Leaderboards, transfer news ticker  
- 🤖 AI-powered pick suggestions  

🗂️ Project Structure  
```
/frontend
├── /components
│   ├── Header.js
│   ├── PlayerCard.js
│   ├── SmartSuggestions.js
│   └── ...
├── /pages
│   ├── Home.js
│   ├── Players.js
│   ├── PlayerDetail.js
│   ├── Fixtures.js
│   └── MyTeam.js
├── App.js
├── index.js
├── AuthContext.js
├── MyTeam.css
└── ...

/backend
├── server.js
├── db.js
├── /routes
│   ├── auth.js
│   ├── players.js
│   ├── teams.js
│   ├── fixtures.js
│   └── stats.js
├── ingestPlayersAndFixtures.js
├── ingestMySQL.js
├── setupTables.js
├── setupTablesmysql.js
├── scheduler.js
└── ...

/database
├── schema.sql
└── ...

.env
README.md
package.json
```

🛠️ Environment Setup  
Create a `.env` file in the `/backend` folder with the following:

For PostgreSQL:
```
DB_DATABASE=fpl_data_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
```

For MySQL:
```
DB_DATABASE=fpl_data_db
DB_USER=root
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=3306
```

📥 Data Ingestion  
Before starting the app, build the database and populate it with data using one of the following scripts:

- For **PostgreSQL**:  
```bash
node ingestPlayersAndFixtures.js
```

- For **MySQL**:  
```bash
node ingestMySQL.js
```

🚀 Getting Started
```bash
# Clone the repo
git clone https://github.com/yuvalost/Fantasy.league
cd Fantasy.league

# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install

# Start backend
cd ../backend
npm start

# Start frontend
cd ../frontend
npm start
```

Frontend runs at: http://localhost:3000  
Backend runs at: http://localhost:5000 or as defined in `.env`
