import React, { useState, useEffect } from 'react';
import './Fixtures.css';

const teamLogos = {
  "Arsenal": "57", "Aston Villa": "58", "Bournemouth": "1044", "Brentford": "402",
  "Brighton": "397", "Burnley": "328", "Chelsea": "61", "Crystal Palace": "354",
  "Everton": "62", "Fulham": "63", "Leeds": "341", "Liverpool": "64", "Man City": "65",
  "Man Utd": "66", "Newcastle": "67", "Nott'm Forest": "351", "Spurs": "73",
  "West Ham": "563", "Wolves": "76", "Sunderland": "340"
};

const teamColors = {
  "Arsenal": "#EF0107", "Aston Villa": "#95BFE5", "Bournemouth": "#DA291C",
  "Brentford": "#E30613", "Brighton": "#0057B8", "Burnley": "#6C1D45",
  "Chelsea": "#034694", "Crystal Palace": "#1B458F", "Everton": "#003399",
  "Fulham": "#000000", "Leeds": "#FFCD00", "Liverpool": "#C8102E",
  "Man City": "#6CABDD", "Man Utd": "#DA291C", "Newcastle": "#241F20",
  "Nott'm Forest": "#DD0000", "Spurs": "#132257", "West Ham": "#7A263A",
  "Wolves": "#FDB913", "Sunderland": "#D71920"
};

const TeamBlock = ({ name }) => (
  <div
    className="team-block"
    style={{ backgroundColor: teamColors[name] || "#444", color: "#fff" }}
  >
    <img
      src={`https://crests.football-data.org/${teamLogos[name] || ''}.svg`}
      alt={name}
      className="team-logo"
    />
    <span>{name}</span>
  </div>
);

const getMatchStatusLabel = (started, finished) => {
  if (finished) return <span className="match-status ft">FT</span>;
  if (started) return <span className="match-status live">LIVE</span>;
  return <span className="match-status ns">NS</span>;
};

const getCountdown = (kickoffTime) => {
  const now = new Date();
  const kickoff = new Date(kickoffTime);
  const diff = kickoff - now;
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `Starts in ${hours}h ${minutes}m`;
};

function Fixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);

  const fetchFixtures = async () => {
    try {
      const res = await fetch('http://localhost:3000/fixtures');
      if (!res.ok) throw new Error('Error fetching fixtures');
      const data = await res.json();
      setFixtures(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures(); // Initial load
    const interval = setInterval(fetchFixtures, 60000); // Auto-refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleWeek = (week) => {
    setExpandedWeek(expandedWeek === week ? null : week);
  };

  const groupedFixtures = fixtures.reduce((groups, fix) => {
    if (!groups[fix.gameweek]) groups[fix.gameweek] = [];
    groups[fix.gameweek].push(fix);
    return groups;
  }, {});

  const uniqueTeams = Array.from(new Set(fixtures.flatMap(fix => [fix.home_team_name, fix.away_team_name]))).sort();

  if (loading) return <p>Loading fixtures...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="fixture-container">
      <h2>Premier League Fixtures</h2>
      <div className="scoreboard">
        <div>Total Fixtures: {fixtures.length}</div>
        <div>Started: {fixtures.filter(f => f.started).length}</div>
        <div>Finished: {fixtures.filter(f => f.finished).length}</div>
      </div>
      <div className="scoreboard-logos">
        {uniqueTeams.map(team => (
          <img
            key={team}
            src={`https://crests.football-data.org/${teamLogos[team] || ''}.svg`}
            alt={team}
            title={team}
            className="scoreboard-logo"
          />
        ))}
      </div>
      {Object.keys(groupedFixtures)
        .sort((a, b) => Number(a) - Number(b))
        .map(week => (
          <div key={week} className="gameweek">
            <button className="accordion" onClick={() => toggleWeek(week)}>
              Gameweek {week}
            </button>
            {expandedWeek === week && (
              <table>
                <thead>
                  <tr>
                    <th>🏟️ Kickoff</th>
                    <th>Home</th>
                    <th colSpan="2">Score</th>
                    <th>Away</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedFixtures[week].map(fix => (
                    <tr key={fix.fixture_id}>
                      <td>
                        {new Date(fix.kickoff_time).toLocaleString()}
                        {!fix.started && !fix.finished && (
                          <div className="countdown">{getCountdown(fix.kickoff_time)}</div>
                        )}
                      </td>
                      <td><TeamBlock name={fix.home_team_name} /></td>
                      <td colSpan="2">
                        <div className="inline-scoreboard">
                          <span className="score">
                            {fix.home_score !== null ? fix.home_score : "-"} : {fix.away_score !== null ? fix.away_score : "-"}
                          </span>
                          {getMatchStatusLabel(fix.started, fix.finished)}
                        </div>
                      </td>
                      <td><TeamBlock name={fix.away_team_name} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
    </div>
  );
}

export default Fixtures;
