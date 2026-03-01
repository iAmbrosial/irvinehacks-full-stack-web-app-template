import { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { sendPoseData } from '../services/PoseSocket';

function PoseTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

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

      // --- 1. 背景与人体遮罩绘制 ---
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

        // --- 2. 自适应校验逻辑 ---
        // 只要肩膀和胯在，就认为是有意义的追踪
        const torsoVisible = [11, 12, 23, 24].every(idx =>
          L[idx] && L[idx].visibility > 0.5 && L[idx].y >= 0 && L[idx].y <= 1.1
        );

        // 检查下半身是否完整（用于给用户提示）
        const lowerBodyVisible = [25, 26, 27, 28].every(idx =>
          L[idx] && L[idx].visibility > 0.5 && L[idx].y <= 1.0
        );

        // --- 3. 角度计算 (自适应) ---
        let curAngle = null;
        if (L[24] && L[26] && L[28] && L[28].visibility > 0.5) {
          curAngle = calculateAngle(L[24], L[26], L[28]); // 胯-膝-踝
        } else if (L[12] && L[24] && L[26] && L[26].visibility > 0.5) {
          curAngle = calculateAngle(L[12], L[24], L[26]); // 肩-胯-膝
        }
        setAngle(curAngle);

        // --- 4. 数据发送逻辑 ---
        const now = Date.now();
        if (now - lastSentTime.current > 100) {
          lastSentTime.current = now;
          if (torsoVisible) {
            sendPoseData({
              session_id: "user_123_test",
              landmarks: L.map((lm, index) => ({
                id: index, x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility
              }))
            });
            setErrorMessage(lowerBodyVisible ? "" : "PARTIAL VIEW: Lower body not clear");
          } else {
            setErrorMessage("SCANNING... PLEASE SHOW YOUR TORSO");
          }
        }

        // --- 5. 绘制骨骼连线 (包含手臂) ---
        const CONNECTIONS = [
          [11, 12], // 肩膀
          [11, 23], [12, 24], [23, 24], // 躯干
          [23, 25], [25, 27], [24, 26], [26, 28], // 双腿
          [11, 13], [13, 15], // 左臂
          [12, 14], [14, 16]  // 右臂
        ];

        canvasCtx.strokeStyle = torsoVisible ? "#C8F060" : "#FF4D4D";
        canvasCtx.lineWidth = 4;
        canvasCtx.lineCap = "round";

        CONNECTIONS.forEach(([s, e]) => {
          if (L[s] && L[e] && L[s].visibility > 0.5 && L[e].visibility > 0.5) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(L[s].x * width, L[s].y * height);
            canvasCtx.lineTo(L[e].x * width, L[e].y * height);
            canvasCtx.stroke();
          }
        });

        // --- 6. 绘制关键点 ---
        L.forEach((pt, index) => {
          // 只绘制身体点 (11-32)，跳过脸部
          if (index >= 11) {
            canvasCtx.beginPath();
            canvasCtx.arc(pt.x * width, pt.y * height, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = pt.visibility > 0.5 ? "white" : "rgba(255, 255, 255, 0.3)";
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
    <div style={{ position: 'relative', width: '100%', textAlign: 'center', background: '#000', borderRadius: '20px', overflow: 'hidden' }}>
      {/* UI 提示栏 */}
      <div style={{
        position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)',
        background: errorMessage.includes("PARTIAL") ? 'rgba(255, 165, 0, 0.85)' :
                    errorMessage ? 'rgba(255, 77, 77, 0.85)' : 'rgba(20, 20, 20, 0.8)',
        padding: '12px 28px', borderRadius: '50px',
        border: `2px solid ${errorMessage.includes("PARTIAL") ? '#FFA500' : errorMessage ? '#FF4D4D' : '#C8F060'}`,
        color: '#FFF', fontSize: '18px', fontWeight: '800', zIndex: 10, transition: 'all 0.3s'
      }}>
        {errorMessage || (angle ? `ANGLE: ${angle}°` : "READY")}
      </div>

      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ transform: 'scaleX(-1)', width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}

export default PoseTracker;