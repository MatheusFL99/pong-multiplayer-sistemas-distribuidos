import React, { useContext } from 'react'
import {
  createLobby,
  joinLobby,
  leaveLobby,
  GameContext
} from '../context/GameContext'

const Lobbys = () => {
  const { player, lobbys, lobby } = useContext(GameContext)

  return (
    <div className="list-group">
      <span className="list-title">
        Salas
        {!player.lobby && <button onClick={createLobby}>Criar Sala</button>}
      </span>
      {!player.lobby &&
        Object.keys(lobbys).map(key => (
          <div key={`lobby_${key}`} className="list-item">
            {lobbys[key].name}
            {lobbys[key].score1 === undefined && (
              <button
                onClick={() => joinLobby(key)}
                disabled={lobbys[key].player1 && lobbys[key].player2}
              >
                Entrar
              </button>
            )}
            {lobbys[key].score1 !== undefined && (
              <span>
                {lobbys[key].score1} x {lobbys[key].score2}
              </span>
            )}
          </div>
        ))}
      {player.lobby && lobby && (
        <div>
          <div className="list-item">
            <span>{lobby.name}</span>
            <button onClick={leaveLobby}>Sair</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Lobbys
