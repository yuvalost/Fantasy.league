require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE
} = process.env;

const createDatabaseIfNotExists = async () => {
  const connection = await mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\``);
  console.log(`✅ Database '${MYSQL_DATABASE}' checked/created`);
  await connection.end();
};

const createTables = async () => {
  const connection = await mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    multipleStatements: true
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teams (
        team_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        short_code VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS players (
        player_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        position VARCHAR(20),
        team_id INT,
        goals INT DEFAULT 0,
        assists INT DEFAULT 0,
        bonus_points INT DEFAULT 0,
        dynamic_price DECIMAL(6,2) DEFAULT 0,
        ranking DECIMAL(3,1) DEFAULT 0,
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
      );

      CREATE TABLE IF NOT EXISTS fixtures (
        fixture_id INT AUTO_INCREMENT PRIMARY KEY,
        gameweek INT NOT NULL,
        date DATETIME NOT NULL,
        home_team_id INT,
        away_team_id INT,
        status VARCHAR(20) DEFAULT 'scheduled',
        FOREIGN KEY (home_team_id) REFERENCES teams(team_id),
        FOREIGN KEY (away_team_id) REFERENCES teams(team_id)
      );

      CREATE TABLE IF NOT EXISTS fpl_player_gameweek_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        player_id INT,
        gameweek INT NOT NULL,
        goals INT DEFAULT 0,
        assists INT DEFAULT 0,
        minutes_played INT DEFAULT 0,
        yellow_cards INT DEFAULT 0,
        red_cards INT DEFAULT 0,
        clean_sheets BOOLEAN DEFAULT FALSE,
        xG DECIMAL(4,2),
        shots_on_target INT DEFAULT 0,
        FOREIGN KEY (player_id) REFERENCES players(player_id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fantasy_teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNIQUE,
        team_name VARCHAR(100),
        player_ids JSON,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log('✅ MySQL tables created or already exist.');
  } catch (err) {
    console.error('❌ Error creating MySQL tables:', err.message);
  } finally {
    await connection.end();
  }
};

// Run both steps
(async () => {
  try {
    await createDatabaseIfNotExists();
    await createTables();
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  }
})();
