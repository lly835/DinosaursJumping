import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// 配置TensorFlow.js
tf.setBackend('webgl');
tf.env().set('WEBGL_CPU_FORWARD', false);
tf.env().set('WEBGL_PACK', true);
tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
tf.env().set('WEBGL_RENDER_FLOAT32_CAPABLE', true);
tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);

import DinoCharacter from './DinoCharacter';

const Game = ({ onJumpDetected, jumpCount }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isJumping, setIsJumping] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [detectionQuality, setDetectionQuality] = useState('等待检测...');
  const [showCamera, setShowCamera] = useState(true);
  
  // 用于跟踪姿态检测和跳跃状态
  const detectorRef = useRef(null);
  const jumpCooldown = useRef(false);
  const jumpTimer = useRef(null);
  const lastPoseRef = useRef(null);
  const movementScoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const processingFrameRef = useRef(false);
  const detectionHistoryRef = useRef([]);  // 存储最近的检测结果
  const stableCountRef = useRef(0);        // 稳定检测计数
  const lastMovementTimeRef = useRef(0);   // 上次检测到动作的时间

  // 初始化TensorFlow和摄像头
  useEffect(() => {
    const initCamera = async () => {
      try {
        // 加载TensorFlow模型
        await tf.ready();
        
        // 创建姿态检测器 - 使用MoveNet模型，对小孩检测更友好
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.1  // 降低最低姿势分数阈值，提高检测灵敏度
        };
        
        detectorRef.current = await poseDetection.createDetector(model, detectorConfig);
        
        // 获取摄像头访问权限
        const constraints = {
          video: {
            width: 320,
            height: 240,
            facingMode: 'user',
            frameRate: { ideal: 15, max: 20 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraReady(true);
        }
      } catch (error) {
        console.error('初始化摄像头或模型失败:', error);
        setErrorMessage('无法访问摄像头，请确保已授予权限并刷新页面。');
      }
    };

    initCamera();

    // 组件卸载时清理资源
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (jumpTimer.current) {
        clearTimeout(jumpTimer.current);
      }
    };
  }, []);

  // 简化的检测质量评估 - 对小孩更友好
  const evaluateDetectionQuality = (pose) => {
    if (!pose || !pose.keypoints) return 0;
    
    // 只关注几个关键点：鼻子、眼睛和肩膀
    const importantPoints = ['nose', 'left_eye', 'right_eye', 'left_shoulder', 'right_shoulder'];
    let visiblePoints = 0;
    
    importantPoints.forEach(pointName => {
      const point = pose.keypoints.find(kp => kp.name === pointName);
      if (point && point.score > 0.1) {  // 降低阈值
        visiblePoints++;
      }
    });
    
    // 只要能看到2个以上关键点就算可以
    return visiblePoints >= 2 ? 0.5 : 0;
  };

  // 检测任何明显的动作 - 不限于垂直跳跃
  const detectAnyMovement = (currentPose, previousPoses) => {
    if (!currentPose || previousPoses.length < 2) return false;
    
    // 获取任何可见的关键点
    const getVisibleKeypoints = (pose) => {
      return pose.keypoints.filter(kp => kp.score > 0.1);
    };
    
    const currentKeypoints = getVisibleKeypoints(currentPose);
    if (currentKeypoints.length === 0) return false;
    
    // 计算与前一帧的平均移动距离
    const previousPose = previousPoses[previousPoses.length - 1];
    const previousKeypoints = getVisibleKeypoints(previousPose);
    
    if (previousKeypoints.length === 0) return false;
    
    // 计算任何可见点的移动
    let totalMovement = 0;
    let pointsCompared = 0;
    
    currentKeypoints.forEach(currentKp => {
      const prevKp = previousKeypoints.find(p => p.name === currentKp.name);
      if (prevKp) {
        const dx = currentKp.x - prevKp.x;
        const dy = currentKp.y - prevKp.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        totalMovement += distance;
        pointsCompared++;
      }
    });
    
    if (pointsCompared === 0) return false;
    
    // 如果平均移动超过阈值，认为有动作
    const avgMovement = totalMovement / pointsCompared;
    return avgMovement > 8;  // 降低阈值，更容易触发
  };

  // 姿态检测循环
  useEffect(() => {
    let animationFrameId;
    
    // 创建一个简单的内存管理器，定期清理不需要的数据
    const memoryCleanupInterval = setInterval(() => {
      // 清理TensorFlow内存
      if (tf.memory().numTensors > 50) {
        tf.disposeVariables();
        tf.engine().endScope();
        tf.engine().startScope();
        console.log('已清理TensorFlow内存');
      }
    }, 10000); // 每10秒检查一次
    
    const detectPose = async () => {
      if (detectorRef.current && videoRef.current && cameraReady && videoRef.current.readyState === 4) {
        try {
          // 增加帧计数器
          frameCountRef.current++;
          
          // 每3帧处理一次，减轻CPU负担
          if (frameCountRef.current % 3 !== 0) {
            animationFrameId = requestAnimationFrame(detectPose);
            return;
          }
          
          // 防止并发处理
          if (processingFrameRef.current) {
            animationFrameId = requestAnimationFrame(detectPose);
            return;
          }
          
          processingFrameRef.current = true;
          
          // 执行姿态检测
          const poses = await detectorRef.current.estimatePoses(videoRef.current);
          
          if (poses && poses.length > 0) {
            const pose = poses[0];
            
            // 评估检测质量
            const quality = evaluateDetectionQuality(pose);
            
            // 更新检测历史
            detectionHistoryRef.current.push(pose);
            if (detectionHistoryRef.current.length > 5) {  // 减少历史帧数
              detectionHistoryRef.current.shift();
            }
            
            // 根据检测质量更新状态提示
            if (quality > 0) {
              setDetectionQuality('检测正常');
              stableCountRef.current++;
              
              // 检测任何动作
              if (!jumpCooldown.current && detectionHistoryRef.current.length >= 2) {
                const hasMovement = detectAnyMovement(pose, detectionHistoryRef.current.slice(0, -1));
                
                // 如果检测到动作，且距离上次动作超过300ms
                const now = Date.now();
                if (hasMovement && (now - lastMovementTimeRef.current > 300)) {
                  lastMovementTimeRef.current = now;
                  
                  // 触发跳跃
                  setIsJumping(true);
                  onJumpDetected();
                  
                  // 设置跳跃冷却期
                  jumpCooldown.current = true;
                  
                  // 0.5秒后重置跳跃状态，缩短动画时间以便连续跳跃
                  jumpTimer.current = setTimeout(() => {
                    setIsJumping(false);
                    
                    // 跳跃冷却期
                    setTimeout(() => {
                      jumpCooldown.current = false;
                    }, 300);  // 进一步缩短冷却时间，更容易连续跳跃
                  }, 500);
                }
              }
            } else {
              setDetectionQuality('检测不佳，请确保面对摄像头');
              stableCountRef.current = 0;
            }
            
            // 可选：在画布上绘制骨架
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              drawKeypoints(pose.keypoints, ctx);
              drawConnectors(pose.keypoints, ctx);
            }
          } else {
            setDetectionQuality('未检测到人体，请确保在画面中');
            stableCountRef.current = 0;
          }
          
          processingFrameRef.current = false;
        } catch (error) {
          console.error('姿态检测错误:', error);
          processingFrameRef.current = false;
        }
      }
      
      // 循环检测
      animationFrameId = requestAnimationFrame(detectPose);
    };
    
    if (cameraReady) {
      detectPose();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearInterval(memoryCleanupInterval);
      // 确保清理TensorFlow资源
      if (tf.memory().numTensors > 0) {
        tf.disposeVariables();
      }
    };
  }, [cameraReady, onJumpDetected, isJumping]);

  // 绘制骨架关键点
  const drawKeypoints = (keypoints, ctx) => {
    keypoints.forEach(keypoint => {
      if (keypoint.score > 0.1) {  // 降低阈值
        const { x, y } = keypoint;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    });
  };

  // 绘制骨架连接线
  const drawConnectors = (keypoints, ctx) => {
    // 定义要连接的点对
    const connections = [
      ['nose', 'left_eye'], ['nose', 'right_eye'],
      ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
      ['nose', 'left_shoulder'], ['nose', 'right_shoulder'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
      ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
      ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
      ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
    ];
    
    connections.forEach(([p1Name, p2Name]) => {
      const p1 = keypoints.find(kp => kp.name === p1Name);
      const p2 = keypoints.find(kp => kp.name === p2Name);
      
      if (p1 && p2 && p1.score > 0.1 && p2.score > 0.1) {  // 降低阈值
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  // 切换摄像头窗口显示/隐藏
  const toggleCameraDisplay = () => {
    setShowCamera(prev => !prev);
  };

  return (
    <div className="game-container">
      {errorMessage ? (
        <div className="error-message">{errorMessage}</div>
      ) : (
        <>
          <div className="game-scene">
            <DinoCharacter isJumping={isJumping} />
            <div className="detection-status">
              {detectionQuality}
            </div>
            <button 
              className="toggle-camera-button"
              onClick={toggleCameraDisplay}
            >
              {showCamera ? '隐藏摄像头' : '显示摄像头'}
            </button>
          </div>
          <div className={`camera-container ${showCamera ? '' : 'hidden'}`}>
            <video 
              ref={videoRef}
              className="camera-preview"
              playsInline
              muted
            />
            <canvas 
              ref={canvasRef}
              className="pose-canvas"
              width="320"
              height="240"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Game; 