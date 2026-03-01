// frontend/src/services/PoseSocket.js

/**
 * 发送姿态数据到后端的工具函数
 * @param {Object} poseData - 你刚才定义的那个包含 33 个点的 JSON 对象
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
      body: JSON.stringify(poseData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result; // 返回后端的分析结果（比如：背太弯了、动作标准等）
  } catch (error) {
    console.error("发送数据失败:", error);
    return null;
  }
};