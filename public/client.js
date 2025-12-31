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
          ? `<button id="startBtn">Démarrer la partie</button>`
          : `<p style="text-align:center;">En attente du créateur…</p>`
      }
    </div>
  `;

  if (isHost) {
    document.getElementById("startBtn").onclick = () => {
      socket.emit("startGame", lobbyCode);
    };
  }
  socket.emit("requestPlayers", lobbyCode);
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

socket.on("newQuestion", data => {
  if (!data || !data.question || !data.players) {
    console.error("Question invalide reçue", data);
    return;
  }

  hasVoted = false; // 🔁 reset vote à chaque question

  document.body.innerHTML = `
    <div class="screen">
      <h2 id="question">${data.question}</h2>

      <div id="choices"></div>

      <div class="time-container">
        <div id="time-bar"></div>
      </div>
    </div>
  `;

  const questionEl = document.getElementById("question");
  const choicesEl = document.getElementById("choices");

  data.players.forEach(player => {
    if (player.id === socket.id) return; // 🚫 pas d'auto-vote

    const btn = document.createElement("button");
    btn.textContent = player.name;

    btn.onclick = () => {
      if (hasVoted) return;
      hasVoted = true;

      socket.emit("vote", {
        code: lobbyCode,
        target: player.id
      });

      choicesEl.innerHTML = `<p style="text-align:center;">Vote enregistré ✅</p>`;
    };

    choicesEl.appendChild(btn);
  });

  startTimer(15); // ⏱️ timer question
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

function startTimer(seconds) {
  clearInterval(timerInterval);
  let timeLeft = seconds;
  const bar = document.getElementById("time-bar");
  if (!bar) return;

  bar.style.width = "100%";

  timerInterval = setInterval(() => {
    timeLeft--;
    bar.style.width = (timeLeft / seconds) * 100 + "%";

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
}

