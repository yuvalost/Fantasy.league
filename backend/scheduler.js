const cron = require('node-cron');
// ... all your existing imports

// Place your (async () => { ... }) block inside this:
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Running FPL ingestion...');
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
    console.log('✅ Update complete.');
  } catch (err) {
    console.error('❌ MySQL Ingestion failed:', err);
  } finally {
    await connection.end();
  }
});
