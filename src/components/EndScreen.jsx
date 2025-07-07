import React from 'react';

const EndScreen = ({ onRestart }) => {
  return (
    <div className="end-screen">
      <h1 className="end-message">恭喜你完成了100次跳跃！</h1>
      <p>真棒！你和小恐龙一起成功完成了挑战！</p>
      <button className="button" onClick={onRestart}>再玩一次</button>
    </div>
  );
};

export default EndScreen; 