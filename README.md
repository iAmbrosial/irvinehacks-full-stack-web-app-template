## Inspiration

Hundreds of millions of newbies decide to take up the gym as a hobby every year. Millions of these people injure themselves in the process, but not from listing too heavy. Instead, they lift **wrong**. Many try their best to follow online tutorials but often find themselves committing a small mistake that can have severe consequences: a rounded back on a squat, knees caving on a lunge, and other similar movements. These are things that a personal trainer would catch instantly. The problem with that? Accessibility. Most people lift alone, with reasons ranging from tight finances to introvertedness, and fail to receive this type of immediate feedback. We wanted to build the closest thing to having a caring, knowledgeable coach with you at the click of a button – one that delivers accurate fixes without the pains of a personal trainer.

## What it does

FormCoach is a browser-based AI fitness coach that uses your device’s camera to analyze your exercise form in real time and provide insightful feedback. It:

- Detects your body position frame-by-frame using computer vision without any wearables or special hardware requirements
- Calculates angles and distances between your joints, creating a color-coded skeleton that is dynamically overlaid onto the user’s video feed – green is good, red is bad
- Tracks session duration and exercise choice
- Sends a summary to an AI support coach after each workout that returns personalized feedback: your strengths, weaknesses, the **most** important correction to make, and goals for the future
- Includes a full exercise library with embedded tutorial videos and step-by-step instructions for myriad exercises that will continue to be expanded

## How we built it

The frontend was built using a combination of **React** and **Vite** to take advantage of their joint ability to handle complex UI logic and project infrastructure. **MediaPipe Pose** is used to achieve real-time landmark detection performance on the human body, and runs entirely in the browser via **WebAssembly**. This simultaneously keeps latency close to zero and protects user security. Additionally, the **HTML5 Canvas API** is used to draw the colored skeleton overlay on top of the user’s live camera feed on the fly. 

The backend of the project is supported by **FastAPI (Python)**. Whenever a workout ends, the frontend POSTs a structure summary (e.g., exercise type, duration, form scores, etc.) to the backend, allowing for the construction of a prompt that calls an *AI coach* to create personalized advice.

Navigation across pages is handled using **React Router**.

## Challenges we ran into

1. **MediaPipe + Vite integration**
    - Careful configuration was needed to load the WebAssembly model files through Vite’s module bundler, needing a large amount of trial and error in the process. This took careful coordination and analysis from multiple members of the team. 
2. **Canvas coordinate mapping**
    - The landmarks returned by MediaPipe are normalized to [0,1] coordinates relative to the video frame. Mapping these onto their correct positions on an absolutely positioned canvas required keeping the canvas’ internal pixel buffer separate from its display size – a task made even harder by the fact the canvas can be easily scaled using CSS.
3. **Ghost landmark filtering**
    - MediaPipe occasionally assigns low-confidence landmarks to empty space, creating landmarks which are essentially *ghosts* that entirely throws off the reading of the app. By adding visibility threshold checks (> 0.75) and boundary checks (y < 0.95), we were able to minimize the amount of these wrong angle readings used as real data.
4. **Team Coordination**
    - Coordinating the work of multiple people on a project is always difficult. It is made even harder by the frequent errors that are fundamental to the nature of programming and creating web applications. We often found ourselves working on the same component as another person through wildly different architectural approaches, leading to wasted time concentrated at the beginning of the hack. This was ultimately resolved by defining individual tasks and clear code architecture ownership boundaries.

## Accomplishments that we're proud of

1. Real-time joint angle calculations for webcams running at full rate in the browser without the need of a backend round-trip for vision processing
2. A clean full-stack pipeline from the webcam stream → angle detection → workout session summary → LLM coached feedback → aesthetically pleasing UI cards
3. A fully modular architecture featuring LLM prompting that is automatically enriched by form data highlighting all components of a user’s workout session, creating detailed feedback custom-tailored to the user and that particular session

## What we learned

The hackathon taught us many different concepts in and out of programming. It challenged our ability to work together as a cohesive team only hours after our first meeting, and created an environment that pushed all of us to grow individually and collectively. Still, we learned a range of particular technical skills and frameworks:

1. Managing a browser-based machine learning machine that links together Mediapipe and WebAssembly, and how capable these frontend-based estimation models are without external GPU or server-side computational power
2. The many different compositing modes (source-in, destination-atop, etc.) offered by the HTML5 Canvas API that enables sophisticated real-time visual effects with little lag
3. Structuring LLM prompts built on concrete numeral data (joint angles, form scores) and prompt engineering to create actionable feedback rather than vague advice

## What's next for FormCoach

1. **Improved detection accuracy**
    - Aim for a higher accuracy percentage when counting repetitions by better detecting the up/down phase transitions in each exercise
2. **Increase available exercise-specific tracking**
    - Increase the number of exercises for which there are available tracking using MediaPipe landmarks and mathematical formulas customized to each exercise
3. **Fatigue detection**
    - Track declining range of motion, increased joint jitter, and even changing facial expressions across exercise repetitions to determine early warning signs of fatigue
4. **Personalized form targets**
    - Adjust angle thresholds based on the user’s height and limb proportions, enabling better detection of metrics such as correct depth of an exercise
5. **User profiles and gamification**
    - Create user profiles to allow tracking of past workouts, historical trends, and other metrics to improve training – featuring achievement badges and levels
