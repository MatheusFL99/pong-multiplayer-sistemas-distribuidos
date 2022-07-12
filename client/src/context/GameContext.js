import React, { useReducer, useEffect } from 'react'
import socketClient from 'socket.io-client'

const socket = socketClient(
  'https://projeto-sd-pong-multiplayer.herokuapp.com/',
  {
    autoConnect: false
  }
)

const GameContext = React.createContext() // definindo context pra usar os states globalmente

const reducer = (state, action) => {
  switch (action.type) {
    case 'CONNECTED':
      return {
        ...state,
        isConnected: action.payload
      }
    case 'PLAYER':
      return {
        ...state,
        player: action.payload
      }
    case 'PLAYERS':
      return {
        ...state,
        players: action.payload
      }
    case 'ROOM':
      return {
        ...state,
        lobby: state.lobbys[state.players[action.payload].lobby]
      }
    case 'ROOMS':
      return {
        ...state,
        lobbys: action.payload
      }
    case 'MATCH':
      return {
        ...state,
        match: action.payload
      }
    default:
      return state
  }
}

const initialState = {
  isConnected: false,
  player: {},
  lobby: {},
  lobbys: {},
  players: {},
  match: {}
}

const GameProvider = props => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    socket.on('connect', () => {
      dispatch({ type: 'CONNECTED', payload: true })
    })
    socket.on('disconnect', () => {
      dispatch({ type: 'CONNECTED', payload: false })
    })
    socket.on('PlayersRefresh', players => {
      dispatch({ type: 'PLAYERS', payload: players })
      dispatch({ type: 'PLAYER', payload: players[socket.id] })
    })
    socket.on('LobbysRefresh', lobbys => {
      dispatch({ type: 'ROOMS', payload: lobbys })
      dispatch({ type: 'ROOM', payload: socket.id })
    })
    socket.on('MatchRefresh', match => {
      dispatch({ type: 'MATCH', payload: match })
    })
    socket.on('MatchClear', () => {
      dispatch({ type: 'MATCH', payload: {} })
    })
    socket.open()
  }, [])

  return (
    <GameContext.Provider value={state}>{props.children}</GameContext.Provider>
  )
}

const createLobby = () => {
  socket.emit('CreateLobby')
}

const leaveLobby = () => {
  socket.emit('LeaveLobby')
}

const joinLobby = lobbyId => {
  socket.emit('JoinLobby', lobbyId)
}

const gameLoaded = () => {
  socket.emit('GameLoaded')
}

let lastType = undefined
const sendKey = (type, key) => {
  if (lastType === type) {
    return
  }

  lastType = type
  socket.emit('SendKey', { type, key })
}

export {
  GameContext,
  GameProvider,
  createLobby,
  leaveLobby,
  joinLobby,
  gameLoaded,
  sendKey
}
