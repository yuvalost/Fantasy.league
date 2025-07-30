// PlayerCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerCard.css';

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
  "West Ham": "563",
  "Wolves": "76"
};

const PlayerCard = ({ player, showAdd = true }) => {
  const navigate = useNavigate();

  const addToMyTeam = () => {
    const current = JSON.parse(localStorage.getItem('myTeam') || '[]');
    if (!current.find(p => p.id === player.id)) {
      current.push(player);
      localStorage.setItem('myTeam', JSON.stringify(current));
      alert(`${player.name || player.web_name} added to My Team!`);
    }
  };

  const logoId = teamLogos[player.team_name];

  return (
    <div className="player-card" onClick={() => navigate(`/player/${player.id}`)}>
      {logoId && (
        <img
          src={`https://crests.football-data.org/${logoId}.svg`}
          alt={player.team_name}
          className="team-logo"
        />
      )}
      <h3>{player.name || player.web_name}</h3>
      <p className="player-position">{player.position}</p>
      <p className="player-points">Points: {player.total_points}</p>
      <p className="player-price">💰 {(player.now_cost / 10).toFixed(1)}m</p>
      {showAdd && (
        <button onClick={(e) => { e.stopPropagation(); addToMyTeam(); }} className="add-btn">
          ➕ Add
        </button>
      )}
    </div>
  );
};

export default PlayerCard;
