let timerInterval;
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

socket.on("newQuestion", ({ question, players }) => {
  questionEl.textContent = question;
  choicesEl.innerHTML = "";

  players.forEach(player => {
    if (player.id === socket.id) return; // 🚫 interdit de voter pour soi

    const btn = document.createElement("button");
    btn.textContent = player.name;
    btn.onclick = () => {
      socket.emit("vote", {
        code: lobbyCode,
        target: player.id
      });
    };

    choicesEl.appendChild(btn);
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

socket.on("questionResults", data => {
  clearInterval(timerInterval);

  const ranking = Object.entries(data.votes)
    .sort((a, b) => b[1] - a[1])
    .map(([id, votes]) => {
      return `<div class="player-card">
        ${playersList[id]} — ${votes} votes
      </div>`;
    }).join("");

  document.body.innerHTML = `
    <div class="screen">
      <h2>Résultat</h2>
      <p>
        👑 Le(s) plus :
        <strong>
          ${data.winners.map(id => playersList[id]).join(", ")}
        </strong>
      </p>
      ${ranking}
      <div class="time-container">
        <div id="time-bar"></div>
      </div>
    </div>
  `;

  startTimer(7);
});

socket.on("gameOver", scores => {
  const podium = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score], i) => `
      <div class="player-card podium-${i}">
        ${i + 1}. ${playersList[id]} — ${score} pts
      </div>
    `).join("");

  document.body.innerHTML = `
    <div class="screen">
      <h2>🏆 Podium</h2>
      ${podium}
    </div>
  `;
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

function startTimer(seconds) {
  clearInterval(timerInterval);

  let timeLeft = seconds;
  const bar = document.getElementById("time-bar");

  timerInterval = setInterval(() => {
    timeLeft--;
    bar.style.width = (timeLeft / seconds) * 100 + "%";

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
}
