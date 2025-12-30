const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  transports: ["polling"]
});

app.use(express.static("public"));

const lobbies = {};
const QUESTIONS = [
  "Qui est le plus drôle ?",
  "Qui est le plus en retard ?",
  "Qui est le plus susceptible ?",
  "Qui est le plus fêtard ?",
  "Qui est le plus intelligent ?",
  "Qui est le plus sportif ?",
  "Qui est le plus maladroit ?",
  "Qui est le plus chanceux ?",
  "Qui est le plus romantique ?",
  "Qui est le plus audacieux ?"
];

function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on("connection", socket => {

  socket.on("createLobby", ({ name, questionsCount }) => {
    const code = generateCode();
    lobbies[code] = {
      players: {},
      scores: {},
      questionsCount,
      currentQuestion: 0,
      votes: {}
    };

    lobbies[code].players[socket.id] = name;
    lobbies[code].scores[socket.id] = 0;

    socket.join(code);
    socket.emit("lobbyJoined", code);
    io.to(code).emit("playersUpdate", lobbies[code].players);
  });

  socket.on("joinLobby", ({ code, name }) => {
    if (!lobbies[code]) return;

    lobbies[code].players[socket.id] = name;
    lobbies[code].scores[socket.id] = 0;

    socket.join(code);
    socket.emit("lobbyJoined", code);
    io.to(code).emit("playersUpdate", lobbies[code].players);
  });

  socket.on("startGame", code => {
    const lobby = lobbies[code];
    lobby.currentQuestion = 0;
    io.to(code).emit("newQuestion", QUESTIONS[lobby.currentQuestion]);
  });


  socket.on("vote", ({ code, target }) => {
    const lobby = lobbies[code];
    if (!lobby.votes[target]) lobby.votes[target] = 0;
    lobby.votes[target]++;
  });

  socket.on("endQuestion", code => {
    const lobby = lobbies[code];
    const sorted = Object.entries(lobby.votes)
      .sort((a, b) => b[1] - a[1]);

    if (sorted[0]) lobby.scores[sorted[0][0]] += 3;
    if (sorted[1]) lobby.scores[sorted[1][0]] += 2;
    if (sorted[2]) lobby.scores[sorted[2][0]] += 1;

    lobby.votes = {};
    lobby.currentQuestion++;

    io.to(code).emit("scoresUpdate", lobby.scores);

    if (lobby.currentQuestion >= lobby.questionsCount) {
      io.to(code).emit("gameOver", lobby.scores);
    } else {
      io.to(code).emit(
        "newQuestion",
        QUESTIONS[lobby.currentQuestion]
      );
    }
  });

  socket.on("disconnect", () => {
    for (const code in lobbies) {
      delete lobbies[code].players[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});

