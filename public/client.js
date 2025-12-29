const socket = io();
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
    <h2>Lobby ${code}</h2>
    <div id="players"></div>
    <button onclick="start()">Démarrer</button>
  `;
});

socket.on("playersUpdate", players => {
  document.getElementById("players").innerHTML =
    Object.values(players).join("<br>");
});

function start() {
  socket.emit("startGame", lobbyCode);
}

socket.on("newQuestion", () => {
  document.body.innerHTML = "<h2>Vote pour le plus...</h2>";
});

socket.on("scoresUpdate", scores => {
  document.body.innerHTML =
    "<h2>Scores</h2>" +
    Object.values(scores).join("<br>");
});

socket.on("gameOver", scores => {
  document.body.innerHTML =
    "<h1>Fin de partie</h1>" +
    Object.values(scores).join("<br>");
});
