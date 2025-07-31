import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerCard.css';

const teamLogos = {
  "Arsenal": "57", "Aston Villa": "58", "Bournemouth": "1044", "Brentford": "402",
  "Brighton": "397", "Burnley": "328", "Chelsea": "61", "Crystal Palace": "354",
  "Everton": "62", "Fulham": "63", "Leeds": "341", "Liverpool": "64", "Man City": "65",
  "Man Utd": "66", "Newcastle": "67", "Nott'm Forest": "351", "Spurs": "73",
  "West Ham": "563", "Wolves": "76"
};

const formationLimits = {
  Goalkeeper: 1,
  Defender: 4,
  Midfielder: 4,
  Forward: 2
};

const MAX_BUDGET = 40;
const MAX_PLAYERS = 11;

const PlayerCard = ({ player, showAdd = true }) => {
  const navigate = useNavigate();

  const addToMyTeam = () => {
    const myTeamObject = JSON.parse(localStorage.getItem('myTeamObject') || '{}');
    const position = player.position;

    if (!myTeamObject[position]) myTeamObject[position] = [];

    const alreadyInTeam = Object.values(myTeamObject).flat().some(p => p.id === player.id);
    if (alreadyInTeam) {
      alert(`⚠️ ${player.name || player.web_name} is already in your team!`);
      return;
    }

    const totalPlayers = Object.values(myTeamObject).flat().length;
    if (totalPlayers >= MAX_PLAYERS) {
      alert(`❌ Cannot add more than ${MAX_PLAYERS} players.`);
      return;
    }

    const currentBudget = Object.values(myTeamObject)
      .flat()
      .reduce((sum, p) => sum + ((p.dynamic_price ?? p.now_cost ?? 0) || 0), 0);

    const playerCost = (player.dynamic_price ?? player.now_cost ?? 0);
    if ((currentBudget + playerCost) > MAX_BUDGET) {
      alert(`❌ Cannot add player — £${MAX_BUDGET}m budget exceeded!`);
      return;
    }

    const maxAllowed = formationLimits[position];
    if (myTeamObject[position].length >= maxAllowed) {
      alert(`❌ You can only add ${maxAllowed} ${position}(s) in 4-4-2 formation.`);
      return;
    }

    myTeamObject[position].push(player);
    localStorage.setItem('myTeamObject', JSON.stringify(myTeamObject));
    alert(`✅ ${player.name || player.web_name} added to My Team!`);
  };

  const logoId = teamLogos[player.team_name];
  const price = (player.dynamic_price ?? player.now_cost ?? 0);
  const priceColor = price <= 5 ? 'green' : price <= 7.5 ? 'orange' : 'red';

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
      <p className="player-ranking">⭐ {player.ranking?.toFixed(1) ?? 'N/A'} / 10</p>
      <p className={`player-price ${priceColor}`} title="Price based on ranking & stats">
        💰 {price.toFixed(1)}m
      </p>
      {showAdd && (
        <button onClick={(e) => { e.stopPropagation(); addToMyTeam(); }} className="add-btn">
          ➕ Add
        </button>
      )}
    </div>
  );
};

export default PlayerCard;
