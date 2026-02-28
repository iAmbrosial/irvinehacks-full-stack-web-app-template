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


    const stopCamera = useCallback(() => {
        // stop any in progress recording before tearing down the stream
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
			// stop is called on each track in the stream
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsStreaming(false);
        setIsRecording(false);
    }, []);


    const startRecording = useCallback(() => {
        if (!streamRef.current) {
            setError("Cannot record: camera is not active.");
            return;
        }

        // reset any previous recording data
        chunksRef.current = [];
        setRecordedBlob(null);

		// MIME media type chosen for smaller file sizes and larger browser support
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            ? "video/webm;codecs=vp9"
			// falls back to more basic format if vp9 isn't supported
            : "video/webm";

        const recorder = new MediaRecorder(streamRef.current, { mimeType });

        // collect each data chunk as it arrives (every ~250ms by default).
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

		// combine all chunks into a blob after recording stops
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            setRecordedBlob(blob);
            setIsRecording(false);
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
    }, []);

    const stopRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }
    }, []);


    return {
        videoRef, // attach to <video ref={videoRef}>
        isStreaming,
        isRecording,
        recordedBlob,
        startCamera,
        stopCamera,
        startRecording,
        stopRecording,
        error, // camera/record error message
    };
}
