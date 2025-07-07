import React from 'react';

const StartScreen = ({ onStart }) => {
  return (
    <div className="interface">
      <h1 className="title">恐龙跳绳</h1>
      <p>站在摄像头前，准备好开始跳绳吧！</p>
      <p>跳够100下就能过关哦！</p>
      <button className="button" onClick={onStart}>开始游戏</button>
    </div>
  );
};

export default StartScreen; 