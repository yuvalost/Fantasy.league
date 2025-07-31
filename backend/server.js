require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const app = express();
app.use(cors());
app.use(express.json());

// ===== JWT Middleware =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ===== AUTH Routes =====
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING user_id, username',
      [username, hashedPassword]
    );

    const token = jwt.sign({ user_id: result.rows[0].user_id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, username: result.rows[0].username });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== Save/Load Team =====
app.post('/save-team', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { player_ids } = req.body;

  if (!Array.isArray(player_ids) || player_ids.length > 11) {
    return res.status(400).json({ error: 'Invalid team data' });
  }

  try {
    await pool.query(
      `
      INSERT INTO user_teams (user_id, player_ids)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET player_ids = $2
    `,
      [userId, player_ids]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to save team' });
  }
});

app.get('/my-team', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const result = await pool.query('SELECT player_ids FROM user_teams WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) return res.json({ player_ids: [] });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// ===== Teams =====
app.get('/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fpl_teams ORDER BY name');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Players =====
app.get('/players', async (req, res) => {
  try {
    const teamName = req.query.team;
    let query, values;

    if (teamName) {
      query = `
        SELECT p.*, p.player_id AS id, t.name AS team_name,
               COALESCE(SUM(s.goals_scored), 0) AS goals,
               COALESCE(SUM(s.assists), 0) AS assists,
               COALESCE(SUM(s.bonus), 0) AS bonus,
               COALESCE(SUM(s.total_points), 0) AS total_points
        FROM fpl_players p
        JOIN fpl_teams t ON p.team_id = t.team_id
        LEFT JOIN fpl_player_gameweek_stats s ON p.player_id = s.player_id
        WHERE t.name = $1
        GROUP BY p.player_id, t.name
        ORDER BY p.web_name`;
      values = [teamName];
    } else {
      query = `
        SELECT p.*, p.player_id AS id, t.name AS team_name,
               COALESCE(SUM(s.goals_scored), 0) AS goals,
               COALESCE(SUM(s.assists), 0) AS assists,
               COALESCE(SUM(s.bonus), 0) AS bonus,
               COALESCE(SUM(s.total_points), 0) AS total_points
        FROM fpl_players p
        JOIN fpl_teams t ON p.team_id = t.team_id
        LEFT JOIN fpl_player_gameweek_stats s ON p.player_id = s.player_id
        GROUP BY p.player_id, t.name
        ORDER BY t.name, p.web_name`;
      values = [];
    }

    const result = await pool.query(query, values);

    const players = result.rows.map(p => {
      const goals = parseInt(p.goals) || 0;
      const assists = parseInt(p.assists) || 0;
      const bonus = parseInt(p.bonus) || 0;
      const rawScore = goals * 4 + assists * 3 + bonus;
      const ranking = Math.min(10, parseFloat(((rawScore / 40) * 10).toFixed(1)));
      const dynamic_price = Math.max(4.0, parseFloat((4.0 + ranking * 0.6).toFixed(1)));
      return { ...p, ranking, dynamic_price };
    });

    res.json(players);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Fixtures =====
app.get('/fixtures', async (req, res) => {
  try {
    const gameweek = req.query.gameweek;
    let query, values;

    if (gameweek) {
      query = `
        SELECT f.*, ht.name AS home_team_name, at.name AS away_team_name
        FROM fpl_fixtures f
        JOIN fpl_teams ht ON f.home_team_id = ht.team_id
        JOIN fpl_teams at ON f.away_team_id = at.team_id
        WHERE f.gameweek = $1
        ORDER BY f.kickoff_time`;
      values = [gameweek];
    } else {
      query = `
        SELECT f.*, ht.name AS home_team_name, at.name AS away_team_name
        FROM fpl_fixtures f
        JOIN fpl_teams ht ON f.home_team_id = ht.team_id
        JOIN fpl_teams at ON f.away_team_id = at.team_id
        ORDER BY f.gameweek, f.kickoff_time`;
      values = [];
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Gameweek Stats =====
app.get('/player-gameweek-stats', async (req, res) => {
  try {
    const playerId = req.query.player_id;
    let query, values;

    if (playerId) {
      query = `
        SELECT s.*, p.web_name, t.name AS team_name
        FROM fpl_player_gameweek_stats s
        JOIN fpl_players p ON s.player_id = p.player_id
        JOIN fpl_teams t ON p.team_id = t.team_id
        WHERE s.player_id = $1
        ORDER BY s.gameweek DESC
        LIMIT 50`;
      values = [playerId];
    } else {
      query = `
        SELECT s.*, p.web_name, t.name AS team_name
        FROM fpl_player_gameweek_stats s
        JOIN fpl_players p ON s.player_id = p.player_id
        JOIN fpl_teams t ON p.team_id = t.team_id
        ORDER BY s.gameweek DESC
        LIMIT 100`;
      values = [];
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Player Detail =====
app.get('/player/:id', async (req, res) => {
  const playerId = req.params.id;
  try {
    const playerResult = await pool.query(`
      SELECT p.*, t.name AS team_name
      FROM fpl_players p
      JOIN fpl_teams t ON p.team_id = t.team_id
      WHERE p.player_id = $1
    `, [playerId]);

    if (playerResult.rows.length === 0) return res.status(404).json({ error: 'Player not found' });

    const statsResult = await pool.query(`
      SELECT *
      FROM fpl_player_gameweek_stats
      WHERE player_id = $1
      ORDER BY gameweek DESC
      LIMIT 10
    `, [playerId]);

    const player = playerResult.rows[0];
    player.stats = statsResult.rows;
    res.json(player);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== Server Start =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ FPL API backend running on port ${PORT}`);
});
