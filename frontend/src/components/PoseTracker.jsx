import { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

function PoseTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(null);

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
      enableSegmentation: true, // 🟢 必须开启：人体分割功能
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

      // --- 1. 绘制绿色透明人体层 (Segmentation Mask) ---
      if (results.segmentationMask) {
        canvasCtx.drawImage(results.segmentationMask, 0, 0, width, height);
        // 关键：source-in 模式只在有人的地方上色
        canvasCtx.globalCompositeOperation = 'source-in';
        canvasCtx.fillStyle = 'rgba(0, 255, 127, 0.3)'; // 绿色半透明覆盖层
        canvasCtx.fillRect(0, 0, width, height);

        // 恢复背景图
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, width, height);
        canvasCtx.globalCompositeOperation = 'source-over';
      } else {
        canvasCtx.drawImage(results.image, 0, 0, width, height);
      }

      if (results.poseLandmarks) {
        const L = results.poseLandmarks;

        // Only calculate angle when the right knee and ankle are clearly visible.
        // Without this check, low-confidence ghost points produce nonsense angles.
        // Thresholds: visibility > 0.75 (confident detection) and y < 0.95
        // (landmark not clipped at the very bottom edge of the frame).
        const kneeVisible  = L[26].visibility > 0.75 && L[26].y < 0.95;
        const ankleVisible = L[28].visibility > 0.75 && L[28].y < 0.95;
        const curAngle = (kneeVisible && ankleVisible)
          ? calculateAngle(L[24], L[26], L[28])
          : null;
        setAngle(curAngle);

        // --- 2. 绘制全套骨骼连线 ---
        const CONNECTIONS = [
          [11, 12], [11, 23], [12, 24], [23, 24], // 躯干
          [23, 25], [25, 27], [24, 26], [26, 28], // 腿部
          [11, 13], [13, 15], [12, 14], [14, 16]  // 手臂
        ];

        // 角度小于 100 度变红（深蹲达标提示）
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

        // --- 3. 绘制白色关节点 ---
        L.forEach((pt, index) => {
          if (index > 10) { // 跳过面部点
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
    /*
      position: relative so the angle overlay (position: absolute) anchors
      to this container instead of the viewport.
      width: 100% lets the parent (TrackerPage) control the display size.
    */
    <div style={{ position: 'relative', width: '100%', textAlign: 'center', background: '#000' }}>
      {/* Angle readout — floats over the top-center of the canvas */}
      <div style={{
        position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)', padding: '10px 24px', borderRadius: '50px',
        border: '2px solid #C8F060', color: '#C8F060', fontSize: '20px', fontWeight: '800',
        zIndex: 10, whiteSpace: 'nowrap',
      }}>
        {angle !== null ? `SQUAT ANGLE: ${angle}°` : "SCANNING BODY..."}
      </div>

      <video ref={videoRef} style={{ display: 'none' }} />
      {/*
        width/height attributes = internal pixel buffer (must stay at 640×480).
        maxWidth/height:auto = CSS display size, scales down on narrow screens.
      */}
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