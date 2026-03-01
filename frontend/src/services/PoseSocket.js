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
    const response = await fetch("/api/realtime-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(poseData),
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
