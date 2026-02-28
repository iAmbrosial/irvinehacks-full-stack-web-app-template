import { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

function PoseTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(null); // 初始设为 null，方便判断是否显示

  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return Math.round(angle);
  };

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
      if (!canvasRef.current) return;
      const canvasCtx = canvasRef.current.getContext('2d');
      const { width, height } = canvasRef.current;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);

      if (results.segmentationMask) {
        canvasCtx.drawImage(results.segmentationMask, 0, 0, width, height);
        canvasCtx.globalCompositeOperation = 'source-in';
        canvasCtx.fillStyle = 'rgba(0, 255, 127, 0.3)';
        canvasCtx.fillRect(0, 0, width, height);
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, width, height);
        canvasCtx.globalCompositeOperation = 'source-over';
      } else {
        canvasCtx.drawImage(results.image, 0, 0, width, height);
      }

      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;
        const hip = landmarks[24];
        const knee = landmarks[26];
        const ankle = landmarks[28];

        // --- 核心改进：双重逻辑过滤虚假点 ---
        // 1. 确信度必须大于 0.75
        // 2. 坐标不能贴在画面最底部 (y < 0.95)
        const isLegVisible = knee.visibility > 0.75 && knee.y < 0.95 &&
                             ankle.visibility > 0.75 && ankle.y < 0.95;

        let currentAngle = null;
        if (isLegVisible) {
          currentAngle = calculateAngle(hip, knee, ankle);
          setAngle(currentAngle);
        } else {
          setAngle(null); // 看不见腿时，清除角度显示
        }

        const CONNECTIONS = [
          [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
          [11, 23], [12, 24], [23, 24],
          [23, 25], [25, 27], [24, 26], [26, 28]
        ];

        // 绘线：仅在检测到有效角度且达标时变红
        canvasCtx.strokeStyle = (currentAngle && currentAngle < 100) ? "#FF0000" : "#00FF00";
        canvasCtx.lineWidth = 5;

        CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];
          if (start && end) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(start.x * width, start.y * height);
            canvasCtx.lineTo(end.x * width, end.y * height);
            canvasCtx.stroke();
          }
        });

        landmarks.forEach((pt, index) => {
          if (index > 10) {
            canvasCtx.beginPath();
            canvasCtx.arc(pt.x * width, pt.y * height, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = "white";
            canvasCtx.fill();
          }
        });
      }
      canvasCtx.restore();
    });

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
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <div style={{
        position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '20px',
        color: angle ? (angle < 100 ? '#ff4d4d' : '#00ffcc') : '#888',
        fontWeight: 'bold', fontSize: '24px', zIndex: 10, border: '2px solid'
      }}>
        {angle ? `KNEE ANGLE: ${angle}°` : "WAITING FOR FULL BODY..."}
        { (angle && angle < 100) ? ' ✓ GOOD' : ''}
      </div>

      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{
          transform: 'scaleX(-1)',
          border: '4px solid #00ffcc',
          borderRadius: '15px',
          boxShadow: '0 0 20px rgba(0, 255, 204, 0.4)'
        }}
      />
      <div style={{ marginTop: '10px', color: '#00ffcc', letterSpacing: '2px' }}>
        AI VISION SYSTEM ACTIVE // BIOMETRIC SCANNING...
      </div>
    </div>
  );
}

export default PoseTracker;