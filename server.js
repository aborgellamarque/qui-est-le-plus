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
  "Qui est le plus audacieux ?",

  "Qui est le plus susceptible de manger une pizza froide au petit-déjeuner ?",
  "Qui parle le plus tout seul ?",
  "Qui est le plus bizarre quand il danse ?",
  "Qui rit le plus à ses propres blagues ?",
  "Qui perd le plus souvent son téléphone ?",
  "Qui envoie le plus souvent des messages au mauvais groupe ?",
  "Qui met le plus de temps à répondre aux messages ?",
  "Qui est le plus accro à son téléphone ?",
  "Qui s’endort le plus facilement en soirée ?",
  "Qui oublie toujours pourquoi il est entré dans une pièce ?",

  "Qui est le plus maladroit avec un verre à la main ?",
  "Qui se trompe le plus souvent de prénom ?",
  "Qui est le plus bizarre quand il est fatigué ?",
  "Qui mange le plus souvent des choses tombées par terre ?",
  "Qui panique le plus pour rien ?",
  "Qui parle trop fort sans s’en rendre compte ?",
  "Qui est le plus souvent perdu dans le temps ?",
  "Qui est le plus étrange sur les photos ?",
  "Qui répondrait 'toi' à cette question ?",
  "Qui fait les blagues au pire moment ?",

  "Qui met toujours des réveils inutiles ?",
  "Qui regarde les séries en accéléré ?",
  "Qui chante faux avec confiance ?",
  "Qui raconte les histoires les plus longues ?",
  "Qui rate le plus souvent une marche ?",
  "Qui dit 'quoi ?' alors qu’il a entendu ?",
  "Qui mange à des heures improbables ?",
  "Qui met 20 minutes à choisir un film ?",
  "Qui se parle devant le miroir ?",
  "Qui rit dans les moments sérieux ?",

  "Qui oublie le plus les anniversaires ?",
  "Qui perd le plus souvent ses clés ?",
  "Qui dit 'j’arrive' alors qu’il n’est pas prêt ?",
  "Qui est le plus nul avec la technologie ?",
  "Qui lit le plus mal les messages ?",
  "Qui répond toujours trop tard ?",
  "Qui est le plus bizarre quand il est heureux ?",
  "Qui a déjà fait tomber son téléphone sur son visage ?",
  "Qui parle pendant les films ?",
  "Qui a les habitudes alimentaires les plus étranges ?",

  "Qui confond le plus souvent les gens ?",
  "Qui prend les pires décisions à 3h du matin ?",
  "Qui dit le plus souvent quelque chose de maladroit ?",
  "Qui rit nerveusement ?",
  "Qui fait des drames pour des détails ?",
  "Qui est le plus bizarre quand il est malade ?",
  "Qui oublie où il s’est garé ?",
  "Qui suranalyse les messages ?",
  "Qui a les goûts musicaux les plus étranges ?",
  "Qui rate un bus juste devant lui ?",

  "Qui regarde son téléphone sans notification ?",
  "Qui renverse toujours son verre ?",
  "Qui change d’avis toutes les 5 minutes ?",
  "Qui dit des évidences inutiles ?",
  "Qui comprend les blagues en retard ?",
  "Qui rate les infos importantes ?",
  "Qui rit au mauvais moment ?",
  "Qui s’embrouille tout seul ?",
  "Qui clique sur des liens douteux ?",
  "Qui oublie ce qu’il allait dire ?",

  "Qui pourrait battre le record du plus gros séducteur ?",
  "Qui a clairement plus d’expérience que les autres ?",
  "Qui pourrait écrire un guide de la drague ?",
  "Qui mentirait sur son nombre de conquêtes ?",
  "Qui a la réputation la plus douteuse ?",
  "Qui est le plus à l’aise pour parler de sujets intimes ?",
  "Qui pourrait séduire quelqu’un en 5 minutes ?",
  "Qui a le plus d’anecdotes gênantes ?",
  "Qui est le plus chaud en soirée ?",
  "Qui drague sans s’en rendre compte ?",

  "Qui reçoit le plus souvent des messages suspects ?",
  "Qui a les stories les plus douteuses ?",
  "Qui est trop confiant sans raison ?",
  "Qui pourrait séduire juste avec un regard ?",
  "Qui est le plus à l’aise avec les applis de rencontre ?",
  "Qui a déjà vécu des situations très limites ?",
  "Qui embrasserait quelqu’un sans réfléchir ?",
  "Qui donne les vibes les plus dangereuses ?",
  "Qui a déjà été surpris dans un moment gênant ?",
  "Qui raconte des histoires qu’on ne veut pas entendre ?",

  "Qui regrette le plus souvent le lendemain ?",
  "Qui a trop de charisme inutile ?",
  "Qui fait des compliments douteux ?",
  "Qui flirterait au supermarché ?",
  "Qui dépasse souvent les bornes ?",
  "Qui dit 't’inquiète' avant le chaos ?",
  "Qui se vante le plus ?",
  "Qui a clairement plus vécu que les autres ?",
  "Qui pourrait choquer tout le groupe avec une anecdote ?",
  "Qui mérite officiellement le titre de plus WTF ?"

  "Qui pourrait avoir un bodycount que personne n’ose imaginer ?",
  "Qui est le plus susceptible de mentir sur son passé amoureux ?",
  "Qui pourrait séduire quelqu’un juste par message ?",
  "Qui a clairement déjà eu une réputation étrange ?",
  "Qui est le plus probable d’avoir déjà été le sujet d’une rumeur ?",
  "Qui pourrait raconter une histoire qui choque tout le monde ?",
  "Qui est le plus à l’aise avec les situations gênantes ?",
  "Qui a déjà clairement attiré l’attention sans le vouloir ?",
  "Qui pourrait avoir un talent caché très suspect ?",
  "Qui est le plus probable d’avoir déjà été jugé pour sa vie privée ?",

  "Qui est le plus à l’aise avec son image ?",
  "Qui pourrait faire rougir quelqu’un juste en parlant ?",
  "Qui est le plus probable d’avoir déjà fait une énorme erreur relationnelle ?",
  "Qui pourrait séduire quelqu’un dans une situation totalement absurde ?",
  "Qui est le plus probable d’avoir déjà eu un énorme malaise intime ?",
  "Qui donne le plus l’impression de cacher quelque chose ?",
  "Qui pourrait choquer ses proches avec une anecdote passée ?",
  "Qui est le plus probable d’avoir déjà eu une double vie (au moins un peu) ?",
  "Qui est le plus à l’aise avec les regards insistants ?",
  "Qui pourrait être beaucoup plus expérimenté qu’il ne le montre ?",

  "Qui est le plus susceptible de se faire griller par accident ?",
  "Qui pourrait avoir des messages très compromettants sur son téléphone ?",
  "Qui est le plus probable d’avoir déjà eu une situation très ambiguë ?",
  "Qui est le plus à l’aise pour parler de sujets tabous ?",
  "Qui pourrait assumer une anecdote que personne d’autre n’assumerait ?",
  "Qui est le plus probable d’avoir déjà été pris en flagrant délit ?",
  "Qui pourrait faire un aveu inattendu sans prévenir ?",
  "Qui est le plus à l’aise avec l’attention des autres ?",
  "Qui pourrait surprendre tout le monde par son audace ?",
  "Qui est le plus probable d’avoir déjà été sous-estimé ?",

  "Qui est le plus à l’aise pour jouer avec les limites ?",
  "Qui pourrait provoquer un énorme malaise sans le vouloir ?",
  "Qui est le plus probable d’avoir déjà vécu une situation complètement folle ?",
  "Qui pourrait écrire un livre de ses pires décisions ?",
  "Qui est le plus à l’aise avec l’improvisation sociale ?",
  "Qui pourrait choquer juste avec un regard ?",
  "Qui est le plus probable d’avoir déjà tenté quelque chose de risqué ?",
  "Qui pourrait avouer quelque chose d’inavouable ?",
  "Qui est le plus imprévisible dans ses relations ?",
  "Qui mérite clairement un avertissement avant de raconter ses histoires ?",

  "Qui pourrait battre le record du malaise le plus intense ?",
  "Qui est le plus à l’aise avec les situations borderline ?",
  "Qui pourrait surprendre tout le monde par son culot ?",
  "Qui est le plus probable d’avoir déjà été mal compris ?",
  "Qui pourrait être élu officiellement le plus incontrôlable du groupe ?"
];

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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
    lobby.questionsOrder[lobby.currentQuestion]
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
    const questionsCopy = [...QUESTIONS];
    shuffleArray(questionsCopy);

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
      votesCount: 0,
      questionsOrder: questionsCopy.slice(0, questionsCount) // tirage unique
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

