// frontend/src/services/PoseSocket.js
//
// Sends real-time pose data to the backend for rule-based form feedback.
// Uses the Vite proxy (/api → http://localhost:8000 in dev, same origin in prod)
// so this URL works in both environments without any changes at deployment.
//
// Reference: https://vitejs.dev/config/server-options.html#server-proxy

/**
 * Sends one frame of pose landmark data to the backend.
 *
 * @param {Object} poseData - shape: { session_id, timestamp, fps, exercise, landmarks[] }
 * @returns {Object|null} - backend response or null on network error
 */
export const sendPoseData = async (poseData) => {
  try {
    // 💡 这里的地址要改成你队友后端跑的地址（比如 http://localhost:8000/process）
    const BACKEND_URL = "http://localhost:8000/process_pose";

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 2. 队友后端只定义了 landmarks 字段，所以我们只发这个
      body: JSON.stringify({
        landmarks: poseData.landmarks
      }),
    });

    if (!response.ok) {
      console.warn(`Realtime feedback error: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    // Silently drop network errors during tracking — don't block the render loop
    console.error("sendPoseData failed:", error);
    return null;
  }
};
