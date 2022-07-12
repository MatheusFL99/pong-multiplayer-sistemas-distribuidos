import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

const gameConfig = {
  width: 800,
  height: 600,
  maxScore: 10
}

const game = {
  players: {},
  lobbys: {},
  match: {}
}

io.on('connection', socket => {
  console.log(`${socket.id} conectado.`)

  const name =
    'Player' + socket.id[0] + socket.id[1] + socket.id[2] + socket.id[3]
  game.players[socket.id] = { name }
  refreshPlayers()
  refreshLobbys()

  socket.on('disconnect', () => {
    console.log(`${socket.id} desconectou.`)
    leaveLobby(socket)

    delete game.players[socket.id]

    refreshPlayers()
    refreshLobbys()
  })

  socket.on('CreateLobby', () => {
    socket.join(socket.id)

    game.lobbys[socket.id] = {
      name: `Sala do ${game.players[socket.id].name}`,
      player1: socket.id,
      player2: undefined
    }

    game.players[socket.id].lobby = socket.id

    refreshPlayers()
    refreshLobbys()
  })

  socket.on('LeaveLobby', () => {
    leaveLobby(socket)

    refreshPlayers()
    refreshLobbys()
  })

  socket.on('JoinLobby', lobbyId => {
    socket.join(lobbyId)

    const lobby = game.lobbys[lobbyId]

    const position = lobby.player1 ? '2' : '1'

    lobby[`player${position}`] = socket.id

    game.players[socket.id].lobby = lobbyId

    if (lobby.player1 && lobby.player2) {
      game.match[lobbyId] = {
        gameConfig,
        // configurando posicao inicial dos players
        player1: {
          ready: false,
          x: 5,
          y: gameConfig.height / 2 - 40,
          height: 80,
          width: 10,
          speed: 8
        },
        player2: {
          ready: false,
          x: gameConfig.width - 15,
          y: gameConfig.height / 2 - 40,
          height: 80,
          width: 10,
          speed: 8
        },
        score1: 0,
        score2: 0,
        status: 'START'
      }

      gameInProgress(lobbyId)
    }

    refreshPlayers()
    refreshLobbys()
    refreshMatch(lobbyId)
  })

  socket.on('GameLoaded', () => {
    const lobbyId = game.players[socket.id].lobby
    const match = game.match[lobbyId]
    const player =
      'player' + (game.lobbys[lobbyId].player1 == socket.id ? 1 : 2)

    match[player] = {
      ...match[player],
      ready: true
    }

    if (match.player1.ready && match.player2.ready) {
      match.status = 'PLAY'
      restartMatch(match, lobbyId)
    }
  })

  socket.on('SendKey', ({ type, key }) => {
    const socketId = socket.id
    const player = game.players[socketId]
    const lobbyId = player.lobby
    const lobby = game.lobbys[lobbyId]
    const playerNumber = 'player' + (socketId === lobby.player1 ? 1 : 2)
    const match = game.match[lobbyId]
    const direction =
      type === 'keyup' ? 'STOP' : key.replace('Arrow', '').toUpperCase()

    match[playerNumber] = { ...match[playerNumber], direction }
  })
})

const leaveLobby = socket => {
  const socketId = socket.id
  const lobbyId = game.players[socketId].lobby
  const lobby = game.lobbys[lobbyId]

  if (lobby) {
    const match = game.match[lobbyId]

    game.players[socketId].lobby = undefined

    const playerNumber = 'player' + (socketId === lobby.player1 ? 1 : 2)
    lobby[playerNumber] = undefined

    if (match) {
      match[playerNumber] = undefined

      if (match.status !== 'END') {
        match.status = 'END'
        match.message = `O jogador ${game.players[socketId].name} desconectou.`
      }
    }

    if (!lobby.player1 && !lobby.player2) {
      delete game.lobbys[lobbyId]
      if (match) {
        delete game.match[lobbyId]
      }
    }

    socket.leave(lobbyId)
    refreshMatch(lobbyId)

    socket.emit('MatchClear')
  }
}

const gameInProgress = lobbyId => {
  const match = game.match[lobbyId]
  if (!match || match.status === 'END') {
    return
  }

  if (match.status === 'PLAY') {
    moveBall(match)
    movePlayer(match)
    checkCollision(match, lobbyId)
  }

  refreshMatch(lobbyId)

  setTimeout(() => gameInProgress(lobbyId), 1000 / 60)
}

