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
  document.getElementById("players").innerHTML =
    Object.values(players)
      .map(name => `<div class="player-card">${name}</div>`)
      .join("");
});

function start() {
  socket.emit("startGame", lobbyCode);
}

socket.on("newQuestion", () => {
  document.body.innerHTML = `
    <div class="screen">
      <h2>Vote pour le plus</h2>
      <p>(question à venir)</p>
    </div>
  `;
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
