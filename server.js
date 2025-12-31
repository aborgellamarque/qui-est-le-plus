const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { transports: ["polling"] });

app.use(express.static("public"));

const lobbies = {};

// QUESTIONS = ton tableau de 150+ questions
const QUESTIONS = require("./questions.json").questions;

// ───────────── UTIL ─────────────
function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ───────────── GAME LOGIC ─────────────
function startQuestion(code) {
  const lobby = lobbies[code];
  if (!lobby) return;

  lobby.questionEnded = false;

  const playersList = Object.entries(lobby.players).map(([id, name]) => ({
    id,
    name
  }));

  io.to(code).emit("newQuestion", {
    question: lobby.questionsOrder[lobby.currentQuestion],
    players: playersList
  });

  clearTimeout(lobby.questionTimer);
  lobby.questionTimer = setTimeout(() => {
    endQuestion(code);
  }, 15000);
}

function endQuestion(code) {
  const lobby = lobbies[code];
  if (!lobby || lobby.questionEnded) return;

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

  // +1 point aux "plus"
  winners.forEach(id => {
    lobby.scores[id] = (lobby.scores[id] || 0) + 1;
  });

  // +1 point aux votants corrects
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

  // Reset votes
  lobby.votes = {};
  lobby.votesByPlayer = {};
  lobby.votesCount = 0;

  setTimeout(() => {
    lobby.currentQuestion++;

    if (lobby.currentQuestion >= lobby.questionsOrder.length) {
      io.to(code).emit("gameOver", lobby.scores);
    } else {
      startQuestion(code);
    }
  }, 7000);
}

// ───────────── SOCKETS ─────────────
io.on("connection", socket => {

  socket.on("createLobby", ({ name, questionsCount }) => {
    const code = generateCode();

    const questionsCopy = shuffleArray([...QUESTIONS]);
    const selectedQuestions = questionsCopy.slice(0, questionsCount);

    lobbies[code] = {
      hostId: socket.id,
      players: { [socket.id]: name },
      scores: { [socket.id]: 0 },
      questionsOrder: selectedQuestions,
      currentQuestion: 0,
      questionTimer: null,
      questionEnded: false,
      votes: {},
      votesByPlayer: {},
      votesCount: 0
    };

    socket.join(code);
    socket.emit("lobbyJoined", { code, isHost: true });
    io.to(code).emit("playersUpdate", lobbies[code].players);
  });

  socket.on("joinLobby", ({ code, name }) => {
    const lobby = lobbies[code];
    if (!lobby) return;

    lobby.players[socket.id] = name;
    lobby.scores[socket.id] = 0;

    socket.join(code);
    socket.emit("lobbyJoined", { code, isHost: false });
    io.to(code).emit("playersUpdate", lobby.players);
  });

  socket.on("startGame", code => {
    const lobby = lobbies[code];
    if (!lobby || socket.id !== lobby.hostId) return;

    lobby.currentQuestion = 0;
    startQuestion(code);
  });

  socket.on("vote", ({ code, target }) => {
    const lobby = lobbies[code];
    if (!lobby || lobby.questionEnded) return;
    if (lobby.votesByPlayer[socket.id]) return;
    if (target === socket.id) return; // 🚫 sécurité absolue

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

      const totalPlayers = Object.keys(lobby.players).length;
      if (!lobby.questionEnded && lobby.votesCount >= totalPlayers) {
        endQuestion(code);
      }
    }
  });
});

// ───────────── SERVER ─────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Serveur lancé sur le port " + PORT);
});
