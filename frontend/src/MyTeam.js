// src/components/MyTeam.js
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SmartSuggestions from './SmartSuggestions';
import PlayerCard from './PlayerCard';
import './MyTeam.css';

const formations = {
  '4-4-2': { Goalkeeper: 1, Defender: 4, Midfielder: 4, Forward: 2 },
  '4-3-3': { Goalkeeper: 1, Defender: 4, Midfielder: 3, Forward: 3 },
  '3-5-2': { Goalkeeper: 1, Defender: 3, Midfielder: 5, Forward: 2 },
  '4-5-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Forward: 1 },
  '3-4-3': { Goalkeeper: 1, Defender: 3, Midfielder: 4, Forward: 3 },
  '4-2-3-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Forward: 1 },
  '5-3-2': { Goalkeeper: 1, Defender: 5, Midfielder: 3, Forward: 2 },
  '4-3-2-1': { Goalkeeper: 1, Defender: 4, Midfielder: 5, Forward: 1 },
  '3-6-1': { Goalkeeper: 1, Defender: 3, Midfielder: 6, Forward: 1 }
};

const teamLogos = {
  "Arsenal": "57", "Aston Villa": "58", "Bournemouth": "1044", "Brentford": "402",
  "Brighton": "397", "Burnley": "328", "Chelsea": "61", "Crystal Palace": "354",
  "Everton": "62", "Fulham": "63", "Leeds": "341", "Liverpool": "64", "Man City": "65",
  "Man Utd": "66", "Newcastle": "67", "Nott'm Forest": "351", "Spurs": "73",
  "West Ham": "563", "Wolves": "76"
};

const MAX_BUDGET = 40;
const MAX_PLAYERS = 11;

function MyTeam() {
  const [playersByTeam, setPlayersByTeam] = useState({});
  const [formation, setFormation] = useState('4-4-2');
  const [myTeam, setMyTeam] = useState({ Goalkeeper: [], Defender: [], Midfielder: [], Forward: [] });
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [budgetUsed, setBudgetUsed] = useState(0);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('http://localhost:3001/players')
      .then(res => res.json())
      .then(data => {
        const grouped = {};
        data.forEach(player => {
          const team = player.team_name || 'Unknown';
          if (!grouped[team]) grouped[team] = [];
          grouped[team].push(player);
        });
        setPlayersByTeam(grouped);
      });

    // Fetch saved team from backend
    if (token) {
      fetch('http://localhost:3001/my-team', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.team) {
            setMyTeam(data.team);
            setFormation(data.formation || '4-4-2');
            setSelectedLogo(data.logo || null);
            setBudgetUsed(calculateBudget(data.team));
          }
        })
        .catch(err => console.error("Failed to load team:", err));
    }
  }, []);

  const saveTeamToBackend = (team, logo = selectedLogo, formationVal = formation) => {
    if (!token) return;
    fetch('http://localhost:3001/my-team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ team, logo, formation: formationVal })
    }).catch(err => console.error("Failed to save team:", err));
  };

  const calculateBudget = (team) => {
    return Object.values(team).flat().reduce((sum, p) => sum + (p.dynamic_price || p.now_cost || 0), 0);
  };

  const removePlayer = (id) => {
    const updated = { ...myTeam };
    for (const pos in updated) {
      updated[pos] = updated[pos].filter(p => p.id !== id);
    }
    setMyTeam(updated);
    setBudgetUsed(calculateBudget(updated));
    saveTeamToBackend(updated);
  };

  const clearTeam = () => {
    const cleared = { Goalkeeper: [], Defender: [], Midfielder: [], Forward: [] };
    setMyTeam(cleared);
    setBudgetUsed(0);
    setSelectedLogo(null);
    saveTeamToBackend(cleared, null);
  };

  const handleLogoSelect = (logoId) => {
    setSelectedLogo(logoId);
    saveTeamToBackend(myTeam, logoId);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    let draggedPlayer;

    if (sourceId.startsWith('team-')) {
      const team = sourceId.replace('team-', '');
      draggedPlayer = playersByTeam[team][source.index];
    } else {
      draggedPlayer = myTeam[sourceId][source.index];
      const updatedSource = [...myTeam[sourceId]];
      updatedSource.splice(source.index, 1);
      myTeam[sourceId] = updatedSource;
    }

    if (!draggedPlayer || !(destId in myTeam)) return;
    if (draggedPlayer.position !== destId) return;

    const totalPlayers = Object.values(myTeam).flat().length;
    if (totalPlayers >= MAX_PLAYERS) return;

    const destList = [...myTeam[destId]];
    if (destList.length >= formations[formation][destId]) return;

    const budgetRemaining = MAX_BUDGET - calculateBudget(myTeam);
    const cost = draggedPlayer.dynamic_price || draggedPlayer.now_cost || 0;
    if (budgetRemaining < cost) return;

    destList.splice(destination.index, 0, draggedPlayer);
    const newTeam = { ...myTeam, [destId]: destList };

    setMyTeam(newTeam);
    setBudgetUsed(calculateBudget(newTeam));
    saveTeamToBackend(newTeam);
  };

  const totalPoints = Object.values(myTeam).flat().reduce((sum, p) => sum + (p.total_points || 0), 0);

  const positionIcons = {
    Goalkeeper: '🧤',
    Defender: '🛡️',
    Midfielder: '🎯',
    Forward: '⚽'
  };

  return (
    <div className="my-team-container">
      <h2>🏟️ My Fantasy Stadium</h2>
      <div className="myteam-summary">
        <p>💰 Budget Used: £{budgetUsed.toFixed(1)}m / £{MAX_BUDGET}m</p>
        <p>📈 Total Points: {totalPoints}</p>
        <label>
          Formation:
          <select
            value={formation}
            onChange={(e) => {
              setFormation(e.target.value);
              saveTeamToBackend(myTeam, selectedLogo, e.target.value);
            }}
          >
            {Object.keys(formations).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <button onClick={clearTeam} className="remove-btn">🧹 Clear Team</button>
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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="pitch">
          {Object.entries(formations[formation]).map(([position, count]) => (
            <Droppable key={position} droppableId={position} direction="horizontal">
              {(provided) => (
                <div className="pitch-row" ref={provided.innerRef} {...provided.droppableProps}>
                  {[...Array(count)].map((_, idx) => {
                    const player = myTeam[position]?.[idx];
                    return (
                      <div key={idx} className="player-slot">
                        {player ? (
                          <Draggable draggableId={player.id.toString()} index={idx} key={player.id.toString()}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                <PlayerCard player={player} showAdd={false} />
                                <button onClick={() => removePlayer(player.id)} className="remove-btn">❌</button>
                              </div>
                            )}
                          </Draggable>
                        ) : <span>{positionIcons[position] || position}</span>}
                      </div>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}

          {Object.entries(playersByTeam).map(([teamName, teamPlayers]) => (
            <Droppable droppableId={`team-${teamName}`} key={teamName}>
              {(provided) => (
                <div className="player-pool" ref={provided.innerRef} {...provided.droppableProps}>
                  <h4>
                    <img
                      src={`https://crests.football-data.org/${teamLogos[teamName] || '57'}.svg`}
                      alt={teamName}
                      style={{ width: '20px', marginRight: '8px', verticalAlign: 'middle' }}
                    />
                    {teamName}
                  </h4>
                  {teamPlayers.map((p, index) => (
                    <Draggable key={p.id.toString()} draggableId={p.id.toString()} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <PlayerCard player={p} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <SmartSuggestions />
    </div>
  );
}

export default MyTeam;
