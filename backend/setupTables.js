require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        team_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        short_code VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS players (
        player_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        position VARCHAR(20),
        team_id INT REFERENCES teams(team_id),
        goals INT DEFAULT 0,
        assists INT DEFAULT 0,
        bonus_points INT DEFAULT 0,
        dynamic_price NUMERIC(6,2) DEFAULT 0,
        ranking NUMERIC(3,1) DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS fixtures (
        fixture_id SERIAL PRIMARY KEY,
        gameweek INT NOT NULL,
        date TIMESTAMP NOT NULL,
        home_team_id INT REFERENCES teams(team_id),
        away_team_id INT REFERENCES teams(team_id),
        status VARCHAR(20) DEFAULT 'scheduled'
      );

      CREATE TABLE IF NOT EXISTS fpl_player_gameweek_stats (
        id SERIAL PRIMARY KEY,
        player_id INT REFERENCES players(player_id),
        gameweek INT NOT NULL,
        goals INT DEFAULT 0,
        assists INT DEFAULT 0,
        minutes_played INT DEFAULT 0,
        yellow_cards INT DEFAULT 0,
        red_cards INT DEFAULT 0,
        clean_sheets BOOLEAN DEFAULT FALSE,
        xG NUMERIC(4,2),
        shots_on_target INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fantasy_teams (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) UNIQUE,
        team_name VARCHAR(100),
        player_ids INT[]
      );
    `);
    console.log('✅ Tables created or already exist.');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
  } finally {
    client.release();
  }
};

createTables();
