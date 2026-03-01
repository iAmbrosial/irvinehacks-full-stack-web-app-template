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
  const [errorMessage, setErrorMessage] = useState("");

  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return Math.round(angle);
  };

  // speak the feedback given using the browser's default TTS
  const lastSpokenTime = useRef(0);
  const SPEECH_COOLDOWN_MS = 3000; // speak at most once every 3 seconds

  useEffect(() => {
    if (!liveFeedback) return;
    const now = Date.now();
    if (now - lastSpokenTime.current < SPEECH_COOLDOWN_MS) return;
    
    lastSpokenTime.current = now;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(liveFeedback);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }, [liveFeedback]);
  // end of spoken feedback functionality (Comment out if buggy)

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

        // Send to backend every 100ms (≈10 Hz) — fast enough for rep counting,
        // slow enough not to saturate the server.
        const now = Date.now();
        // 每 100ms 发送一次，防止网络拥塞
        if (now - lastSentTime.current > 100) {
          lastSentTime.current = now;
          if (torsoVisible) {
            sendPoseData({
              session_id: sessionId,
              timestamp: now,
              fps: 30,
              exercise: exercise,
              landmarks: L.map((lm, index) => ({
                id: index, name: "", x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility
              }))
            }).then((response) => {
              if (!response) return;
              setLiveReps(response.reps ?? 0);
              if (response.realtime_feedback) setLiveFeedback(response.realtime_feedback);
              if (response.rep_completed && onRepComplete) {
                onRepComplete({ repCount: response.reps, formIssues: response.form_issues ?? [] });
              }
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

        // Draw joint dots (skip face landmarks 0–10)
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
        position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)',
        background: errorMessage.includes("PARTIAL") ? 'rgba(255, 165, 0, 0.85)' :
                    errorMessage ? 'rgba(255, 77, 77, 0.85)' : 'rgba(20, 20, 20, 0.8)',
        padding: '12px 28px', borderRadius: '50px',
        border: `2px solid ${errorMessage.includes("PARTIAL") ? '#FFA500' : errorMessage ? '#FF4D4D' : '#C8F060'}`,
        color: '#FFF', fontSize: '18px', fontWeight: '800', zIndex: 10, transition: 'all 0.3s',
        display: 'flex', gap: '16px', alignItems: 'center',
      }}>
        {errorMessage ? (
          <span>{errorMessage}</span>
        ) : (
          <>
            <span>{angle !== null ? `${angle}°` : "SCANNING..."}</span>
            <span>Reps: {liveReps}</span>
          </>
        )}
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
        style={{ transform: 'scaleX(-1)', width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  );
}

export default PoseTracker;
