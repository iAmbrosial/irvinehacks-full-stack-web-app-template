import { useRef, useState, useCallback } from "react";

export function useCamera() {
	const videoRef = useRef(null);
	const streamRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const chunksRef = useRef([]);

	// UI state values
	const [isStreaming, setIsStreaming] = useState(false); // camera active?
	const [isRecording, setIsRecording] = useState(false); // recording active?
	const [recordedBlob, setRecordedBlob] = useState(null); // last finished recording
	const [error, setError] = useState(null);  // any camera/record error


	const startCamera = useCallback(async () => {
		setError(null);
		try {
			// asks browser to open the webcam w/out audio
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false,
			});

			streamRef.current = stream;
			
			// streams are inherently local objects so there's an effort to deprecate blob urls for them lol
			// srcObject is the modern way to feed it into a video element
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}

			setIsStreaming(true);
		} catch (err) {
			setError(`Camera error: ${err.message}`);
		}
	}, []);
}
