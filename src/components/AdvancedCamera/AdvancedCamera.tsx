import { useEffect, useRef } from "react"
import Webcam from "react-webcam"
import { 
    Alert, Box, Button, Divider, IconButton, 
    ListItemText, Stack, Typography 
} from "@mui/material"
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import CameraIcon from "@mui/icons-material/Camera"
import SettingsIcon from "@mui/icons-material/Settings"
import VideoCallIcon from "@mui/icons-material/VideoCall"
import DownloadIcon from "@mui/icons-material/Download";
import { styled } from "@mui/material/styles"
import { motion } from "framer-motion";

import CameraProvider from "./CameraProvider";
import { useCameraScripts } from './useCameraScripts';
import { useCameraStore, useModelStore } from "../../store";


const WebcamContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#111',
}));

function AdvancedCamera() {
    const cameraStore = useCameraStore();
    const modelStore = useModelStore();

    const cameraScripts = useCameraScripts();

    const webcamRef = useRef(null as any);
    const canvasRef = useRef(null as any);
    const videoRef = useRef(null as any);
    const depthRef = useRef(null as any);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    useEffect(() => {
        if (
            modelStore.ssd && modelStore.blazeface && modelStore.mobileNet
        ) cameraScripts.startDetecting(canvasRef, videoRef, webcamRef);
    }, [modelStore.ssd, modelStore.blazeface, modelStore.mobileNet]);

    const items = {
        "Settings": (
            <IconButton onClick={() => { }}>
                <SettingsIcon />
            </IconButton>
        ),
        "Camera": (
            <IconButton onClick={() => cameraScripts.capture(cameraStore, webcamRef.current)} sx={{ '&:hover': { background: 'rgba(0,0,0,0.2)', cursor: 'pointer' } }}>
                <CameraIcon />
            </IconButton>
        ),
        [`${cameraStore.capturing ? "Stop" : "Record"}`]: (
            <IconButton 
                onClick={() => cameraStore.capturing 
                    ? cameraScripts.handleStopCaptureClick(mediaRecorderRef.current)
                    : cameraScripts.handleStartCaptureClick(webcamRef.current, mediaRecorderRef.current)
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
            <IconButton onClick={cameraScripts.handleDownload}>
                <DownloadIcon />
            </IconButton>
        ),
        "Devices": (
            <select 
                value={cameraStore.videoConstraints.facingMode} 
                onChange={(event) => cameraStore.setVideoConstraints((prev: any) => ({ 
                    ...prev, 
                    facingMode: event.target.value 
                }))}
            >
                <option value="front">Front</option>
                <option value="back">Back</option>
                {cameraStore.availableDevices
                    .filter((device: { kind: string }) => device.kind === "videoinput")
                    .map((device: { deviceId: string, label: string }) => (
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
        videoConstraints: cameraStore.videoConstraints,
    };

    return (
        <WebcamContainer onDoubleClick={(event) => {
            console.log("WebcamContainer onDoubleClick: ", event)
        }}>
            <Webcam {...webcamProps}>
                {(() => (
                    <>
                        <motion.div>
                            <Box 
                                // onDoubleClick={cameraScripts.handleDoubleClick}
                                sx={{ height: '100vh', width: '100vw', position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.2)' }}
                            >
                                <canvas ref={depthRef} style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, right: 0, zIndex: 1 }} />
                                <canvas ref={canvasRef} style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, right: 0, zIndex: 1 }} />
                                <video ref={videoRef} style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, right: 0, zIndex: 10 }} />
                                {cameraStore.classifiedImage && (
                                    <Stack sx={{ color: "#fff",mt:10, p: 2, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', borderRadius: '10px', maxWidth: 250, mx: 2 }}>
                                        <Typography variant="body1">
                                            Model Status
                                        </Typography>
                                        {[
                                            "ssd",
                                            "blazeface",
                                            "detector", // poseDetection
                                            "estimator",
                                            "mobileNet",
                                        ].map((aiModel: string, index: number) => (
                                            <Typography variant="body1" key={index}>
                                                {aiModel}: {modelStore[aiModel as keyof typeof modelStore] !== null ? "Loaded" : "Not Loaded"}
                                            </Typography>
                                        ))}
                                        <Divider />
                                        {cameraStore.classifiedImage?.map((item: any, index: number) => (
                                            <>
                                                <ListItemText key={index} primary={item.className} />
                                                <Typography variant="body1">
                                                    {item.probability.toFixed(2) + '% Probability'}
                                                </Typography>
                                            </>
                                        ))}
                                        <Divider />
                                        {cameraStore.facesDetected && (
                                            <Typography variant="body1">
                                                {cameraStore.facesDetected} Faces Detected
                                            </Typography>
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ zIndex: 1000 }}>
                            <Button onClick={() => cameraScripts.handleStartCaptureClick(webcamRef.current, mediaRecorderRef.current)}>
                                Start Capture
                            </Button>
                            <Button onClick={() => cameraScripts.handleStopCaptureClick(mediaRecorderRef.current)}>
                                Stop Capture
                            </Button>
                            <Button onClick={() => cameraScripts.handleSaveVideo(mediaRecorderRef.current)}>
                                Save Video
                            </Button>
                            {cameraStore.capturing && <p>Recording...</p>}
                        </motion.div>
                        {(cameraStore.problems.length > 0) && (
                            <Alert severity="warning">
                                {cameraStore.problems.join(", ")}
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
};


const AdvancedCameraWithWrapper = () => {
    return (
        <CameraProvider>
            <AdvancedCamera />
        </CameraProvider>
    )
};

export default AdvancedCameraWithWrapper