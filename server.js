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

function endQuestion(code) {
  const lobby = lobbies[code];
  if (!lobby) return;

  if (lobby.questionEnded) return;
  lobby.questionEnded = true;

  clearTimeout(lobby.questionTimer);

  const voteValues = Object.values(lobby.votes);
  const maxVotes = voteValues.length ? Math.max(...voteValues) : 0;

  const winners =
    maxVotes === 0
      ? []
      : Object.entries(lobby.votes)
          .filter(([_, v]) => v === maxVotes)
          .map(([id]) => id);


  // +1 point à tous les joueurs "les plus" (ex æquo compris)
  winners.forEach(id => {
    lobby.scores[id] = (lobby.scores[id] || 0) + 1;
  });

  // +1 point aux joueurs qui ont voté pour un des ex æquo
  Object.entries(lobby.votesByPlayer).forEach(([playerId, votedFor]) => {
    if (winners.includes(votedFor)) {
      lobby.scores[playerId] = (lobby.scores[playerId] || 0) + 1;
    }
  });


  io.to(code).emit("questionResults", {
    winners,
    votes: lobby.votes,
    scores: lobby.scores
  });

  // Reset
  lobby.votes = {};
  lobby.votesByPlayer = {};
  lobby.votesCount = 0;

  setTimeout(() => {
    lobby.currentQuestion++;

    if (lobby.currentQuestion >= lobby.questionsCount) {
      io.to(code).emit("gameOver", lobby.scores);
    } else {
      startQuestion(code);
    }
  }, 7000); // 7 secondes résultats
}

function startQuestion(code) {
  const lobby = lobbies[code];
  if (!lobby) return;

  lobby.questionEnded = false;

  // Envoi de la question
  io.to(code).emit(
    "newQuestion",
    QUESTIONS[lobby.currentQuestion]
  );

  // Sécurité : on annule l'ancien timer
  clearTimeout(lobby.questionTimer);

  // Timer serveur (15s)
  lobby.questionTimer = setTimeout(() => {
    endQuestion(code);
  }, 15000);
}

io.on("connection", socket => {

  socket.on("createLobby", ({ name, questionsCount }) => {
    const code = generateCode();
    lobbies[code] = {
      hostId: socket.id,
      players: {},
      scores: {},
      questionsCount,
      questionTimer: null,
      currentQuestion: 0,
      questionEnded: false,
      votes: {},
      votesByPlayer: {},
      votesCount: 0

    };


    lobbies[code].players[socket.id] = name;
    lobbies[code].scores[socket.id] = 0;

    socket.join(code);
    socket.emit("lobbyJoined", {
      code,
      isHost: true
    });
    io.to(code).emit("playersUpdate", lobbies[code].players);
  });

  socket.on("joinLobby", ({ code, name }) => {
    if (!lobbies[code]) return;

    lobbies[code].players[socket.id] = name;
    lobbies[code].scores[socket.id] = 0;

    socket.join(code);
    socket.emit("lobbyJoined", {
      code,
      isHost: false
    });

    io.to(code).emit("playersUpdate", lobbies[code].players);
  });

  socket.on("startGame", code => {
    const lobby = lobbies[code];
    if (!lobby) return;
    if (socket.id !== lobby.hostId) return;

    lobby.currentQuestion = 0;
    startQuestion(code);
  });




  socket.on("vote", ({ code, target }) => {
    const lobby = lobbies[code];
    if (!lobby) return;
    if (lobby.questionEnded) return;
    if (lobby.votesByPlayer[socket.id]) return;

    lobby.votesByPlayer[socket.id] = target;

    lobby.votes[target] = (lobby.votes[target] || 0) + 1;
    lobby.votesCount++;

    const totalPlayers = Object.keys(lobby.players).length;

    if (lobby.votesCount >= totalPlayers) {
      endQuestion(code);
    }
  });


  socket.on("disconnect", () => {
    for (const code in lobbies) {
      const lobby = lobbies[code];
      if (!lobby) continue;

      delete lobby.players[socket.id];
      delete lobby.votesByPlayer[socket.id];

      if (!lobby.questionEnded) {
        const totalPlayers = Object.keys(lobby.players).length;
        if (lobby.votesCount >= totalPlayers) {
          endQuestion(code);
        }
      }

    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});

