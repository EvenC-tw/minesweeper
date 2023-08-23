'use client';

import { LongPressReactEvents, useLongPress } from 'use-long-press';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function Page() {
  type Cell = {
    isBomb: boolean;
    hasRevealed: boolean;
    hasFlag: boolean;
    count: number | null;
  };
  type LongPressContext = {
    context: {
      rowIndex: number;
      colIndex: number;
    };
  };
  type AudioClips = {
    [key: string]: HTMLAudioElement;
  };

  enum Difficulty {
    EASY = 8,
    MEDIUM = 12,
    HARD = 16,
  }

  const GAME_STATES = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    WIN: 'win',
    LOSE: 'lose',
  };

  const [audios, setAudios] = useState<AudioClips>({});
  const [isSound, setIsSound] = useState<boolean>(false);
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const prevGameDifficulty = useRef(Difficulty.EASY);
  const [gameState, setGameState] = useState<string>(GAME_STATES.WAITING);
  const [totalBombs, setTotalBombs] = useState<number>(0);
  const [remainFlags, setRemainFlags] = useState<number>(0);
  const [alertFlag, setAlertFlag] = useState<boolean>(false);
  const [map, setMap] = useState<Cell[][]>([]);
  const [currentEvent, setCurrentEvent] = useState<string | null>(null);

  const playSound = useCallback(
    (soundName: string) => {
      isSound && audios[soundName]?.play();
    },
    [audios, isSound]
  );

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
    playSound('onReset');
    setTimeout(() => {
      setGameState(GAME_STATES.WAITING);
    }, 1000);
  };

  const onStart = () => {
    playSound('onStart');
    setGameState(GAME_STATES.PLAYING);
    generateMap();
  };

  const getAdjacentCells = (rowIndex: number, colIndex: number) => [
    [rowIndex - 1, colIndex - 1],
    [rowIndex - 1, colIndex],
    [rowIndex - 1, colIndex + 1],

    [rowIndex, colIndex - 1],
    [rowIndex, colIndex + 1],

    [rowIndex + 1, colIndex - 1],
    [rowIndex + 1, colIndex],
    [rowIndex + 1, colIndex + 1],
  ];

  const showCounter = (rowIndex: number, colIndex: number) =>
    getAdjacentCells(rowIndex, colIndex).reduce((acc, [rowIndex, colIndex]) => {
      if (map[rowIndex]?.[colIndex]?.isBomb) acc++;
      return acc;
    }, 0);

  const onReveal = (rowIndex: number, colIndex: number) => {
    const newMap = [...map];
    const cell = newMap[rowIndex][colIndex];
    cell.hasRevealed = true;
    cell.count = showCounter(rowIndex, colIndex);

    if (cell.isBomb) {
      playSound('onBomb');
      setTimeout(() => {
        playSound('onLose');
        setGameState(GAME_STATES.LOSE);
        return;
      }, 2000);
    }

    playSound('onReveal');
    if (showCounter(rowIndex, colIndex) === 0) {
      getAdjacentCells(rowIndex, colIndex).forEach(([rowIndex, colIndex]) => {
        if (map[rowIndex]?.[colIndex]?.hasRevealed === false) onReveal(rowIndex, colIndex);
      });
    } else {
      setMap(newMap);
    }
  };

  const bind = useLongPress((event: LongPressReactEvents<Element>, context: unknown) => {
    setCurrentEvent(event.type);
    // if (event.type === 'pointerdown') {
    //   return;
    // }
    const customContext = (context as LongPressContext).context;
    onSetFlag(customContext.rowIndex, customContext.colIndex);
  });

  const onSetFlag = (rowIndex: number, colIndex: number) => {
    if (remainFlags <= 0) {
      setAlertFlag(true);
      playSound('onNoFlags');
      setTimeout(() => {
        setAlertFlag(false);
      }, 500);
      return;
    }
    playSound('onFlag');
    const newMap = [...map];
    newMap[rowIndex][colIndex].hasFlag = !newMap[rowIndex][colIndex].hasFlag;
    setMap(newMap);
    setRemainFlags(remainFlags + (newMap[rowIndex][colIndex].hasFlag ? -1 : 1));
  };

  // check if all cells are revealed
  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING) {
      const hasWin = map.every((row) => row.every((cell) => cell.hasRevealed || cell.isBomb));
      if (hasWin) {
        playSound('onWin');
        setGameState(GAME_STATES.WIN);
      }
    } else if (gameState === GAME_STATES.LOSE) {
    }
  }, [GAME_STATES.LOSE, GAME_STATES.PLAYING, GAME_STATES.WIN, gameState, map, playSound]);

  // play sound when game difficulty changed
  useEffect(() => {
    if (prevGameDifficulty.current !== gameDifficulty) {
      playSound('onSelect');
      prevGameDifficulty.current = gameDifficulty;
    }
  }, [gameDifficulty, playSound]);

  useEffect(() => {
    const audioNames = [
      'onStart',
      'onReveal',
      'onFlag',
      'onBomb',
      'onSelect',
      'onWin',
      'onLose',
      'onReset',
      'onNoFlags',
    ];

    const audios = audioNames.reduce((acc: AudioClips, audioName: string) => {
      const audio = new Audio(`/sfx/${audioName}.mp3`);
      audio.volume = 0.5;
      acc[audioName] = audio;
      return acc;
    }, {} as AudioClips);

    setAudios(audios);
  }, []);

  const renderCell = (rowIndex: number, colIndex: number) => {
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

  const renderResetButton = () => (
    <button className="bg-black text-white border border-white w-24 rounded" onClick={onReset}>
      Reset
    </button>
  );

  const renderSoundButton = () => (
    <div className="relative w-full">
      <button className="w-6 rounded absolute top-4 right-0" onClick={() => setIsSound(!isSound)}>
        {isSound ? '🔊' : '🔇'}
      </button>
    </div>
  );

  const renderWaitingState = () => (
    <div className="grid gap-10 place-items-center">
      {renderSoundButton()}
      <div>
        <span className="block mb-2.5">Choose difficulty</span>
        <div className="grid grid-cols-3 gap-5">
          <button
            className={`border border-white w-24 rounded ${
              gameDifficulty === Difficulty.EASY ? 'bg-white text-black' : 'bg-black text-white'
            }`}
            onClick={() => setGameDifficulty(Difficulty.EASY)}
          >
            Easy
          </button>
          <button
            className={`border border-white w-24 rounded ${
              gameDifficulty === Difficulty.MEDIUM ? 'bg-white text-black' : 'bg-black text-white'
            }`}
            onClick={() => setGameDifficulty(Difficulty.MEDIUM)}
          >
            Medium
          </button>
          <button
            className={`border border-white w-24 rounded ${
              gameDifficulty === Difficulty.HARD ? 'bg-white text-black' : 'bg-black text-white'
            }`}
            onClick={() => setGameDifficulty(Difficulty.HARD)}
          >
            Hard
          </button>
        </div>
      </div>
      <button className="bg-black text-white border border-white w-24 rounded" onClick={onStart}>
        Start
      </button>
    </div>
  );

  const renderPlayingState = () => {
    const gridTemplateColumns = `repeat(${map[0]?.length || 0}, 25px)`;
    return (
      <div className="grid gap-10 place-items-center">
        {renderSoundButton()}
        <div>{renderResetButton()}</div>
        <div className="grid grid-cols-2 gap-5">
          <span>💣 :{totalBombs}</span>
          <span>🚩: {remainFlags}</span>
        </div>
        <span className={`${alertFlag ? 'bg-red-500' : ''} transition-all duration-100`}>
          tip: long press to set 🚩
        </span>
        <div
          style={{
            gridTemplateColumns,
          }}
          className="grid gap-0.5"
        >
          {map.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`flex justify-center items-center w-6 h-6 border border-black text-black ${
                  cell.hasRevealed ? 'bg-gray-300' : 'bg-gray-500'
                }`}
                onClick={(e) => {
                  setCurrentEvent(e.type);
                  if (currentEvent !== 'pointerdown') {
                    onReveal(rowIndex, colIndex);
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                {...bind({ rowIndex, colIndex })}
              >
                {renderCell(rowIndex, colIndex)}
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderWinState = () => (
    <div className="grid gap-10 place-items-center">
      {renderSoundButton()}
      <div>Win</div>
      <div>{renderResetButton()}</div>
    </div>
  );

  const renderLoseState = () => (
    <div className="grid gap-10 place-items-center">
      {renderSoundButton()}
      <div>Lose</div>
      <div>{renderResetButton()}</div>
    </div>
  );

  return (
    <div className="select-none flex justify-center items-center h-screen">
      {gameState === GAME_STATES.WAITING && renderWaitingState()}
      {gameState === GAME_STATES.PLAYING && renderPlayingState()}
      {gameState === GAME_STATES.WIN && renderWinState()}
      {gameState === GAME_STATES.LOSE && renderLoseState()}
    </div>
  );
}
