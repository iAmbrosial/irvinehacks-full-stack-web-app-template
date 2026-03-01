import numpy as np
import json

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    cosine_angle = np.dot(ba, bc) / (
        np.linalg.norm(ba) * np.linalg.norm(bc)
    )

    angle = np.degrees(np.arccos(cosine_angle))
    return angle

class SquatDetector:
    def __init__(self):
        self.rep_count = 0
        self.state = "up"
        self.min_knee_angle = 180
        self.current_feedback = []
        self.rep_completed = False

        self.left_knee_angle = 180
        self.right_knee_angle = 180
        self.torso_angle = 90
        self.knee_valgus_detected = False
        self.left_knee_x = 0
        self.right_knee_x = 0
        self.left_ankle_x = 0
        self.right_ankle_x = 0

    def process_frame(self, landmarks):

        self.rep_completed = False

        left_hip = [landmarks[23]["x"], landmarks[23]["y"]]
        left_knee = [landmarks[25]["x"], landmarks[25]["y"]]
        left_ankle = [landmarks[27]["x"], landmarks[27]["y"]]

        right_hip = [landmarks[24]["x"], landmarks[24]["y"]]
        right_knee = [landmarks[26]["x"], landmarks[26]["y"]]
        right_ankle = [landmarks[28]["x"], landmarks[28]["y"]]

        left_shoulder = [landmarks[11]["x"], landmarks[11]["y"]]

        # Angles
        left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
        avg_knee_angle = (left_knee_angle + right_knee_angle) / 2

        torso_angle = calculate_angle(left_shoulder, left_hip, left_knee)

        # Update attributes
        self.left_knee_angle = left_knee_angle
        self.right_knee_angle = right_knee_angle
        self.torso_angle = torso_angle

        self.left_knee_x = left_knee[0]
        self.right_knee_x = right_knee[0]
        self.left_ankle_x = left_ankle[0]
        self.right_ankle_x = right_ankle[0]

        # Track depth
        self.min_knee_angle = min(self.min_knee_angle, avg_knee_angle)

        # State machine
        if avg_knee_angle < 95 and self.state == "up":
            self.state = "down"

        if avg_knee_angle > 165 and self.state == "down":
            self.state = "up"
            self.rep_count += 1
            self.rep_completed = True
            self.evaluate_form()
            self.min_knee_angle = 180

        # Build JSON response
        # result = {"exercise": "squat",
        #           "confidence": 0.99,
        #           "is_standard": True,
        #           "realtime_feedback": self.current_feedback}
        result = {
            "exercise": "squat",
            "reps": self.rep_count,
            "state": self.state,
            "metrics": {
                "knee_angle": round(avg_knee_angle, 2),
                "min_knee_angle_this_rep": round(self.min_knee_angle, 2),
                "torso_angle": round(torso_angle, 2)
            },
            "form_issues": self.current_feedback,
            "rep_completed": self.rep_completed
        }

        return result

    def evaluate_form(self):
        self.current_feedback = []

        # Depth Check
        if self.min_knee_angle > 100:
            self.current_feedback.append("Go deeper into your squat.")

        # Excessive Forward Lean
        if self.torso_angle < 45:
            self.current_feedback.append("Keep your chest up and avoid leaning forward.")

        # Knee Valgus (Knees collapsing inward)
        left_knee_in = self.left_knee_x > self.left_ankle_x + 0.02
        right_knee_in = self.right_knee_x < self.right_ankle_x - 0.02

        if left_knee_in or right_knee_in:
            self.current_feedback.append("Drive your knees outward — avoid knee collapse.")

        # Left/Right Imbalance
        if abs(self.left_knee_angle - self.right_knee_angle) > 10:
            self.current_feedback.append("Try to keep weight evenly distributed between both legs.")

        # Good Squat Case
        if not self.current_feedback:
            self.current_feedback.append("Excellent squat form! Keep it up.")
