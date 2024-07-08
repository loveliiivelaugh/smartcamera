
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles"
import { motion } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';
import { client } from "../api";



const cameraId = uuidv4();

const WebcamContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#111',
}));

const defaultVideoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
};

function BareCameraView() {
    const [videoConstraints, ] = useState(defaultVideoConstraints);
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [capturing, setCapturing] = useState(false);
    const [videoChunks, setVideoChunks] = useState<Blob[]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);

    const [ automatedStart, setAutomatedStart ] = useState<boolean>(false);

    // const handleAutomatedCapture = async () => {
    //     // Start recording
    //     handleStartCaptureClick();

    //     // Wait 10 seconds
    //     await setTimeout(() => {
    //         // Stop recording
    //         handleStopCaptureClick();

    //         // // Save video
    //         // handleSaveVideo();

    //         // if (automatedStart) handleAutomatedCapture();
    //         // else return;
    //     }, 10000); // wait 10 seconds
    // };

    const wantMimeType = 'video/webm;codecs=vp8,opus';

    const handleDataAvailable = useCallback((event: BlobEvent) => {
        console.log("handleDataAvailable: ", event.data)
        if (event.data.size > 0) {
            setVideoChunks((prevChunks) => [...prevChunks, event.data]);
            console.log("handleDataAvailable.videoChunks: ", videoChunks)
        };
    }, []);

    const handleStartCaptureClick = useCallback(() => {
        console.log("handleStartCaptureClick: ", webcamRef.current)
        if (webcamRef.current && (webcamRef.current as any).video.srcObject) {
            setCapturing(true);
            
            mediaRecorderRef.current = new MediaRecorder((webcamRef.current as any).video.srcObject as MediaStream, {
                mimeType: wantMimeType
            });

            setStartTime(Date.now());

            const recorder = mediaRecorderRef.current;
            recorder.ondataavailable = handleDataAvailable;

            recorder.start(10000); // 10 seconds
            // recorder.start();
            console.log("mediaRecorderRef: ", recorder)
        }
    }, [handleDataAvailable]);

    const handleStopCaptureClick = useCallback(() => {
        console.log("handleStopCaptureClick: ", mediaRecorderRef.current, videoChunks)
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();

            setEndTime(Date.now());
            setCapturing(false);

            console.log("videoChunks: ", videoChunks)
            
        }
    }, [handleDataAvailable]);

    const handleSaveVideo = useCallback(async () => {
        let mimetype = (mediaRecorderRef.current as any).mimeType;
        console.log("mimetype: ", mimetype, videoChunks)

        const blob = new Blob(videoChunks, { type: mimetype });

        const formData = new FormData();

        const fileName = `Camera1|${Date.now()}|${cameraId}.webm`;

        formData.append("file", blob, fileName);
        formData.append("session_id", cameraId);
        formData.append("created_at", new Date().toISOString());
        // formData.append("duration", `${endTime - startTime}`);
        formData.append("startTime", `${startTime}`);
        formData.append("endTime", `${endTime}`);

        await client.post('/api/camera/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Clear video chunks after saving
        setVideoChunks([]);

        console.log("restarting recording: ", {videoChunks, capturing, automatedStart})
        // if (!capturing && automatedStart) handleStartCaptureClick();
    }, [videoChunks]);

    useEffect(() => {
        console.log("videoChunks: ", videoChunks)

        if (videoChunks.length > 0) {
            handleSaveVideo();
        }

    }, [videoChunks]);

    const webcamProps = {
        ref: webcamRef,
        audio: false,
        height: window.innerHeight,
        width: window.innerWidth,
        videoConstraints
    };

    return (
        <WebcamContainer onDoubleClick={(event: any) => {
            console.log("WebcamContainer onDoubleClick: ", event)
        }}>
            <Webcam {...webcamProps}>
                {(() => (
                    <motion.div>
                        <Button onClick={() => {
                            setAutomatedStart(true);
                            handleStartCaptureClick();
                        }}>
                            Start Auto Capture
                        </Button>
                        <Button onClick={() => {
                            setAutomatedStart(false);
                            handleStopCaptureClick();
                        }}>
                            Stop Auto Capture
                        </Button>
                        <Button onClick={handleStartCaptureClick}>
                            Start Capture
                        </Button>
                        <Button onClick={handleStopCaptureClick}>
                            Stop Capture
                        </Button>
                        <Button onClick={handleSaveVideo}>
                            Save Video
                        </Button>
                        {capturing && <p>Recording...</p>}
                    </motion.div>
                )) as any}
            </Webcam>
        </WebcamContainer>
    );
};

export default BareCameraView;