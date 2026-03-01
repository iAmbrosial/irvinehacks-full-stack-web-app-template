import time
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


class PlankDetector:
    def __init__(self):
        self.start_time = None
        self.duration = 0

    def process_frame(self, landmarks):
        # 计算 肩-胯-踝 的直线角度
        body_line = calculate_angle(landmarks[11], landmarks[23], landmarks[27])
        is_standard = body_line > 170  # 越接近 180 越直

        if is_standard:
            if not self.start_time: self.start_time = time.time()
            self.duration = time.time() - self.start_time
        else:
            self.start_time = None  # 姿势不对重置计时

        return {"reps": int(self.duration),
                "form_issues": ["Keep your core tight!" if not is_standard else "Holding..."]}