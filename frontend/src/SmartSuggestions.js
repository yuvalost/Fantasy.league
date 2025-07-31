import React, { useEffect, useState } from 'react';
import './SmartSuggestions.css';

const mockSuggestions = {
  Goalkeeper: [
    { id: 1, web_name: "Mock GK1", position: "Goalkeeper", dynamic_price: 4.5, ranking: 7.2 },
    { id: 2, web_name: "Mock GK2", position: "Goalkeeper", dynamic_price: 5.0, ranking: 6.9 }
  ],
  Defender: [
    { id: 3, web_name: "Mock DEF1", position: "Defender", dynamic_price: 5.0, ranking: 8.1 },
    { id: 4, web_name: "Mock DEF2", position: "Defender", dynamic_price: 5.5, ranking: 7.7 }
  ],
  Midfielder: [
    { id: 5, web_name: "Mock MID1", position: "Midfielder", dynamic_price: 6.0, ranking: 9.0 },
    { id: 6, web_name: "Mock MID2", position: "Midfielder", dynamic_price: 6.2, ranking: 8.5 }
  ],
  Forward: [
    { id: 7, web_name: "Mock FWD1", position: "Forward", dynamic_price: 6.5, ranking: 8.8 },
    { id: 8, web_name: "Mock FWD2", position: "Forward", dynamic_price: 7.0, ranking: 8.2 }
  ]
};

function SmartSuggestions() {
  const [suggestions, setSuggestions] = useState({
    Goalkeeper: [],
    Defender: [],
    Midfielder: [],
    Forward: []
  });

  useEffect(() => {
    fetch('http://localhost:3001/players')
      .then(res => res.json())
      .then(data => {
        const grouped = {
          Goalkeeper: [],
          Defender: [],
          Midfielder: [],
          Forward: []
        };

        ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].forEach(pos => {
          grouped[pos] = data
            .filter(p => p.position === pos && p.dynamic_price <= 7.5)
            .sort((a, b) => b.ranking - a.ranking || a.dynamic_price - b.dynamic_price)
            .slice(0, 3);
        });

        const allEmpty = Object.values(grouped).every(arr => arr.length === 0);
        setSuggestions(allEmpty ? mockSuggestions : grouped);
      })
      .catch(err => {
        console.warn("⚠️ Failed to load real suggestions:", err.message);
        setSuggestions(mockSuggestions);
      });
  }, []);

  return (
    <div className="smart-banner">
      <div className="ticker-wrapper">
        <div className="ticker">
          {Object.entries(suggestions).map(([position, players]) => (
            <div key={position} className="suggestion-group">
              <strong>{position}:</strong>&nbsp;
              {players.map(player => (
                <span key={player.id} className="suggestion">
                  {player.web_name || player.name} (£{player.dynamic_price?.toFixed(1)}m, ⭐{player.ranking}/10)
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SmartSuggestions;
