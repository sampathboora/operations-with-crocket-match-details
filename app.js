const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToServerObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToServerObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await db.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToServerObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
  SELECT 
    * 
  FROM 
    player_details
  WHERE 
    player_id = ${playerId};`;
  const player = await db.get(playerQuery);
  response.send(convertPlayerDbObjectToServerObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE 
    player_details 
  SET 
    player_name = '${playerName}'
  WHERE 
    player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
  SELECT 
    * 
  FROM 
    match_details
  WHERE 
    match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchDbObjectToServerObject(match));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
  SELECT 
    *
  FROM player_match_score 
    NATURAL JOIN match_details
  WHERE 
    player_id = ${playerId};`;
  const playerMatch = await db.all(getPlayersQuery);
  response.send(
    playerMatch.map((eachMatch) =>
      convertMatchDbObjectToServerObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `
    SELECT 
      * 
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE 
      match_id = ${matchId};`;
  const matchesArray = await db.all(getMatchesQuery);
  response.send(
    matchesArray.map((eachPlayer) =>
      convertPlayerDbObjectToServerObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchScoreQuery = `
  SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
  FROM player_match_score 
    NATURAL JOIN player_details
  WHERE 
    player_id = ${playerId};`;
  const matchesArrayDetails = await db.get(getMatchScoreQuery);
  response.send(matchesArrayDetails);
});

module.exports = app;
