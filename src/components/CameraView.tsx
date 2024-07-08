import { useCallback, useEffect, useRef, useState } from "react"
import Webcam from "react-webcam"
import { Alert, Box, Divider, IconButton, ListItemText, Stack, Typography } from "@mui/material"
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { styled } from "@mui/material/styles"
import CameraIcon from "@mui/icons-material/Camera"
import SettingsIcon from "@mui/icons-material/Settings"
import VideoCallIcon from "@mui/icons-material/VideoCall"
import DownloadIcon from "@mui/icons-material/Download";
import { motion } from "framer-motion"

// Importing the tensorflow.js library 
import * as tf from "@tensorflow/tfjs"
// import * as poseDetection from '@tensorflow-models/pose-detection';
// import * as depthEstimation from '@tensorflow-models/depth-estimation'
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';
import * as mobilenet from '@tensorflow-models/mobilenet';

import { useCameraStore, useModelStore } from "../store";
import { client } from "../api";


// Calling setBackend() method 
tf.setBackend('webgl'); 

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

// function getAdjacentKeyPoints(keypoints: any, minConfidence: number) {
//     const connectedPartIndices = [
//         [5, 7], [7, 9], [6, 8], [8, 10],
//         [5, 6], [5, 11], [6, 12], [11, 12],
//         [11, 13], [13, 15], [12, 14], [14, 16]
//     ];

//     return connectedPartIndices.filter((indices) => {
//         return (
//             keypoints[indices[0]].score >= minConfidence &&
//             keypoints[indices[1]].score >= minConfidence
//         );
//     }).map((indices) => {
//         return [keypoints[indices[0]], keypoints[indices[1]]];
//     });
// };

