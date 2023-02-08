const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initialDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    process.exit(1);
  }
};
initialDBAndServer();

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;

  const allPlayersArray = await db.all(getPlayersQuery);
  //console.log(allPlayersArray);
  const convertObj = (each) => {
    return {
      playerId: each.player_id,
      playerName: each.player_name,
    };
  };

  response.send(allPlayersArray.map((each) => convertObj(each)));
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;

  const playerObj = await db.get(getPlayerQuery);

  response.send({
    playerId: playerObj["player_id"],
    playerName: playerObj["player_name"],
  });
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const { playerName } = request.body;

  const putPlayerQuery = `UPDATE player_details SET
      player_name = '${playerName}'
      WHERE player_id=${playerId};`;

  const updatedPlayer = await db.run(putPlayerQuery);

  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;

  const matchObj = await db.get(getMatchQuery);

  response.send({
    matchId: matchObj["match_id"],
    match: matchObj["match"],
    year: matchObj["year"],
  });
});

//API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const playerMatchQuery = `SELECT match_details.match_id,
           match_details.match,
           match_details.year
    FROM match_details  INNER JOIN  player_match_score ON
     match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;

  const matchDetailsObj = await db.all(playerMatchQuery);
  console.log(matchDetailsObj);
  const convertObj = (each) => {
    return {
      matchId: each.match_id,
      match: each.match,
      year: each.year,
    };
  };

  response.send(matchDetailsObj.map((each) => convertObj(each)));
});

module.exports = app;

//API 6

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchOfPlayerQuery = `SELECT player_details.player_id,
             player_details.player_name
    FROM player_details INNER JOIN player_match_score  ON
    player_details.player_id = player_match_score.player_id
   
    WHERE player_match_score.match_id = ${matchId};`;

  const playerDetailsObj = await db.all(getMatchOfPlayerQuery);

  const convertObj = (each) => {
    return {
      playerId: each.player_id,
      playerName: each.player_name,
    };
  };

  response.send(playerDetailsObj.map((each) => convertObj(each)));
});

//API 7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;

  const playScoreQuery = `SELECT 
             player_details.player_id ,
             player_details.player_name ,
             SUM(score) AS total_score ,
             SUM(fours) AS total_fours,
             SUM(sixes) AS total_sixes
     FROM player_details NATURAL JOIN  player_match_score  
     
     WHERE player_details.player_id = ${playerId};
   
             `;

  const playDbObj = await db.get(playScoreQuery);
  console.log(playDbObj);

  response.send({
    playerId: playDbObj.player_id,
    playerName: playDbObj.player_name,
    totalScore: playDbObj.total_score,
    totalFours: playDbObj.total_fours,
    totalSixes: playDbObj.total_sixes,
  });
});
