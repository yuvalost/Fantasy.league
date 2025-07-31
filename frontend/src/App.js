// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Players from './Players';
import PlayerDetail from './PlayerDetail';
import Fixtures from './Fixtures';
import MyTeam from './MyTeam';
import NewsFeed from './NewsFeed';
import TransferTicker from './TransferTicker';
import AuthPage from './AuthPage';
import { useAuth } from './AuthContext';
import './App.css';

const teamLogos = {
  "Arsenal": "57", "Aston Villa": "58", "Bournemouth": "1044", "Brentford": "402",
  "Brighton": "397", "Burnley": "328", "Chelsea": "61", "Crystal Palace": "354",
  "Everton": "62", "Fulham": "63", "Leeds": "341", "Liverpool": "64", "Man City": "65",
  "Man Utd": "66", "Newcastle": "67", "Nott'm Forest": "351", "Spurs": "73",
  "West Ham": "563", "Wolves": "76"
};

function Navigation({ toggleTheme, theme }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>🏠 Home</Link>
      <Link to="/players" className={`nav-link ${location.pathname.startsWith('/players') ? 'active' : ''}`}>🏟️ Teams</Link>
      <Link to="/fixtures" className={`nav-link ${location.pathname === '/fixtures' ? 'active' : ''}`}>📅 Fixtures</Link>
      <Link to="/my-team" className={`nav-link ${location.pathname === '/my-team' ? 'active' : ''}`}>⭐ My Team</Link>
      {user ? (
        <span className="auth-controls">👤 {user} <button onClick={logout}>Logout</button></span>
      ) : (
        <Link to="/auth" className="nav-link">🔐 Login / Register</Link>
      )}
      <button onClick={toggleTheme} className="toggle-btn">
        {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
      </button>
    </nav>
  );
}

function Home() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3000/teams')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch teams');
        return res.json();
      })
      .then(data => {
        setTeams(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="status-msg">Loading teams...</p>;
  if (error) return <p className="status-msg error">Error: {error}</p>;

  const handleTeamClick = (team) => {
    navigate(`/players?team=${encodeURIComponent(team.name)}`);
  };

  return (
    <div className="container">
      <h1 className="title">⚽ Welcome to Fantasy Premier League</h1>
      <TransferTicker />
      <p style={{ textAlign: 'center', marginBottom: '20px' }}>
        Get the latest Premier League news and updates!
      </p>
      <NewsFeed />
      <h2 style={{ textAlign: 'center', marginTop: '40px' }}>Choose a Team</h2>
      <div className="team-grid">
        {teams.map(team => {
          const logoId = teamLogos[team.name];
          const logoUrl = logoId ? `https://crests.football-data.org/${logoId}.svg` : null;

          return (
            <div
              key={team.team_id}
              className="team-card"
              onClick={() => handleTeamClick(team)}
              style={{ cursor: 'pointer' }}
            >
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={`${team.name} logo`}
                  className="team-logo"
                  style={{ width: '40px', height: '40px', marginBottom: '8px' }}
                />
              )}
              <span className="team-name">{team.name}</span>
              <span className="team-code">({team.short_code})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const { token } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <>
      <Navigation toggleTheme={toggleTheme} theme={theme} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<Players />} />
        <Route path="/player/:id" element={<PlayerDetail />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/my-team" element={token ? <MyTeam /> : <Navigate to="/auth" />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </>
  );
}

export default App;
