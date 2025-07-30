import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PlayerCard from './PlayerCard';
import './Players.css';

const teamLogos = {
  "Arsenal": "57",
  "Aston Villa": "58",
  "Bournemouth": "1044",
  "Brentford": "402",
  "Brighton": "397",
  "Burnley": "328",
  "Chelsea": "61",
  "Crystal Palace": "354",
  "Everton": "62",
  "Fulham": "63",
  "Leeds": "341",
  "Liverpool": "64",
  "Man City": "65",
  "Man Utd": "66",
  "Newcastle": "67",
  "Nott'm Forest": "351",
  "Spurs": "73",
  "Sunderland": null,
  "West Ham": "563",
  "Wolves": "76"
};

function Players() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const teamName = query.get('team');

  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load teams list only when no team is selected
  useEffect(() => {
    if (!teamName) {
      fetch('http://localhost:3000/teams')
        .then(res => res.json())
        .then(data => setTeams(data))
        .catch(err => console.error("Failed to load teams:", err));
    }
  }, [teamName]);

  // Load players for selected team
  useEffect(() => {
    if (!teamName) return;

    setLoading(true);
    fetch(`http://localhost:3000/players?team=${encodeURIComponent(teamName)}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [teamName]);

  if (!teamName) {
    return (
      <div className="players-container">
        <h2>Choose a Team</h2>
        <div className="team-grid">
          {teams.map((team) => {
            const logoId = teamLogos[team.name];
            const logoUrl = logoId ? `https://crests.football-data.org/${logoId}.svg` : null;

            return (
              <div key={team.team_id} className="team-card" onClick={() => navigate(`/players?team=${team.name}`)}>
                {logoUrl && (
                  <img src={logoUrl} alt={`${team.name} logo`} className="team-logo" />
                )}
                <div className="team-name">{team.name}</div>
                <div className="team-code">({team.short_code})</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) return <p>Loading players...</p>;
  if (error) return <p>Error: {error}</p>;

  const groupedByPosition = players.reduce((groups, player) => {
    if (!player || !player.position) return groups;
    if (!groups[player.position]) groups[player.position] = [];
    groups[player.position].push(player);
    return groups;
  }, {});

  return (
    <div className="players-container">
      <button onClick={() => navigate('/players')} className="back-btn">← Back to Teams</button>
      <h2>Players for {teamName}</h2>
      {["Goalkeeper", "Defender", "Midfielder", "Forward"].map(position => (
        groupedByPosition[position] ? (
          <div key={position}>
            <h3>{position}</h3>
            <div className="players-grid">
              {groupedByPosition[position].map(player => (
                player ? (
                  <PlayerCard key={player.id || player.player_id} player={player} />
                ) : null
              ))}
            </div>
          </div>
        ) : null
      ))}
    </div>
  );
}

export default Players;