const moveBall = ({ ball }) => {
  const xpos = ball.x + ball.xspeed * ball.xdirection
  const ypos = ball.y + ball.yspeed * ball.ydirection

  ball.x = xpos
  ball.y = ypos
}

const movePlayer = match => {
  ;[1, 2].forEach(i => {
    const player = match[`player${i}`]

    switch (player.direction) {
      case 'UP':
        player.y -= player.speed
        break
      case 'DOWN':
        player.y += player.speed
        break
    }

    if (player.y < 0) {
      player.y = 0
    } else if (player.y + player.height > match.gameConfig.height) {
      player.y = match.gameConfig.height - player.height
    }
  })
}

const checkCollision = (match, lobbyId) => {
  const { ball, gameConfig } = match

  if (ball.y > gameConfig.height - ball.width) {
    ball.y = gameConfig.height - ball.width * 2
    ball.ydirection = -1
  }

  if (ball.y < ball.width) {
    ball.y = ball.width * 2
    ball.ydirection = 1
  }

  const { x: ballX, y: ballY, width: br } = ball

  const playerNumber = ballX < gameConfig.width / 2 ? 1 : 2
  const player = `player${playerNumber}`
  const { x: rx, y: ry, width: rw, height: rh } = match[player]

  let testX = ballX
  let testY = ballY

  if (ballX < rx) {
    testX = rx
  } else if (ballX > rx + rw) {
    testX = rx + rw
  }

  if (ballY < ry) {
    testY = ry
  } else if (ballY > ry + rh) {
    testY = ry + rh
  }

  const distX = ballX - testX
  const distY = ballY - testY
  const distance = Math.sqrt(distX * distX + distY * distY)

  if (distance <= br) {
    ball.xdirection *= -1
    ball.x =
      playerNumber === 1
        ? match[player].x + match[player].width + br
        : match[player].x - br

    const quarterTop = ballY < ry + rh / 4
    const quarterBottom = ballY > ry + rh - rh / 4
    const halfTop = ballY < ry + rh / 2
    const halfBottom = ballY > ry + rh - rh / 2

    if (quarterTop || quarterBottom) {
      ball.yspeed += 0.12
      ball.xspeed -= 0.12

      ball.ydirection = quarterBottom ? 1 : -1
    } else if (halfTop || halfBottom) {
      ball.yspeed += 0.05
      ball.xspeed -= 0.05
    }

    ball.xspeed *= 1.1
  } else if (ball.x < ball.width) {
    match.score2++
    restartMatch(match, lobbyId)
  } else if (ball.x > gameConfig.width - ball.width) {
    match.score1++
    restartMatch(match, lobbyId)
  }
}

const restartMatch = (match, lobbyId) => {
  match.ball = {
    ...match.ball,
    width: 5,
    xdirection: match.ball ? match.ball.xdirection * -1 : 1,
    ydirection: 1,
    xspeed: 6,
    yspeed: 6 * (match.gameConfig.height / match.gameConfig.width),
    x: match.gameConfig.width / 2,
    y: match.gameConfig.height / 2
  }

  game.lobbys[lobbyId] = {
    ...game.lobbys[lobbyId],
    score1: match.score1,
    score2: match.score2
  }

  if (
    match.score1 === match.gameConfig.maxScore ||
    match.score2 === match.gameConfig.maxScore
  ) {
    const playerNumber = match.score1 === match.gameConfig.maxScore ? 1 : 2
    const playerSocketId = game.lobbys[lobbyId][`player${playerNumber}`]

    match.status = 'END'
    match.message = `O jogador ${game.players[playerSocketId].name} venceu.`
  }

  refreshLobbys()
}

const refreshPlayers = () => {
  io.emit('PlayersRefresh', game.players)
}

const refreshLobbys = () => {
  io.emit('LobbysRefresh', game.lobbys)
}

const refreshMatch = lobbyId => {
  io.to(lobbyId).emit('MatchRefresh', game.match[lobbyId] || {})
}

app.use(express.static(path.resolve()))
app.use(express.static(path.join(path.resolve(), 'build')))

// enviar a pagina da build client
app.get('/*', function (req, res) {
  res.sendFile(path.join(path.resolve(), 'build', 'index.html'))
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}!`))
