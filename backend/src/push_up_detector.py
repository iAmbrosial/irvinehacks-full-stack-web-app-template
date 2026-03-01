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



class PushUpDetector:
    def __init__(self):
        self.rep_count = 0
        self.state = "up"

    def process_frame(self, landmarks):
        # 计算肘部角度
        l_elbow = calculate_angle(landmarks[11], landmarks[13], landmarks[15])
        r_elbow = calculate_angle(landmarks[12], landmarks[14], landmarks[16])
        avg_elbow = (l_elbow + r_elbow) / 2

        rep_completed = False
        if avg_elbow < 90 and self.state == "up":
            self.state = "down"
        if avg_elbow > 160 and self.state == "down":
            self.state = "up"
            self.rep_count += 1
            rep_completed = True

        return {"reps": self.rep_count, "rep_completed": rep_completed, "form_issues": []}