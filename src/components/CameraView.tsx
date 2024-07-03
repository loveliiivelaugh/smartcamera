import { useCallback, useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"
import { Alert, Box, IconButton } from "@mui/material"
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { styled } from "@mui/material/styles"
import CameraIcon from "@mui/icons-material/Camera"
import SettingsIcon from "@mui/icons-material/Settings"
import VideoCallIcon from "@mui/icons-material/VideoCall"
import DownloadIcon from "@mui/icons-material/Download";
import { motion } from "framer-motion"

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';

import { useCameraStore, useModelStore } from "../store";
import { client } from "../api";


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

const Camera = () => {
    const cameraStore = useCameraStore();
    const modelStore = useModelStore();
    const [videoConstraints, setVideoConstraints] = useState(defaultVideoConstraints);

    const webcamRef = useRef(null as any);
    const canvasRef = useRef(null as any);
    const videoRef = useRef(null as any);

    // const [ssdModel, setSsdModel] = useState(null as any);
    // const [blazefaceModel, setBlazefaceModel] = useState(null as any);
    const [detectInterval, setDetectInterval] = useState(null as any);

    const [availableDevices, setAvailableDevices] = useState([] as any);
    const [problems, setProblems] = useState([] as any);

    const mediaRecorderRef = useRef(null);
    const [capturing, setCapturing] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);

    // console.log("recorderChunks", recordedChunks)

    const handleStartCaptureClick = useCallback(() => {
        setCapturing(true);
        (mediaRecorderRef as any).current = new MediaRecorder(webcamRef.current.stream, {
            mimeType: "video/webm"
        });
        (mediaRecorderRef as any).current.addEventListener(
            "dataavailable",
            handleDataAvailable
        );
        (mediaRecorderRef as any).current.start();
    }, [webcamRef, setCapturing, mediaRecorderRef]);

    const handleDataAvailable = useCallback(
        async ({ data }: any) => {
            if (data.size > 0) {
                setRecordedChunks((prev) => prev.concat(data));

                let type = "video/webm";
                const blob = new Blob(recordedChunks, { type });

                (window as any).extras.ws.send(blob);

                const response = await client.post(
                    '/api/camera/upload', 
                    blob, 
                    { headers: { 'Content-Type': type } }
                );

                console.log("response", response);

            }
        },
        [setRecordedChunks]
    );

    const handleStopCaptureClick = useCallback(() => {
        (mediaRecorderRef as any).current.stop();
        setCapturing(false);
    }, [mediaRecorderRef, webcamRef, setCapturing]);

    const handleDownload = useCallback(() => {
        if (recordedChunks.length) {
            const blob = new Blob(recordedChunks, {
                type: "video/webm"
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            document.body.appendChild(a);
            // a.style = "display: none";
            a.href = url;
            a.download = "react-webcam-stream-capture.webm";
            a.click();
            window.URL.revokeObjectURL(url);
            setRecordedChunks([]);
        }
    }, [recordedChunks]);


    const capture = useCallback(async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        // // Classify Image // No await -- runs in background and populates redux
        // actions.classifyImage(imageSrc);
        // Save image
        cameraStore.handleImageSrc(imageSrc);
        // Update view
        cameraStore.handleView("image");
    }, [webcamRef]);

    const detectFaces = async () => {
        // Get canvas context
        let canvasContext = canvasRef.current?.getContext('2d');
        if (canvasContext) {
            // Set canvas size
            canvasContext.canvas.width = webcamRef.current.props.width;
            canvasContext.canvas.height = webcamRef.current.props.height;
            // draw the video first
            canvasContext.drawImage(videoRef.current, 0, 0, 640, 480);

            // console.log(modelStore);

            const imageSrc = webcamRef.current.getScreenshot();
            const image = new Image();
            image.height = webcamRef.current.props.height;
            image.width = webcamRef.current.props.width;
            image.src = imageSrc;

            // Facial Recognition
            if (modelStore.ssd) {
                const ssdModel = modelStore.ssd;
                const objectDetected = await ssdModel.detect(image);
                // const facialRecognition = await blazefaceModel.estimateFaces(image);

                // const isMichaelsFace = compareLandmarks(michaelsFacialLandmarks, facialRecognition[0]);
                // if (isMichaelsFace) {
                //     canvasContext = {}
                //     console.log({ detectInterval })
                //     clearInterval(detectInterval);
                //     actions.setIsAuthenticated(true)
                //     // navigate('/')
                // }
                console.log({ objectDetected });

                objectDetected.forEach((detection: any) => {
                    const x = detection.bbox[0];
                    const y = detection.bbox[1];
                    const width = detection.bbox[2];
                    const height = detection.bbox[3];
                    canvasContext.strokeStyle = 'red';

                    if (detection.score.toFixed(2) > 0.8)
                        canvasContext.strokeRect(x, y, width, height);

                    canvasContext.font = '16px Arial';
                    canvasContext.fillStyle = 'white';

                    if (detection.score.toFixed(2) > 0.8)
                        canvasContext.fillText(`${detection.class} ${detection.score.toFixed(2)}`, x, y);
                })
            } else {
                let problem = "No Coco SSD model found (Object Detection)";
                if (problems.includes(problem)) return;
                else setProblems((problems: any) => [...problems, problem]);
            };
        };
    };

    const startDetecting = async () => {
        const detectInterval = setInterval(detectFaces, 20)
        setDetectInterval(detectInterval)
    };

    const loadModels = async () => {
        const ssd = await cocoSsd.load();
        const blazefaceModel = await blazeface.load();
        // console.log(
        //     "webcamProps: ",
        //     // await navigator.mediaDevices,
        //     // devices,
        //     ssd, blazefaceModel
        // );

        modelStore.setSsd(ssd);
        modelStore.setBlazeface(blazefaceModel);

        const devices = await navigator.mediaDevices.enumerateDevices();
        setAvailableDevices(devices);

        // startDetecting();
        return true;
    };

    const handleDoubleClick = (event: any) => {
        console.log("Camera handleDoubleClick: ", event)
        setVideoConstraints(prev => ({
            ...prev,
            facingMode: prev.facingMode === "user"
                ? "environment"
                : "user"
        }))
    };

    useEffect(() => {
        if (
            modelStore.ssd && modelStore.blazeface
        ) startDetecting();
    }, [modelStore.ssd, modelStore.blazeface]);

    useEffect(() => {
        // // If the camera is reopened from the image view, ...
        // // ... reset the image classification
        // actions.handleImageClassification(null);
        // const videoElement = videoRef.current;
        // videoElement.srcObject = mediaStream;
        // videoElement.play();
        // console.log('videoEL: ', videoElement);

        (async () => {
            const models = await loadModels();
            console.log({ models });
        })();

        return () => {
            clearInterval(detectInterval);
        }

    }, [])

    const items = {
        "Settings": (
            <IconButton onClick={() => { }}>
                <SettingsIcon />
            </IconButton>
        ),
        "Camera": (
            <IconButton onClick={capture} sx={{ '&:hover': { background: 'rgba(0,0,0,0.2)', cursor: 'pointer' } }}>
                <CameraIcon />
            </IconButton>
        ),
        [`${capturing ? "Stop" : "Record"}`]: (
            <IconButton 
                onClick={() => capturing 
                    ? handleStopCaptureClick() 
                    : handleStartCaptureClick()
                } 
                sx={{ '&:hover': { 
                    background: 'rgba(0,0,0,0.2)', 
                    cursor: 'pointer' 
                    } 
                }}
            >
                <VideoCallIcon />
            </IconButton>
        ),
        "Download": (
            <IconButton onClick={handleDownload}>
                <DownloadIcon />
            </IconButton>
        ),
        "Devices": (
            <select value={videoConstraints.facingMode} onChange={(event) => setVideoConstraints(prev => ({ ...prev, facingMode: event.target.value }))}>
                <option value="front">Front</option>
                <option value="back">Back</option>
                {availableDevices
                    .filter((device: any) => device.kind === "videoinput")
                    .map((device: any) => (
                        <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
                    ))}
            </select>
        )
    };

    const webcamProps = {
        ref: webcamRef,
        audio: false,
        height: window.innerHeight,
        width: window.innerWidth,
        // screenshotFormat: "image/jpeg",
        videoConstraints
    };

    return (
        <WebcamContainer onDoubleClick={(event) => {
            console.log("WebcamContainer onDoubleClick: ", event)
        }}>
            <Webcam {...webcamProps}>
                {(() => (
                    <>
                        <motion.div>
                            <Box onDoubleClick={handleDoubleClick} sx={{ height: '100vh', width: '100vw', position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.2)' }}>
                                <canvas ref={canvasRef} style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, right: 0, zIndex: 1 }} />
                                <video ref={videoRef} style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, right: 0, zIndex: 10 }} />
                                {/* <Stack sx={{ color: "#fff",mt:10, p: 2, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', borderRadius: '10px', maxWidth: 250, mx: 2 }}>
                                    {[
                                        "Image Classification",
                                        "Object Detection",
                                        "Image Segmentation",
                                        "Facial Recognition",
                                    ].map((item, index) => (
                                        <FormControlLabel
                                            control={<Switch checked={true} />}
                                            onChange={() => {}}
                                            label={item}
                                            key={index}
                                        />
                                    ))}
                                </Stack> */}
                            </Box>
                        </motion.div>
                        {(problems.length > 0) && (
                            <Alert severity="warning">
                                {problems.join(", ")}
                            </Alert>
                        )}
                        <BottomNavigation
                            showLabels
                            // value={props.tab}
                            // onChange={handleNavChange}
                            sx={{ zIndex: 1000 }}
                        >
                            {Object
                                .keys(items)
                                .map((item, index) => (
                                    <BottomNavigationAction
                                        key={index}
                                        label={item}
                                        icon={(items as any)[item]}
                                        sx={{ color: "#222" }}
                                    />
                                ))}
                        </BottomNavigation>
                    </>
                )) as any}
            </Webcam>
        </WebcamContainer>
    )
}

export default Camera;