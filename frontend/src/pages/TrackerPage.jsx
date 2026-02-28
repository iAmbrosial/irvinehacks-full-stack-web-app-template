import React, { useState } from "react";
import PoseTracker from "../components/PoseTracker"; // 引入你刚修好的零件

function TrackerPage() {
  const [isCameraActive, setIsCameraActive] = useState(false); // 默认是不显示的

  return (
    <div style={{ backgroundColor: "#000", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>AI Trainer</h2>

      {/* 核心逻辑：如果没开相机，显示队友的 UI；开了就显示你的摄像头 */}
      {!isCameraActive ? (
        <div style={{ textAlign: "center", marginTop: "100px" }}>
          <div style={{ fontSize: "50px" }}>📷</div>
          <p>Allow camera access to start live AI movement tracking</p>
          <button
            onClick={() => setIsCameraActive(true)} // 点击这个按钮，你的摄像头就出来了！
            style={{ backgroundColor: "#d4ff70", color: "black", padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "bold" }}
          >
            Enable Camera
          </button>
        </div>
      ) : (
        <div style={{ width: "80%", maxWidth: "800px", marginTop: "20px" }}>
          <PoseTracker />
        </div>
      )}

      <div style={{ marginTop: "auto", padding: "20px", backgroundColor: "#111", width: "100%", textAlign: "center" }}>
        <p>AI FEEDBACK: Ready to analyze...</p>
      </div>
    </div>
  );
}

export default TrackerPage;