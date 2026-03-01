import numpy as np
import json


def calculate_angle(a, b, c):
    # 增加兼容性逻辑：如果是字典，提取 x, y；如果是列表，直接转 array
    def to_coords(p):
        if isinstance(p, dict):
            return np.array([p['x'], p['y']])
        return np.array(p)

    a_arr = to_coords(a)
    b_arr = to_coords(b)
    c_arr = to_coords(c)

    ba = a_arr - b_arr
    bc = c_arr - b_arr

    # 计算余弦值并增加 eps 防止除以 0
    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)

    if norm_ba == 0 or norm_bc == 0:
        return 0

    cosine_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    return angle

class ForwardLungeDetector:
    def __init__(self):
        self.rep_count = 0
        self.state = "up"
        self.current_feedback = []
        self.rep_completed = False

    def process_frame(self, landmarks):
        self.rep_completed = False
        # 提取双腿关键点
        l_hip, l_knee, l_ankle = [landmarks[23]["x"], landmarks[23]["y"]], [landmarks[25]["x"],
                                                                            landmarks[25]["y"]], [
            landmarks[27]["x"], landmarks[27]["y"]]
        r_hip, r_knee, r_ankle = [landmarks[24]["x"], landmarks[24]["y"]], [landmarks[26]["x"],
                                                                            landmarks[26]["y"]], [
            landmarks[28]["x"], landmarks[28]["y"]]

        # 计算双膝角度
        l_angle = calculate_angle(l_hip, l_knee, l_ankle)
        r_angle = calculate_angle(r_hip, r_knee, r_ankle)

        # 箭步蹲时，其中一只腿会深弯曲（通常小于 100 度）
        min_angle = min(l_angle, r_angle)

        if min_angle < 100 and self.state == "up":
            self.state = "down"

        if min_angle > 160 and self.state == "down":
            self.state = "up"
            self.rep_count += 1
            self.rep_completed = True
            self.evaluate_form(l_angle, r_angle, landmarks)

        return {
            "exercise": "lunge",
            "reps": self.rep_count,
            "state": self.state,
            "metrics": {"min_angle": round(min_angle, 2)},
            "form_issues": self.current_feedback,
            "rep_completed": self.rep_completed
        }

    def evaluate_form(self, l_angle, r_angle, landmarks):
        self.current_feedback = []
        # 1. 深度检查：如果双腿都没弯到位
        if min(l_angle, r_angle) > 110:
            self.current_feedback.append("Lower your back knee closer to the ground.")
        # 2. 躯干垂直度：肩膀不应过度前倾
        shoulder_y = landmarks[11]["y"]
        hip_y = landmarks[23]["y"]
        if abs(landmarks[11]["x"] - landmarks[23]["x"]) > 0.1:
            self.current_feedback.append("Keep your torso upright.")