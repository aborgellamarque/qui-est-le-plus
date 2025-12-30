let playersList = {};
let isHost = false;
let hasVoted = false;

const socket = io({
  transports: ["polling"]
});
let lobbyCode = "";

function create() {
  socket.emit("createLobby", {
    name: document.getElementById("name").value,
    questionsCount: Number(document.getElementById("questions").value)
  });
}

function join() {
  socket.emit("joinLobby", {
    code: document.getElementById("code").value,
    name: document.getElementById("name").value
  });
}

socket.on("lobbyJoined", data => {
  lobbyCode = data.code;
  isHost = data.isHost;

  document.body.innerHTML = `
    <div class="screen">
      <h2>Salon ${lobbyCode}</h2>
      <div id="players"></div>
      ${
        isHost
          ? `<button onclick="start()">Démarrer la partie</button>`
          : `<p style="text-align:center;">En attente du créateur…</p>`
      }
    </div>
  `;
});

socket.on("playersUpdate", players => {
  playersList = players;

  const playersDiv = document.getElementById("players");
  if (!playersDiv) return;

  playersDiv.innerHTML = Object.values(players)
    .map(name => `<div class="player-card">${name}</div>`)
    .join("");
});

function start() {
  socket.emit("startGame", lobbyCode);
}

socket.on("newQuestion", question => {
  hasVoted = false;

  document.body.innerHTML = `
    <div class="screen">
      <h2>${question}</h2>
      <div id="voteList"></div>
    </div>
  `;

  const list = document.getElementById("voteList");

  Object.entries(playersList).forEach(([id, name]) => {
    if (id === socket.id) return;

    const div = document.createElement("div");
    div.className = "player-card";
    div.innerText = name;
    div.onclick = () => vote(id);

    list.appendChild(div);
  });
});

socket.on("scoresUpdate", scores => {
  document.body.innerHTML = `
    <div class="screen">
      <h2>Scores</h2>
      ${Object.entries(scores)
        .map(([id, score]) => `<div class="player-card">${score} pts</div>`)
        .join("")}
    </div>
  `;
});

socket.on("gameOver", scores => {
  document.body.innerHTML =
    "<h1>Fin de partie</h1>" +
    Object.values(scores).join("<br>");
});

function vote(targetId) {
  if (hasVoted) return;

  hasVoted = true;
  socket.emit("vote", { code: lobbyCode, target: targetId });

  document.body.innerHTML = `
    <div class="screen">
      <h2>Vote enregistré ✅</h2>
      <p>En attente des autres joueurs...</p>
    </div>
  `;
}
