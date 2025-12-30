let playersList = {};
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

socket.on("lobbyJoined", code => {
  lobbyCode = code;
  document.body.innerHTML = `
    <div class="screen">
      <h2>Salon ${code}</h2>
      <div id="players"></div>
      <button onclick="start()">Démarrer la partie</button>
    </div>
  `;
});

socket.on("playersUpdate", players => {
  playersList = players;
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
    if (id === socket.id) return; // empêche auto-vote

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
