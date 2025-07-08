import React, { useEffect, useRef, useState } from 'react';

// 恐龙角色组件
const DinoCharacter = ({ isJumping }) => {
  const dinoRef = useRef(null);
  const coinSoundRef = useRef(null);
  const jumpSoundRef = useRef(null);
  const [showEffect, setShowEffect] = useState(false);
  const [effectPosition, setEffectPosition] = useState({ x: 0, y: 0 });
  const audioUnlockedRef = useRef(false);

  // 初始化音效
  useEffect(() => {
    // 预加载金币音效和跳跃音效
    coinSoundRef.current = new Audio('/coin.mp3');
    coinSoundRef.current.volume = 0.5;
    
    jumpSoundRef.current = new Audio('/jump.mp3');
    jumpSoundRef.current.volume = 0.7;
    
    // 尝试预加载音效
    try {
      coinSoundRef.current.load();
      jumpSoundRef.current.load();
    } catch (error) {
      console.error('音效加载失败:', error);
    }
    
    const unlockAudio = () => {
      if (!audioUnlockedRef.current) {
        Promise.all([
          coinSoundRef.current.play().then(() => coinSoundRef.current.pause()),
          jumpSoundRef.current.play().then(() => jumpSoundRef.current.pause())
        ]).then(() => {
          coinSoundRef.current.currentTime = 0;
          jumpSoundRef.current.currentTime = 0;
          audioUnlockedRef.current = true;
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
        }).catch(err => console.log('音效播放失败，请再次点击页面:', err));
      }
    };
    
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // 当跳跃状态变化时添加动画和播放音效
  useEffect(() => {
    if (!dinoRef.current) return;
    
    if (isJumping) {
      // 播放跳跃音效
      if (jumpSoundRef.current && audioUnlockedRef.current) {
        jumpSoundRef.current.currentTime = 0;
        jumpSoundRef.current.play().catch(err => console.log('跳跃音效播放失败:', err));
      }
      
      // 播放金币音效
      if (coinSoundRef.current && audioUnlockedRef.current) {
        coinSoundRef.current.currentTime = 0; // 重置音效，确保每次都能播放
        coinSoundRef.current.play().catch(err => console.log('金币音效播放失败:', err));
      }
      
      // 添加金币效果
      setEffectPosition({
        x: Math.random() * 40 - 20,
        y: -30
      });
      setShowEffect(true);
      
      const effectTimer = setTimeout(() => {
        setShowEffect(false);
      }, 600);
      
      return () => clearTimeout(effectTimer);
    }
  }, [isJumping]);

  const renderShadows = () => {
    if (!isJumping) return null;
    
    return (
      <>
        <div className="dino-shadow" style={{ opacity: 0.2, transform: 'translateY(-10px) scale(0.95)' }}></div>
        <div className="dino-shadow" style={{ opacity: 0.3, transform: 'translateY(-20px) scale(0.9)' }}></div>
        <div className="dino-shadow" style={{ opacity: 0.4, transform: 'translateY(-30px) scale(0.85)' }}></div>
      </>
    );
  };

  return (
    <div className={`dino-character ${isJumping ? 'dino-jumping' : ''}`} ref={dinoRef}>
      {renderShadows()}
      <div className="dino-body"></div>
      {showEffect && (
        <div 
          className="coin-effect"
          style={{ 
            left: `calc(50% + ${effectPosition.x}px)`,
            top: `${effectPosition.y}px`
          }}
        >
          +1
        </div>
      )}
      <div className="dino-shadow-ground"></div>
    </div>
  );
};

export default DinoCharacter; 