import { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { sendPoseData } from '../services/PoseSocket';

function PoseTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); // 新增：用于给用户的视觉提示

  const lastSentTime = useRef(0);

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
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(async (results) => {
      if (!canvasRef.current) return;
      const canvasCtx = canvasRef.current.getContext('2d');
      const { width, height } = canvasRef.current;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);

      // --- 绘制背景 (保持原逻辑) ---
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
        const L = results.poseLandmarks;

        // --- 核心校验逻辑：守门员功能 ---
        // 核心点索引：11,12(肩), 23,24(胯), 25,26(膝), 27,28(踝)
        const coreIndices = [11, 12, 23, 24, 25, 26, 27, 28];
        const isBodyVisible = coreIndices.every(idx => {
          const pt = L[idx];
          // 1. 必须有数据 2. 可信度高于 0.6 3. Y 坐标在 0-1 之间（没出界）
          return pt && pt.visibility > 0.6 && pt.y >= 0 && pt.y <= 1;
        });

        // --- 角度计算 ---
        const kneeVisible  = L[26].visibility > 0.75 && L[26].y < 0.95;
        const ankleVisible = L[28].visibility > 0.75 && L[28].y < 0.95;
        const curAngle = (kneeVisible && ankleVisible)
          ? calculateAngle(L[24], L[26], L[28])
          : null;
        setAngle(curAngle);

        // --- 数据发送控制 ---
        const now = Date.now();
        if (now - lastSentTime.current > 100) {
          lastSentTime.current = now;

          if (isBodyVisible) {
            setErrorMessage(""); // 数据合格，清除警告
            const payload = {
              session_id: "user_123_test",
              fps: 30,
              timestamp: now,
              landmarks: L.map((lm, index) => ({
                id: index,
                x: lm.x,
                y: lm.y,
                z: lm.z,
                visibility: lm.visibility
              }))
            };

            sendPoseData(payload).then(response => {
              if (response) {
                // 后端处理后的结果可以在这里处理
              }
            });
          } else {
            // 数据不合格，不发给后端，并给用户提示
            setErrorMessage("PLEASE STEP BACK: FULL BODY NOT IN VIEW");
          }
        }

        // --- 绘制骨骼连线 ---
        const CONNECTIONS = [
          [11, 12], [11, 23], [12, 24], [23, 24],
          [23, 25], [25, 27], [24, 26], [26, 28],
          [11, 13], [13, 15], [12, 14], [14, 16]
        ];

        canvasCtx.strokeStyle = isBodyVisible ? ((curAngle < 100) ? "#FF4D4D" : "#C8F060") : "#666";
        canvasCtx.lineWidth = 5;

        CONNECTIONS.forEach(([startIdx, endIdx]) => {
          if (L[startIdx] && L[endIdx]) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(L[startIdx].x * width, L[startIdx].y * height);
            canvasCtx.lineTo(L[endIdx].x * width, L[endIdx].y * height);
            canvasCtx.stroke();
          }
        });

        // --- 绘制节点 ---
        L.forEach((pt, index) => {
          if (index > 10) {
            canvasCtx.beginPath();
            canvasCtx.arc(pt.x * width, pt.y * height, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = pt.visibility > 0.6 ? "white" : "red"; // 看不清的点显示红色
            canvasCtx.fill();
          }
        });
      }
      canvasCtx.restore();
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => { await pose.send({ image: videoRef.current }); },
      width: 1280, height: 720
    });
    camera.start();

    return () => camera.stop();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', textAlign: 'center', background: '#000' }}>
      {/* 提示信息栏 */}
      <div style={{
        position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
        background: errorMessage ? 'rgba(255, 77, 77, 0.9)' : 'rgba(0,0,0,0.8)',
        padding: '10px 24px', borderRadius: '50px',
        border: `2px solid ${errorMessage ? '#FF4D4D' : '#C8F060'}`,
        color: errorMessage ? '#FFF' : '#C8F060',
        fontSize: '18px', fontWeight: '800', zIndex: 10, whiteSpace: 'nowrap',
        transition: 'all 0.3s ease'
      }}>
        {errorMessage || (angle !== null ? `SQUAT ANGLE: ${angle}°` : "SCANNING BODY...")}
      </div>

      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ transform: 'scaleX(-1)', borderRadius: '20px', boxShadow: '0 0 30px rgba(200, 240, 96, 0.2)', maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}

export default PoseTracker;