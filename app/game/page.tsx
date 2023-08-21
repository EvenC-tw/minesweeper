'use client';

import { use, useEffect, useState } from 'react';

export default function Page() {
  type Point = {
    isBomb: boolean;
    hasRevealed: boolean;
    hasFlag: boolean;
    count: number | null;
  };
  enum Difficulty {
    EASY = 10,
    MEDIUM = 15,
    HARD = 30,
  }
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'won' | 'lost'>('waiting');
  const [totalBombs, setTotalBombs] = useState<number>(0);
  const [remainFlags, setRemainFlags] = useState<number>(0);
  const [map, setMap] = useState<Point[][]>([]);
  const generateMap = () => {
    const rows = gameDifficulty;
    const columns = gameDifficulty;
    // generate the first bomb cell, because we need at least one bomb
    const firstBombCell = [Math.floor(Math.random() * rows), Math.floor(Math.random() * columns)];
    let countBombs = 0;

    setMap(
      Array.from({ length: rows }, (_, rowIndex) =>
        Array.from({ length: columns }, (_, colIndex) => {
          const isBomb = (firstBombCell[0] === rowIndex && firstBombCell[1] === colIndex) || Math.random() < 0.1;
          if (isBomb) countBombs++;
          return {
            isBomb,
            hasRevealed: false,
            hasFlag: false,
            count: null,
          };
        })
      )
    );
    setTotalBombs(countBombs);
    setRemainFlags(countBombs);
  };

  const onReset = () => {
    setGameState('waiting');
  };

  const onStart = () => {
    setGameState('playing');
    generateMap();
  };

  const onReveal = (rowIndex: number, colIndex: number) => {
    const newMap = [...map];
    newMap[rowIndex][colIndex].hasRevealed = true;
    newMap[rowIndex][colIndex].count = showCounter(rowIndex, colIndex);

    if (newMap[rowIndex][colIndex].isBomb) {
      setGameState('lost');
      return;
    }
    if (showCounter(rowIndex, colIndex) === 0) {
      if (map[rowIndex - 1]?.[colIndex - 1]?.hasRevealed === false) onReveal(rowIndex - 1, colIndex - 1);
      if (map[rowIndex - 1]?.[colIndex]?.hasRevealed === false) onReveal(rowIndex - 1, colIndex);
      if (map[rowIndex - 1]?.[colIndex + 1]?.hasRevealed === false) onReveal(rowIndex - 1, colIndex + 1);
      if (map[rowIndex]?.[colIndex - 1]?.hasRevealed === false) onReveal(rowIndex, colIndex - 1);
      if (map[rowIndex]?.[colIndex + 1]?.hasRevealed === false) onReveal(rowIndex, colIndex + 1);
      if (map[rowIndex + 1]?.[colIndex - 1]?.hasRevealed === false) onReveal(rowIndex + 1, colIndex - 1);
      if (map[rowIndex + 1]?.[colIndex]?.hasRevealed === false) onReveal(rowIndex + 1, colIndex);
      if (map[rowIndex + 1]?.[colIndex + 1]?.hasRevealed === false) onReveal(rowIndex + 1, colIndex + 1);
    } else {
      setMap(newMap);
    }
  };

  const onSetFlag = (rowIndex: number, colIndex: number) => {
    const newMap = [...map];
    newMap[rowIndex][colIndex].hasFlag = !newMap[rowIndex][colIndex].hasFlag;
    setMap(newMap);
    setRemainFlags(remainFlags + (newMap[rowIndex][colIndex].hasFlag ? -1 : 1));
  };

  const showCounter = (rowIndex: number, colIndex: number) => {
    let counter = 0;
    if (map[rowIndex - 1]?.[colIndex - 1]?.isBomb) counter++;
    if (map[rowIndex - 1]?.[colIndex]?.isBomb) counter++;
    if (map[rowIndex - 1]?.[colIndex + 1]?.isBomb) counter++;
    if (map[rowIndex]?.[colIndex - 1]?.isBomb) counter++;
    if (map[rowIndex]?.[colIndex + 1]?.isBomb) counter++;
    if (map[rowIndex + 1]?.[colIndex - 1]?.isBomb) counter++;
    if (map[rowIndex + 1]?.[colIndex]?.isBomb) counter++;
    if (map[rowIndex + 1]?.[colIndex + 1]?.isBomb) counter++;
    return counter;
  };

  const renderPoint = (rowIndex: number, colIndex: number) => {
    if (map[rowIndex][colIndex].hasRevealed) {
      if (map[rowIndex][colIndex].isBomb) {
        return '💣';
      } else {
        return showCounter(rowIndex, colIndex) || '';
      }
    } else {
      return map[rowIndex][colIndex].hasFlag ? '🚩' : '';
    }
  };

  // check if all cells are revealed
  useEffect(() => {
    if (gameState === 'playing') {
      console.log(map.map((row) => row.map((cell) => cell.isBomb)));
      const hasWon = map.every((row) => row.every((cell) => cell.hasRevealed || cell.isBomb));
      if (hasWon) {
        setGameState('won');
        console.log('WON');
      }
    } else if (gameState === 'lost') {
    }
  }, [map, gameState]);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      {gameState === 'waiting' && (
        <div
          style={{
            display: 'grid',
            gap: '40px',
            placeItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                marginBottom: '10px',
              }}
            >
              Choose difficulty
            </span>
            <div
              style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: 'repeat(3, 1fr)',
              }}
            >
              <button
                style={{
                  backgroundColor: gameDifficulty === Difficulty.EASY ? 'white' : 'black',
                  color: gameDifficulty === Difficulty.EASY ? 'black' : 'white',
                  border: '1px solid white',
                  width: '96px',
                  borderRadius: '5px',
                }}
                onClick={() => setGameDifficulty(Difficulty.EASY)}
              >
                Easy
              </button>
              <button
                style={{
                  backgroundColor: gameDifficulty === Difficulty.MEDIUM ? 'white' : 'black',
                  color: gameDifficulty === Difficulty.MEDIUM ? 'black' : 'white',
                  border: '1px solid white',
                  width: '96px',
                  borderRadius: '5px',
                }}
                onClick={() => setGameDifficulty(Difficulty.MEDIUM)}
              >
                Medium
              </button>
              <button
                style={{
                  backgroundColor: gameDifficulty === Difficulty.HARD ? 'white' : 'black',
                  color: gameDifficulty === Difficulty.HARD ? 'black' : 'white',
                  border: '1px solid white',
                  width: '96px',
                  borderRadius: '5px',
                }}
                onClick={() => setGameDifficulty(Difficulty.HARD)}
              >
                Hard
              </button>
            </div>
          </div>
          <button
            style={{
              backgroundColor: 'black',
              color: 'white',
              border: '1px solid white',
              width: '96px',
              borderRadius: '5px',
            }}
            onClick={onStart}
          >
            Start
          </button>
        </div>
      )}
      {gameState === 'playing' && (
        <div
          style={{
            display: 'grid',
            gap: '40px',
            placeItems: 'center',
          }}
        >
          <div>
            <button onClick={onReset}>Reset</button>
          </div>
          {/* game status */}
          <div
            style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: 'repeat(2, 1fr)',
            }}
          >
            <span>💣 :{totalBombs}</span>
            <span>🚩: {remainFlags}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${map[0]?.length || 0}, 20px)`, gap: '2px' }}>
            {map.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '20px',
                    height: '20px',
                    border: '1px solid black',
                    color: 'black',
                    backgroundColor: cell.hasRevealed ? 'lightgray' : 'gray',
                    cursor: 'pointer',
                  }}
                  onClick={() => onReveal(rowIndex, colIndex)}
                  // set flag on right click or long press on mobile
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onSetFlag(rowIndex, colIndex);
                  }}
                >
                  {renderPoint(rowIndex, colIndex)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {gameState === 'won' && (
        <div style={{ display: 'grid', gap: '40px', placeItems: 'center' }}>
          <div>Won</div>
          <div>
            <button onClick={onReset}>Reset</button>
          </div>
        </div>
      )}
      {gameState === 'lost' && (
        <div style={{ display: 'grid', gap: '40px', placeItems: 'center' }}>
          <div>Lost</div>
          <div>
            <button onClick={onReset}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}
