require('dotenv').config();
const mysql = require('mysql2/promise');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const FPL_STATIC_API_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';
const FPL_FIXTURES_API_URL = 'https://fantasy.premierleague.com/api/fixtures/';

async function createDatabaseAndTables(connection) {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE}\``);
  await connection.query(`USE \`${process.env.MYSQL_DATABASE}\``);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS fpl_teams (
      team_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      short_code VARCHAR(10),
      city VARCHAR(100),
      stadium VARCHAR(100),
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS fpl_players (
      player_id INT AUTO_INCREMENT PRIMARY KEY,
      fpl_id INT UNIQUE NOT NULL,
      team_id INT,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      web_name VARCHAR(100),
      position VARCHAR(50),
      goals_scored INT,
      assists INT,
      total_points INT,
      minutes INT,
      yellow_cards INT,
      red_cards INT,
      now_cost DECIMAL(6,2),
      form DECIMAL(4,2),
      chance_of_playing_next_round INT,
      status VARCHAR(50),
      news TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES fpl_teams(team_id)
    )`);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS fpl_fixtures (
      fixture_id INT AUTO_INCREMENT PRIMARY KEY,
      fpl_fixture_id INT UNIQUE NOT NULL,
      gameweek INT,
      kickoff_time DATETIME,
      home_team_id INT,
      away_team_id INT,
      home_score INT,
      away_score INT,
      finished TINYINT(1),
      started TINYINT(1),
      difficulty INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (home_team_id) REFERENCES fpl_teams(team_id),
      FOREIGN KEY (away_team_id) REFERENCES fpl_teams(team_id)
    )`);

  console.log('✅ MySQL database and tables are ready.');
}

async function ingestTeams(connection) {
  const res = await fetch(FPL_STATIC_API_URL);
  const data = await res.json();
  for (const team of data.teams) {
    await connection.query(`
      INSERT INTO fpl_teams (name, short_code)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE short_code = VALUES(short_code), updated_at = CURRENT_TIMESTAMP
    `, [team.name, team.short_name]);
  }
  console.log('✅ Teams ingested.');
}

async function ingestPlayers(connection) {
  const [teamRows] = await connection.query('SELECT team_id, name FROM fpl_teams');
  const teamMap = new Map(teamRows.map(r => [r.name, r.team_id]));

  const res = await fetch(FPL_STATIC_API_URL);
  const data = await res.json();
  const positions = new Map(data.element_types.map(p => [p.id, p.singular_name]));

  for (const p of data.elements) {
    const teamName = data.teams.find(t => t.id === p.team)?.name;
    const teamId = teamMap.get(teamName);
    if (!teamId) continue;

    await connection.query(`
      INSERT INTO fpl_players (
        fpl_id, team_id, first_name, last_name, web_name, position,
        goals_scored, assists, total_points, minutes, yellow_cards,
        red_cards, now_cost, form, chance_of_playing_next_round, status, news
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        team_id = VALUES(team_id),
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        web_name = VALUES(web_name),
        position = VALUES(position),
        goals_scored = VALUES(goals_scored),
        assists = VALUES(assists),
        total_points = VALUES(total_points),
        minutes = VALUES(minutes),
        yellow_cards = VALUES(yellow_cards),
        red_cards = VALUES(red_cards),
        now_cost = VALUES(now_cost),
        form = VALUES(form),
        chance_of_playing_next_round = VALUES(chance_of_playing_next_round),
        status = VALUES(status),
        news = VALUES(news),
        updated_at = CURRENT_TIMESTAMP
    `, [
      p.id, teamId, p.first_name, p.second_name, p.web_name, positions.get(p.element_type),
      p.goals_scored, p.assists, p.total_points, p.minutes, p.yellow_cards,
      p.red_cards, p.now_cost / 10.0, parseFloat(p.form), p.chance_of_playing_next_round,
      p.status, p.news
    ]);
  }
  console.log('✅ Players ingested.');
}

async function ingestFixtures(connection) {
  const [teamRows] = await connection.query('SELECT team_id, name FROM fpl_teams');
  const nameToId = new Map(teamRows.map(r => [r.name, r.team_id]));

  const staticData = await (await fetch(FPL_STATIC_API_URL)).json();
  const fplIdToLocalId = new Map(staticData.teams.map(t => [t.id, nameToId.get(t.name)]));

  const fixtures = await (await fetch(FPL_FIXTURES_API_URL)).json();
  for (const fixture of fixtures) {
    const homeId = fplIdToLocalId.get(fixture.team_h);
    const awayId = fplIdToLocalId.get(fixture.team_a);
    if (!homeId || !awayId) continue;

    await connection.query(`
      INSERT INTO fpl_fixtures (
        fpl_fixture_id, gameweek, kickoff_time, home_team_id,
        away_team_id, home_score, away_score, finished,
        started, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        gameweek = VALUES(gameweek),
        kickoff_time = VALUES(kickoff_time),
        home_team_id = VALUES(home_team_id),
        away_team_id = VALUES(away_team_id),
        home_score = VALUES(home_score),
        away_score = VALUES(away_score),
        finished = VALUES(finished),
        started = VALUES(started),
        difficulty = VALUES(difficulty),
        updated_at = CURRENT_TIMESTAMP
    `, [
      fixture.id, fixture.event, fixture.kickoff_time,
      homeId, awayId, fixture.team_h_score, fixture.team_a_score,
      fixture.finished, fixture.started, fixture.team_h_difficulty
    ]);
  }
  console.log('✅ Fixtures ingested.');
}

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: process.env.MYSQL_PORT || 3306
  });

  try {
    await createDatabaseAndTables(connection);
    await ingestTeams(connection);
    await ingestPlayers(connection);
    await ingestFixtures(connection);
  } catch (err) {
    console.error('❌ MySQL Ingestion failed:', err);
  } finally {
    await connection.end();
  }
})();
