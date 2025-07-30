import requests
import psycopg2
import os
from datetime import datetime
from dotenv import load_dotenv

# === Load environment variables from .env ===
load_dotenv()

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")

# === Connect to PostgreSQL ===
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT
)
cur = conn.cursor()

# === Create table if not exists ===
cur.execute("""
CREATE TABLE IF NOT EXISTS fpl_player_gameweek_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER,
    player_name TEXT,
    team_name TEXT,
    position TEXT,
    gameweek INTEGER,
    minutes INTEGER,
    goals_scored INTEGER,
    assists INTEGER,
    clean_sheets INTEGER,
    goals_conceded INTEGER,
    yellow_cards INTEGER,
    red_cards INTEGER,
    total_points INTEGER,
    date_fetched TIMESTAMP
);
""")
conn.commit()

# === Fetch data from FPL ===
print("Fetching player list...")
bootstrap = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/").json()
players = bootstrap['elements']
teams = {team['id']: team['name'] for team in bootstrap['teams']}
positions = {ptype['id']: ptype['singular_name'] for ptype in bootstrap['element_types']}

for player in players:
    player_id = player['id']
    player_name = player['web_name']
    team_name = teams[player['team']]
    position = positions[player['element_type']]

    print(f"Fetching history for {player_name}...")
    history_url = f"https://fantasy.premierleague.com/api/element-summary/{player_id}/"
    history = requests.get(history_url).json()
    gameweeks = history.get('history', [])

    for gw in gameweeks:
        cur.execute("""
            INSERT INTO fpl_player_gameweek_stats (
                player_id, player_name, team_name, position, gameweek,
                minutes, goals_scored, assists, clean_sheets,
                goals_conceded, yellow_cards, red_cards,
                total_points, date_fetched
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            player_id,
            player_name,
            team_name,
            position,
            gw['round'],
            gw['minutes'],
            gw['goals_scored'],
            gw['assists'],
            gw['clean_sheets'],
            gw['goals_conceded'],
            gw['yellow_cards'],
            gw['red_cards'],
            gw['total_points'],
            datetime.now()
        ))

    conn.commit()

cur.close()
conn.close()
print("✅ Stats imported successfully.")
