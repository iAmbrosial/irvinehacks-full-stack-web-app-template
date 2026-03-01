import { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
// 1. 导入你刚才写的发送函数
import { sendPoseData } from '../services/PoseSocket';

function PoseTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(null);

  // 2. 增加一个 Ref 来记录上次发送数据的时间，控制频率
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

    // 3. 将回调函数改为 async，以便等待后端返回结果（可选）
    pose.onResults(async (results) => {
      if (!canvasRef.current) return;
      const canvasCtx = canvasRef.current.getContext('2d');
      const { width, height } = canvasRef.current;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);

      // --- 绘制人体层 (保持你原来的逻辑) ---
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

        // --- 角度计算 ---
        const kneeVisible  = L[26].visibility > 0.75 && L[26].y < 0.95;
        const ankleVisible = L[28].visibility > 0.75 && L[28].y < 0.95;
        const curAngle = (kneeVisible && ankleVisible)
          ? calculateAngle(L[24], L[26], L[28])
          : null;
        setAngle(curAngle);

        // --- 4. 核心改动：打包并发送数据给后端 ---
        const now = Date.now();
        // 每 100ms 发送一次，防止网络拥塞
        if (now - lastSentTime.current > 100) {
          lastSentTime.current = now;

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

          // 异步发送，不阻塞画面渲染
          sendPoseData(payload).then(response => {
            if (response) {
              // 如果后端返回了 AI 纠错建议，可以在这里处理
              // console.log("AI反馈:", response);
            }
          });
        }

        // --- 绘制骨骼连线 (保持你原来的逻辑) ---
        const CONNECTIONS = [
          [11, 12], [11, 23], [12, 24], [23, 24],
          [23, 25], [25, 27], [24, 26], [26, 28],
          [11, 13], [13, 15], [12, 14], [14, 16]
        ];

        canvasCtx.strokeStyle = (curAngle < 100) ? "#FF4D4D" : "#C8F060";
        canvasCtx.lineWidth = 5;

        CONNECTIONS.forEach(([startIdx, endIdx]) => {
          if (L[startIdx] && L[endIdx]) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(L[startIdx].x * width, L[startIdx].y * height);
            canvasCtx.lineTo(L[endIdx].x * width, L[endIdx].y * height);
            canvasCtx.stroke();
          }
        });

        // --- 绘制白色关节点 ---
        L.forEach((pt, index) => {
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

    const camera = new Camera(videoRef.current, {
      onFrame: async () => { await pose.send({ image: videoRef.current }); },
      width: 1280, height: 720
    });
    camera.start();

    return () => camera.stop();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', textAlign: 'center', background: '#000' }}>
      <div style={{
        position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)', padding: '10px 24px', borderRadius: '50px',
        border: '2px solid #C8F060', color: '#C8F060', fontSize: '20px', fontWeight: '800',
        zIndex: 10, whiteSpace: 'nowrap',
      }}>
        {angle !== null ? `SQUAT ANGLE: ${angle}°` : "SCANNING BODY..."}
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