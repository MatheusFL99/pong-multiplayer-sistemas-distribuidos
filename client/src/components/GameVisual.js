import React, { useEffect, useContext } from 'react'
import SVG, { Circle, Rect, Line } from 'react-svg-draw'
import {
  gameLoaded,
  GameContext,
  leaveLobby,
  sendKey
} from '../context/GameContext'

const GameVisual = () => {
  const { match } = useContext(GameContext)
  const { gameConfig, ball, message, player1, player2 } = match

  useEffect(() => {
    gameLoaded()

    const sendKeyEvent = e => {
      const { key, type } = e

      switch (key) {
        case 'ArrowUp':
        case 'ArrowDown':
          sendKey(type, key)
          e.preventDefault()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', sendKeyEvent)
    document.addEventListener('keyup', sendKeyEvent)

    return () => {
      document.removeEventListener('keydown', sendKeyEvent)
      document.removeEventListener('keyup', sendKeyEvent)
    }
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <SVG
        width={gameConfig.width.toString()}
        height={gameConfig.height.toString()}
      >
        <Rect // fundo do jogo
          x="0"
          y="0"
          width={gameConfig.width.toString()}
          height={gameConfig.height.toString()}
          style={{ fill: 'rgb(0, 0, 0)' }}
        />
        <Line // linha do meio
          x1={(gameConfig.width / 2).toString()}
          y1="0"
          x2={(gameConfig.width / 2).toString()}
          y2={gameConfig.height.toString()}
          strokeDasharray="7,7"
          strokeWidth="7"
          style={{ stroke: 'rgba(255, 255, 255, 0.3)' }}
        />

        <text // placar player 1
          x={(gameConfig.width / 2 - 20).toString()}
          y="45"
          style={{
            direction: 'rtl', // direita pra esquerda
            fill: 'rgba(255, 255, 255, 0.75)',
            fontSize: '60px'
          }}
        >
          {match.score1}
        </text>

        <text // placar player 2
          x={(gameConfig.width / 2 + 20).toString()}
          y="45"
          style={{ fill: 'rgba(255, 255, 255, 0.75)', fontSize: '60px' }}
        >
          {match.score2}
        </text>

        {ball && (
          <Circle
            cx={ball.x.toString()}
            cy={ball.y.toString()}
            r={ball.width.toString()}
            style={{ fill: '#fff' }}
          />
        )}

        {player1 && (
          <Rect // player 1
            x={player1.x.toString()}
            y={player1.y.toString()}
            width={player1.width.toString()}
            height={player1.height.toString()}
            style={{ fill: 'rgb(255, 255, 255)' }}
          />
        )}

        {player2 && (
          <Rect // player 2
            x={player2.x.toString()}
            y={player2.y.toString()}
            width={player2.width.toString()}
            height={player2.height.toString()}
            style={{ fill: 'rgb(255, 255, 255)' }}
          />
        )}
      </SVG>

      {message && (
        <div className="game-message">
          <h4>{message}</h4>
          <button onClick={leaveLobby}>Voltar</button>
        </div>
      )}
    </div>
  )
}

export default GameVisual
