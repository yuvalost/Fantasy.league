import React, { useState, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import './MyTeam.css';

const formations = {
  '4-4-2': { Goalkeeper: 1, Defender: 4, Midfielder: 4, Forward: 2 },
  '4-3-3': { Goalkeeper: 1, Defender: 4, Midfielder: 3, Forward: 3 },
  '3-5-2': { Goalkeeper: 1, Defender: 3, Midfielder: 5, Forward: 2 },
  '5-3-2': { Goalkeeper: 1, Defender: 5, Midfielder: 3, Forward: 2 },
  '4-2-3-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Forward: 1 },
  '3-4-3': { Goalkeeper: 1, Defender: 3, Midfielder: 4, Forward: 3 },
  '4-5-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Forward: 1 },
  '5-4-1': { Goalkeeper: 1, Defender: 5, Midfielder: 4, Forward: 1 },
  '4-1-4-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Forward: 1 },
  '4-3-2-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Forward: 1 },
  '3-6-1': { Goalkeeper: 1, Defender: 3, Midfielder: 6, Forward: 1 },
  '4-2-2-2': { Goalkeeper: 1, Defender: 4, Midfielder: 4, Forward: 2 },
  '4-4-1-1': { Goalkeeper: 1, Defender: 4, Midfielder: 4, Forward: 2 },
  '3-4-1-2': { Goalkeeper: 1, Defender: 3, Midfielder: 5, Forward: 2 },
  '3-1-4-2': { Goalkeeper: 1, Defender: 3, Midfielder: 5, Forward: 2 },
  '4-3-1-2': { Goalkeeper: 1, Defender: 4, Midfielder: 4, Forward: 2 },
  '4-1-3-2': { Goalkeeper: 1, Defender: 4, Midfielder: 4, Forward: 2 },
  '4-3-3 False 9': { Goalkeeper: 1, Defender: 4, Midfielder: 3, Forward: 3 },
  '3-2-4-1': { Goalkeeper: 1, Defender: 3, Midfielder: 6, Forward: 1 },
  '3-2-3-2': { Goalkeeper: 1, Defender: 3, Midfielder: 5, Forward: 2 },
  '2-3-5': { Goalkeeper: 1, Defender: 2, Midfielder: 3, Forward: 5 },
  '3-2-5': { Goalkeeper: 1, Defender: 3, Midfielder: 2, Forward: 5 },
  '4-2-4': { Goalkeeper: 1, Defender: 4, Midfielder: 2, Forward: 4 },
  '5-2-3': { Goalkeeper: 1, Defender: 5, Midfielder: 2, Forward: 3 },
  '3-5-1-1': { Goalkeeper: 1, Defender: 3, Midfielder: 5, Forward: 2 },
  '3-3-3-1': { Goalkeeper: 1, Defender: 3, Midfielder: 6, Forward: 1 },
  '3-3-1-3': { Goalkeeper: 1, Defender: 3, Midfielder: 4, Forward: 3 }
};

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

function MyTeam() {
  const [myTeam, setMyTeam] = useState([]);
  const [formation, setFormation] = useState('4-4-2');
  const [selectedLogo, setSelectedLogo] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('myTeam') || '[]');
    const logo = localStorage.getItem('selectedLogo');
    setMyTeam(stored);
    if (logo) setSelectedLogo(logo);
  }, []);

  const removePlayer = (id) => {
    const updated = myTeam.filter(p => p.id !== id);
    localStorage.setItem('myTeam', JSON.stringify(updated));
    setMyTeam(updated);
  };

  const clearTeam = () => {
    localStorage.removeItem('myTeam');
    setMyTeam([]);
  };

  const handleLogoSelect = (logoId) => {
    setSelectedLogo(logoId);
    localStorage.setItem('selectedLogo', logoId);
  };

  const grouped = myTeam.reduce((acc, p) => {
    const pos = p.position;
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(p);
    return acc;
  }, {});

  const totalCost = myTeam.reduce((sum, p) => sum + (p.now_cost || 0) / 10, 0).toFixed(1);
  const totalPoints = myTeam.reduce((sum, p) => sum + (p.total_points || 0), 0);

  return (
    <div className="my-team-container">
      <h2>My Fantasy Team</h2>

      <div className="my-team-summary">
        <p>💰 Total Cost: £{totalCost}m</p>
        <p>📈 Total Points: {totalPoints}</p>
        <label>
          Formation:
          <select
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            style={{ marginLeft: '10px' }}
          >
            {Object.keys(formations).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <br />
        <button onClick={clearTeam} className="remove-btn" style={{ marginTop: '10px' }}>
          🧹 Clear Team
        </button>
        <div className="logo-selector">
          <p>Pick Your Team Logo:</p>
          <div className="logos-row">
            {Object.entries(teamLogos).map(([team, id]) => (
              <img
                key={team}
                src={`https://crests.football-data.org/${id}.svg`}
                alt={team}
                className={`logo-option ${selectedLogo === id ? 'selected' : ''}`}
                onClick={() => handleLogoSelect(id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="pitch">
        {Object.entries(formations[formation]).map(([position, count]) => (
          <div key={position} className="pitch-row">
            {[...Array(count)].map((_, idx) => {
              const player = grouped[position]?.[idx];
              return (
                <div key={idx} className="player-slot">
                  {player ? (
                    <>
                      <img
                        src={`https://crests.football-data.org/${selectedLogo || teamLogos[player.team_name] || '57'}.svg`}
                        alt="team"
                      />
                      <span>{player.web_name || player.name}</span>
                      <button onClick={() => removePlayer(player.id)} className="remove-btn" style={{ marginTop: '5px' }}>❌</button>
                    </>
                  ) : (
                    <span>{position}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyTeam;
