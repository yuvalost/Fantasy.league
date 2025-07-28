require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Pool } = require('pg');

// DB pool setup
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// API URLs
const FPL_STATIC_API_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';
const FPL_FIXTURES_API_URL = 'https://fantasy.premierleague.com/api/fixtures/';

async function ingestTeams(client) {
    console.log('Starting team ingestion...');

    const response = await fetch(FPL_STATIC_API_URL);
    if (!response.ok) throw new Error(`Failed to fetch teams: ${response.status}`);

    const data = await response.json();
    const teams = data.teams;

    let inserted = 0, updated = 0;
    for (const team of teams) {
        const upsertQuery = `
            INSERT INTO fpl_teams (name, short_code, city, stadium, logo_url, created_at, updated_at)
            VALUES ($1, $2, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (name) DO UPDATE SET
                short_code = EXCLUDED.short_code,
                updated_at = CURRENT_TIMESTAMP
            RETURNING team_id, xmax;
        `;
        try {
            const res = await client.query(upsertQuery, [team.name, team.short_name]);
            if (res.rows[0].xmax === '0') inserted++;
            else updated++;
        } catch (err) {
            console.error(`Error upserting team ${team.name}:`, err.message);
        }
    }
    console.log(`Teams inserted: ${inserted}, updated: ${updated}`);
}

async function ingestPlayers(client) {
    console.log('Starting players ingestion...');

    // Get local teams for mapping fpl team id => local team_id
    const teamsRes = await client.query('SELECT team_id, name FROM fpl_teams');
    const localTeamNameToId = new Map(teamsRes.rows.map(r => [r.name, r.team_id]));

    const response = await fetch(FPL_STATIC_API_URL);
    if (!response.ok) throw new Error(`Failed to fetch players: ${response.status}`);

    const data = await response.json();
    const players = data.elements;
    const positions = new Map(data.element_types.map(e => [e.id, e.singular_name]));

    let inserted = 0, updated = 0;
    for (const p of players) {
        const teamId = localTeamNameToId.get(data.teams.find(t => t.id === p.team)?.name);
        if (!teamId) {
            console.warn(`Skipping player ${p.web_name} — team not found locally.`);
            continue;
        }

        const upsertQuery = `
            INSERT INTO fpl_players (
                fpl_id, team_id, first_name, last_name, web_name, position,
                goals_scored, assists, total_points, minutes, yellow_cards, red_cards,
                now_cost, form, chance_of_playing_next_round, status, news,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (fpl_id) DO UPDATE SET
                team_id = EXCLUDED.team_id,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                web_name = EXCLUDED.web_name,
                position = EXCLUDED.position,
                goals_scored = EXCLUDED.goals_scored,
                assists = EXCLUDED.assists,
                total_points = EXCLUDED.total_points,
                minutes = EXCLUDED.minutes,
                yellow_cards = EXCLUDED.yellow_cards,
                red_cards = EXCLUDED.red_cards,
                now_cost = EXCLUDED.now_cost,
                form = EXCLUDED.form,
                chance_of_playing_next_round = EXCLUDED.chance_of_playing_next_round,
                status = EXCLUDED.status,
                news = EXCLUDED.news,
                updated_at = CURRENT_TIMESTAMP
            RETURNING player_id, xmax;
        `;

        const values = [
            p.id,
            teamId,
            p.first_name,
            p.second_name,
            p.web_name,
            positions.get(p.element_type),
            p.goals_scored,
            p.assists,
            p.total_points,
            p.minutes,
            p.yellow_cards,
            p.red_cards,
            p.now_cost / 10.0,
            parseFloat(p.form),
            p.chance_of_playing_next_round,
            p.status,
            p.news
        ];

        try {
            const res = await client.query(upsertQuery, values);
            if (res.rows[0].xmax === '0') inserted++;
            else updated++;
        } catch (err) {
            console.error(`Error upserting player ${p.web_name}:`, err.message);
        }
    }

    console.log(`Players inserted: ${inserted}, updated: ${updated}`);
}

async function ingestFixtures(client) {
    console.log('Starting fixtures ingestion...');

    // Map FPL team IDs to local team IDs for fixture insertion
    const teamsRes = await client.query('SELECT team_id, name FROM fpl_teams');
    const localTeamNameToId = new Map(teamsRes.rows.map(r => [r.name, r.team_id]));

    const response = await fetch(FPL_FIXTURES_API_URL);
    if (!response.ok) throw new Error(`Failed to fetch fixtures: ${response.status}`);

    const fixtures = await response.json();

    // For mapping FPL team IDs => local team IDs, create map
    const fplIdToLocalTeamId = new Map();
    // Fetch static data for mapping FPL ID to local ID
    const staticRes = await fetch(FPL_STATIC_API_URL);
    if (!staticRes.ok) throw new Error(`Failed to fetch static data for team mapping: ${staticRes.status}`);
    const staticData = await staticRes.json();

    for (const fplTeam of staticData.teams) {
        const localId = localTeamNameToId.get(fplTeam.name);
        if (localId) fplIdToLocalTeamId.set(fplTeam.id, localId);
    }

    let inserted = 0, updated = 0;
    for (const fixture of fixtures) {
        const homeTeamId = fplIdToLocalTeamId.get(fixture.team_h);
        const awayTeamId = fplIdToLocalTeamId.get(fixture.team_a);

        if (!homeTeamId || !awayTeamId) {
            console.warn(`Skipping fixture ID ${fixture.id}: team mapping missing.`);
            continue;
        }

        const upsertQuery = `
            INSERT INTO fpl_fixtures (
                fpl_fixture_id, gameweek, kickoff_time, home_team_id, away_team_id,
                home_score, away_score, finished, started, difficulty,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (fpl_fixture_id) DO UPDATE SET
                gameweek = EXCLUDED.gameweek,
                kickoff_time = EXCLUDED.kickoff_time,
                home_team_id = EXCLUDED.home_team_id,
                away_team_id = EXCLUDED.away_team_id,
                home_score = EXCLUDED.home_score,
                away_score = EXCLUDED.away_score,
                finished = EXCLUDED.finished,
                started = EXCLUDED.started,
                difficulty = EXCLUDED.difficulty,
                updated_at = CURRENT_TIMESTAMP
            RETURNING fixture_id, xmax;
        `;

        const values = [
            fixture.id,
            fixture.event,
            fixture.kickoff_time,
            homeTeamId,
            awayTeamId,
            fixture.team_h_score,
            fixture.team_a_score,
            fixture.finished,
            fixture.started,
            fixture.team_h_difficulty,
        ];

        try {
            const res = await client.query(upsertQuery, values);
            if (res.rows[0].xmax === '0') inserted++;
            else updated++;
        } catch (err) {
            console.error(`Error upserting fixture ${fixture.id}:`, err.message);
        }
    }

    console.log(`Fixtures inserted: ${inserted}, updated: ${updated}`);
}

async function main() {
    const client = await pool.connect();
    try {
        await ingestTeams(client);
        await ingestPlayers(client);
        await ingestFixtures(client);
    } catch (err) {
        console.error('Error during ingestion:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
