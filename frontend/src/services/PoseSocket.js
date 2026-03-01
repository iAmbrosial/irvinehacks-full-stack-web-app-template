export const sendPoseData = async (poseData) => {
  try {
    // 1. 这里的地址必须匹配队友后端的路由定义
    // 注意：如果队友用了 app.mount("/api/"), 这里可能需要加 /api
    const BACKEND_URL = "http://localhost:8000/analyze-squat";

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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("发送数据失败:", error);
    return null;
  }
};