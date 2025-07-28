require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

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

app.get('/teams', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fpl_teams ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/players', async (req, res) => {
    try {
        const teamName = req.query.team;
        let query, values;
        if (teamName) {
            query = `
                SELECT p.*, p.player_id AS id, t.name AS team_name 
                FROM fpl_players p 
                JOIN fpl_teams t ON p.team_id = t.team_id 
                WHERE t.name = $1
                ORDER BY p.web_name
            `;
            values = [teamName];
        } else {
            query = `
                SELECT p.*, p.player_id AS id, t.name AS team_name 
                FROM fpl_players p 
                JOIN fpl_teams t ON p.team_id = t.team_id 
                ORDER BY t.name, p.web_name
            `;
            values = [];
        }
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching players:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
                ORDER BY f.kickoff_time
            `;
            values = [gameweek];
        } else {
            query = `
                SELECT f.*, ht.name AS home_team_name, at.name AS away_team_name 
                FROM fpl_fixtures f 
                JOIN fpl_teams ht ON f.home_team_id = ht.team_id
                JOIN fpl_teams at ON f.away_team_id = at.team_id
                ORDER BY f.gameweek, f.kickoff_time
            `;
            values = [];
        }
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching fixtures:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
                LIMIT 50
            `;
            values = [playerId];
        } else {
            query = `
                SELECT s.*, p.web_name, t.name AS team_name
                FROM fpl_player_gameweek_stats s
                JOIN fpl_players p ON s.player_id = p.player_id
                JOIN fpl_teams t ON p.team_id = t.team_id
                ORDER BY s.gameweek DESC
                LIMIT 100
            `;
            values = [];
        }
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching player gameweek stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`FPL API backend running on port ${PORT}`);
});
