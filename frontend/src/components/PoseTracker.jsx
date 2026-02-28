import { useEffect, useRef } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

function PoseTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // 1. 初始化 MediaPipe Pose 引擎
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // 2. 拿到检测结果后的画图逻辑
    pose.onResults((results) => {
      if (!canvasRef.current) return;
      const canvasCtx = canvasRef.current.getContext('2d');
      const { width, height } = canvasRef.current;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);

      // 绘制原始视频
      canvasCtx.drawImage(results.image, 0, 0, width, height);

      // 如果有人，画一个红色鼻子测试
      if (results.poseLandmarks) {
        const nose = results.poseLandmarks[0];
        canvasCtx.beginPath();
        canvasCtx.arc(nose.x * width, nose.y * height, 10, 0, 2 * Math.PI);
        canvasCtx.fillStyle = "red";
        canvasCtx.fill();
      }
      canvasCtx.restore();
    });

    // 3. 启动摄像头
    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480
      });
      camera.start();
    }
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ transform: 'scaleX(-1)', border: '2px solid cyan', borderRadius: '10px' }}
      />
      <p style={{color: 'cyan'}}>AI Vision System Active</p>
    </div>
  );
}

export default PoseTracker;