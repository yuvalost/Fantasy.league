import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    fetch(`http://localhost:3000/player/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Player not found');
        return res.json();
      })
      .then(data => {
        setPlayer(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) setTheme(storedTheme);
  }, [id]);

  if (loading) return <p>Loading player details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!player) return null;

  const hasStats = player.stats && player.stats.length > 0;

  return (
    <div className="container player-detail-container">
      <button onClick={() => navigate('/')} className="back-btn">← Back to Teams</button>
      <h2>{player.web_name} ({player.team_name})</h2>
      <p><strong>Position:</strong> {player.position}</p>
      <p><strong>Current Price:</strong> £{(player.now_cost / 10).toFixed(1)}m</p>

      <h3>Recent Stats:</h3>
      {!hasStats ? (
        <p>No recent gameweek stats available.</p>
      ) : (
        <>
          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={player.stats.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#555' : '#ccc'} />
              <XAxis dataKey="gameweek" stroke={theme === 'dark' ? '#ccc' : '#333'} />
              <YAxis stroke={theme === 'dark' ? '#ccc' : '#333'} />
              <Tooltip
                contentStyle={{ backgroundColor: theme === 'dark' ? '#222' : '#fff', borderRadius: 6 }}
                labelStyle={{ color: theme === 'dark' ? '#eee' : '#222' }}
              />
              <Line
                type="monotone"
                dataKey="total_points"
                stroke={theme === 'dark' ? '#facc15' : '#1e3a8a'}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Stats Table */}
          <table>
            <thead>
              <tr>
                <th>GW</th>
                <th title="Fantasy points">Pts</th>
                <th>Min</th>
                <th>G</th>
                <th>A</th>
                <th>CS</th>
                <th>YC</th>
                <th>RC</th>
                <th>B</th>
                {player.stats[0].expected_goals && <th>xG</th>}
                {player.stats[0].shots_on_target && <th>SOT</th>}
              </tr>
            </thead>
            <tbody>
              {player.stats.map(stat => (
                <tr key={stat.gameweek} title={`Gameweek ${stat.gameweek}`}>
                  <td>{stat.gameweek}</td>
                  <td>{stat.total_points}</td>
                  <td>{stat.minutes}</td>
                  <td>{stat.goals_scored}</td>
                  <td>{stat.assists}</td>
                  <td>{stat.clean_sheets}</td>
                  <td>{stat.yellow_cards}</td>
                  <td>{stat.red_cards}</td>
                  <td>{stat.bonus}</td>
                  {stat.expected_goals && <td>{Number(stat.expected_goals).toFixed(2)}</td>}
                  {stat.shots_on_target && <td>{stat.shots_on_target}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default PlayerDetail;