const Camera = () => {
    const cameraStore = useCameraStore();
    const modelStore = useModelStore();
    const [videoConstraints, setVideoConstraints] = useState(defaultVideoConstraints);

    const webcamRef = useRef(null as any);
    const canvasRef = useRef(null as any);
    const videoRef = useRef(null as any);
    const depthRef = useRef(null as any);

    const [detectInterval, setDetectInterval] = useState(null as any);

    const [classifiedImage, setClassifiedImage] = useState(null as any);
    const [facesDetected, ] = useState(null as null | number);

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

                // (window as any).extras.ws.send(blob);

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

            const imageSrc = webcamRef.current.getScreenshot();
            const image = new Image();
            image.height = webcamRef.current.props.height;
            image.width = webcamRef.current.props.width;
            image.src = imageSrc;

            // Use the image and the models to determine data ...

            // Image Classification
            if (modelStore.mobileNet) {
                const predictions = await modelStore.mobileNet.classify(image);
                console.log({ predictions });
                setClassifiedImage(predictions);
            };

            // // Facial Recognition
            // if (modelStore.blazeface) {
            //     const facialRecognition = await modelStore.blazeface.estimateFaces(image);

            //     console.log({ facialRecognition });
            //     setFacesDetected(facialRecognition.length);

            //     // facialRecognition.forEach((face: any) => {
            //     //     canvasContext.strokeStyle = 'yellow';
            //     //     canvasContext.strokeRect(face.box?.[0], face.box?.[1], face.box?.[2], face.box?.[3]);
            //     // });


            //     // Drawing facial recognition results
            //     facialRecognition.forEach((face: any) => {
            //         const { topLeft, bottomRight, landmarks } = face;

            //         const x = topLeft[0];
            //         const y = topLeft[1];
            //         const width = bottomRight[0] - topLeft[0];
            //         const height = bottomRight[1] - topLeft[1];
            //         canvasContext.strokeStyle = 'green';
            //         canvasContext.strokeRect(x, y, width, height);

            //         landmarks.forEach((landmark: any) => {
            //             canvasContext.beginPath();
            //             canvasContext.arc(landmark[0], landmark[1], 2, 0, 2 * Math.PI);
            //             canvasContext.fillStyle = 'yellow';
            //             canvasContext.fill();
            //         });
            //     });
            //     // const isMichaelsFace = compareLandmarks(michaelsFacialLandmarks, facialRecognition[0]);
            //     // if (isMichaelsFace) {
            //     //     canvasContext = {}
            //     //     console.log({ detectInterval })
            //     //     clearInterval(detectInterval);
            //     //     actions.setIsAuthenticated(true)
            //     //     // navigate('/')
            //     // }
            // };

            // Object Detection
            if (modelStore.ssd) {
                const objectDetected = await modelStore.ssd.detect(image);

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

                    if (detection.score.toFixed(2) > 0.8) canvasContext.fillText(
                        `${detection.class} ${detection.score.toFixed(2)}`, 
                        x, 
                        y
                    );
                });

            };

            // // Pose Detection
            // if (modelStore.detector) {
            //     const poses = await modelStore.detector.estimatePoses(image);

            //     console.log({ poses }); 
                
            //     // Drawing pose estimation results
            //     poses.forEach((pose: any) => {
            //         pose.keypoints.forEach((keypoint: any) => {
            //             if (keypoint.score > 0.5) {
            //                 canvasContext.beginPath();
            //                 canvasContext.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            //                 canvasContext.fillStyle = 'blue';
            //                 canvasContext.fill();
            //             }
            //         });

            //         const adjacentKeyPoints = getAdjacentKeyPoints(pose.keypoints, 0.5);
            //         adjacentKeyPoints.forEach((keypoints: any) => {
            //             canvasContext.beginPath();
            //             canvasContext.moveTo(keypoints[0].x, keypoints[0].y);
            //             canvasContext.lineTo(keypoints[1].x, keypoints[1].y);
            //             canvasContext.strokeStyle = 'blue';
            //             canvasContext.lineWidth = 2;
            //             canvasContext.stroke();
            //         });
            //     });
            // };

            // Depth Estimation
            if (modelStore.estimator) {
                // const estimationConfig = {
                //     minDepth: 0,
                //     maxDepth: 1,
                // };
                
                // const depthMap = await modelStore.estimator.estimateDepth(image, estimationConfig);

                // console.log({ depthMap });

                // const depthData = await depthMap.toArray();

                // // Drawing depth estimation results
                // const depthCanvas = depthRef.current;
                // let depthContext = depthCanvas.getContext('2d');
                // depthCanvas.width = image.width;
                // depthCanvas.height = image.height;

                // // const imageData = depthContext.createImageData(image.width, image.height);
                // // if (depthData?.length) for (let i = 0; i < depthData.length; i++) {
                // //     const depthValue = depthData[i] * 255;
                // //     imageData.data[i * 4] = depthValue;
                // //     imageData.data[i * 4 + 1] = depthValue;
                // //     imageData.data[i * 4 + 2] = depthValue;
                // //     imageData.data[i * 4 + 3] = 255;
                // // }

                // const imageData = depthContext.createImageData(image.width, image.height);
                // for (let y = 0; y < depthCanvas.height; y++) {
                //     for (let x = 0; x < depthCanvas.width; x++) {
                //         const index = y * depthCanvas.width + x;
                //         const depthValue = depthData[index] * 255;  // Normalize to [0, 255]
                //         const pixelIndex = index * 4;
                //         imageData.data[pixelIndex] = depthValue;      // Red
                //         imageData.data[pixelIndex + 1] = depthValue;  // Green
                //         imageData.data[pixelIndex + 2] = depthValue;  // Blue
                //         imageData.data[pixelIndex + 3] = 255;         // Alpha
                //     }
                // }
                // console.log({ imageData });
                // depthContext.putImageData(imageData, 0, 0);
                // // canvasContext.drawImage(depthCanvas, 0, 0);

            };

                
        } else {
            let problem = "No Coco SSD model found (Object Detection)";
            if (problems.includes(problem)) return;
            else setProblems((problems: any) => [...problems, problem]);
        };
    };

    const startDetecting = async () => {
        const detectInterval = setInterval(detectFaces, 20)
        setDetectInterval(detectInterval)
    };

    const loadModels = async () => {
        const ssd = await cocoSsd.load();
        const blazefaceModel = await blazeface.load();
        // const model = poseDetection.SupportedModels.MoveNet;
        // const detector = await poseDetection.createDetector(model);
        // const depthEstimationModel = depthEstimation.SupportedModels.ARPortraitDepth;
        // const estimator = await depthEstimation.createEstimator(depthEstimationModel);
        const mnet = await mobilenet.load();
        
        // console.log(
        //     "webcamProps: ",
        //     // await navigator.mediaDevices,
        //     // devices,
        //     ssd, blazefaceModel
        // );

        modelStore.setSsd(ssd);
        modelStore.setBlazeface(blazefaceModel);
        // modelStore.setPoseDetector(detector);
        // modelStore.setDepthEstimator(estimator);
        modelStore.setMobileNet(mnet);


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
            modelStore.ssd && modelStore.blazeface && modelStore.mobileNet
        ) startDetecting();
    }, [modelStore.ssd, modelStore.blazeface, modelStore.mobileNet]);

    useEffect(() => {
        // // If the camera is reopened from the image view, ...
        // // ... reset the image classification
        // actions.handleImageClassification(null);
        // const videoElement = videoRef.current;
        // videoElement.srcObject = mediaStream;
        // videoElement.play();
        // console.log('videoEL: ', videoElement);

        (async () => {
            await tf.ready().then(() => { 
                console.log(JSON.stringify(tf.getBackend())) 
            });
            const models = await loadModels();
            console.log({ models });
        })();

        return () => {
            clearInterval(detectInterval);
            // if (mediaStream) mediaStream.getTracks().forEach((track: any) => track.stop());
            // setMediaStream(null);
            setClassifiedImage(null);

        };

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
                                <canvas ref={depthRef} style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, right: 0, zIndex: 1 }} />
                                <canvas ref={canvasRef} style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, right: 0, zIndex: 1 }} />
                                <video ref={videoRef} style={{ height: '100%', width: '100%', position: 'absolute', bottom: 0, right: 0, zIndex: 10 }} />
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
                                    {classifiedImage && classifiedImage?.map((item: any, index: number) => (
                                        <>
                                            <ListItemText key={index} primary={item.className} />
                                            <Typography variant="body1">
                                                {item.probability.toFixed(2) + '% Probability'}
                                            </Typography>
                                        </>
                                    ))}
                                    <Divider />
                                    {facesDetected && (
                                        <Typography variant="body1">
                                            {facesDetected} Faces Detected
                                        </Typography>
                                    )}
                                </Stack>
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