import { useRef, useState } from "react";

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
}
