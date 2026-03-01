import { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { sendPoseData } from '../services/PoseSocket';

/*
PoseTracker — live webcam + MediaPipe pose overlay.

Props:
  exercise      (string) - exercise ID sent to backend, e.g. "squat". Default "squat".
  sessionId     (string) - unique ID for this session. Used to key the backend's
                           SquatDetector instance so reps accumulate correctly.
  onRepComplete (fn)     - called whenever the backend signals a rep was completed.
                           Receives: { repCount, formIssues }
                           TrackerPage uses this to build the post-session WorkoutSummary.

Architecture note:
  PoseTracker owns the full webcam pipeline (hidden <video> → MediaPipe Camera →
  pose.onResults → canvas draw). The Camera utility from @mediapipe/camera_utils
  handles getUserMedia and the frame loop internally.

  Canvas has fixed internal dimensions (640×480) for coordinate math. CSS
  maxWidth:100%/height:auto scales it responsively without affecting coordinates.
*/
function PoseTracker({ exercise = "squat", sessionId = "user_session", onRepComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);       // kept so we can stop() on unmount
  const lastSentTime = useRef(0);       // throttle: only send every 100ms

  const [angle, setAngle] = useState(null);
  const [liveReps, setLiveReps] = useState(0);
  const [liveFeedback, setLiveFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // 新增：用于给用户的视觉提示

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
      minTrackingConfidence: 0.5,
    });

    pose.onResults(async (results) => {
      if (!canvasRef.current) return;
      const canvasCtx = canvasRef.current.getContext('2d');
      const { width, height } = canvasRef.current;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);

      // Draw segmentation mask (green silhouette) over raw webcam image
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

        // 核心点索引：11,12(肩), 23,24(胯), 25,26(膝), 27,28(踝)
        const coreIndices = [11, 12, 23, 24, 25, 26, 27, 28];
        const isBodyVisible = coreIndices.every(idx => {
          const pt = L[idx];
          // 1. 必须有数据 2. 可信度高于 0.6 3. Y 坐标在 0-1 之间（没出界）
          return pt && pt.visibility > 0.6 && pt.y >= 0 && pt.y <= 1;
        });

        // Local angle display (right knee) — for the visual overlay
        const kneeVisible  = L[26].visibility > 0.75 && L[26].y < 0.95;
        const ankleVisible = L[28].visibility > 0.75 && L[28].y < 0.95;
        const curAngle = (kneeVisible && ankleVisible)
          ? calculateAngle(L[24], L[26], L[28])
          : null;
        setAngle(curAngle);

        // Send to backend every 100ms (≈10 Hz) — fast enough for rep counting,
        // slow enough not to saturate the server.
        const now = Date.now();
        // 每 100ms 发送一次，防止网络拥塞
        if (now - lastSentTime.current > 100) {
          lastSentTime.current = now;

          if (isBodyVisible) {
            setErrorMessage(""); // 数据合格，清除警告
            const payload = {
              session_id: sessionId,
              fps: 30,
              timestamp: now,
              exercise: exercise,
            landmarks: L.map((lm, index) => ({
                id: index,
                name: "",       // MediaPipe JS doesn't expose landmark names
              x: lm.x,
                y: lm.y,
                z: lm.z,
                visibility: lm.visibility,
              })),
            };

          sendPoseData(payload).then((response) => {
            if (!response) return;

            // Update live rep count and feedback cue from backend response
            setLiveReps(response.reps ?? 0);
            if (response.realtime_feedback) {
              setLiveFeedback(response.realtime_feedback);
            }

            // When a rep is completed, notify parent with rep count + form issues
            // so TrackerPage can accumulate data for the post-session WorkoutSummary
            if (response.rep_completed && onRepComplete) {
              onRepComplete({
                repCount: response.reps,
                formIssues: response.form_issues ?? [],
              });
            }
          });
        }

        // Draw skeleton connections — red when deep in squat (<100°), green otherwise
        const CONNECTIONS = [
          [11, 12], [11, 23], [12, 24], [23, 24],
          [23, 25], [25, 27], [24, 26], [26, 28],
          [11, 13], [13, 15], [12, 14], [14, 16],
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

        // Draw joint dots (skip face landmarks 0–10)
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
      width: 1280,
      height: 720,
    });
    cameraRef.current = camera;
    camera.start();

    return () => camera.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Dependencies intentionally empty: re-creating Camera/Pose on every render
  // would issue a new getUserMedia request. exercise/sessionId/onRepComplete
  // are stable refs for the duration of a session.

  return (
    <div style={{ position: 'relative', width: '100%', textAlign: 'center', background: '#000' }}>
      {/* Angle + rep count overlay */}
      <div style={{
        position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
        background: errorMessage ? 'rgba(255, 77, 77, 0.9)' : 'rgba(0,0,0,0.8)',
        padding: '10px 24px', borderRadius: '50px',
        border: `2px solid ${errorMessage ? '#FF4D4D' : '#C8F060'}`,
        color: errorMessage ? '#FFF' : '#C8F060',
        fontSize: '18px', fontWeight: '800', zIndex: 10, whiteSpace: 'nowrap',
        transition: 'all 0.3s ease', display: 'flex', gap: '20px'
      }}>
        <span>{angle !== null ? `${angle}°` : "SCANNING..."}</span>
        <span>Reps: {liveReps}</span>
        {errorMessage || (angle !== null ? `SQUAT ANGLE: ${angle}°` : "SCANNING BODY...")}
      </div>

      {/* Live feedback cue from backend SquatDetector */}
      {liveFeedback && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', padding: '8px 20px', borderRadius: '30px',
          color: 'white', fontSize: '14px', zIndex: 10, whiteSpace: 'nowrap',
        }}>
          {liveFeedback}
        </div>
      )}

      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{
          transform: 'scaleX(-1)',
          borderRadius: '20px',
          boxShadow: '0 0 30px rgba(200, 240, 96, 0.2)',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
}

export default PoseTracker;
