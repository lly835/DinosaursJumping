import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import StartScreen from './components/StartScreen';
import Game from './components/Game';
import EndScreen from './components/EndScreen';

function App() {
  // 游戏状态
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'end'
  const [jumpCount, setJumpCount] = useState(0);
  const [scoreElements, setScoreElements] = useState([]);
  const scoreIdRef = useRef(0);

  // 处理跳跃检测
  const handleJumpDetected = () => {
    // 更新跳跃计数
    setJumpCount(prevCount => {
      const newCount = prevCount + 1;
      
      // 如果达到100次跳跃，结束游戏
      if (newCount >= 100) {
        setGameState('end');
      }
      
      return newCount;
    });

    // 添加"+1"视觉效果
    const id = scoreIdRef.current++;
    const randomX = Math.floor(Math.random() * 200) + 100; // 随机X位置
    
    setScoreElements(prev => [
      ...prev, 
      { id, x: randomX, y: 300 }
    ]);
    
    // 1秒后移除视觉效果
    setTimeout(() => {
      setScoreElements(prev => prev.filter(item => item.id !== id));
    }, 1000);
  };

  // 开始游戏
  const handleStart = () => {
    setGameState('playing');
    setJumpCount(0);
  };

  // 重新开始游戏
  const handleRestart = () => {
    setGameState('start');
    setJumpCount(0);
  };

  return (
    <div className="app">
      {gameState === 'start' && <StartScreen onStart={handleStart} />}
      
      {gameState === 'playing' && (
        <>
          <Game onJumpDetected={handleJumpDetected} jumpCount={jumpCount} />
          <div className="counter">跳跃: {jumpCount} / 100</div>
          
          {/* 分数增加的视觉效果 */}
          {scoreElements.map(element => (
            <div 
              key={element.id}
              className="score-increment"
              style={{
                left: `${element.x}px`,
                top: `${element.y}px`
              }}
            >
              +1
            </div>
          ))}
        </>
      )}
      
      {gameState === 'end' && <EndScreen onRestart={handleRestart} />}
    </div>
  );
}

export default App; 