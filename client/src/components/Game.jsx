import React, { useContext } from 'react'
import PlayerList from './Players'
import { GameContext } from '../context/GameContext'
import Lobbys from './Lobbys'
import GameVisual from './GameVisual'

const Game = () => {
  const { players, match } = useContext(GameContext)

  return (
    <>
      {match.status && (
        <div className="pong-div">
          <GameVisual />
        </div>
      )}

      {!match.status && (
        <div className="main-menu">
          <Lobbys />
          <PlayerList players={players} />
        </div>
      )}
    </>
  )
}

export default Game
