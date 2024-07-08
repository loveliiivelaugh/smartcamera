import { useState } from "react"
import { v4 as uuidv4 } from 'uuid';

import { useWebsockets } from "../../config/useWs";
import { useCameraStore, useModelStore } from "../../store";
import { client } from "../../api";


const cameraId = uuidv4();

export const useCameraScripts = () => {

    const ws = useWebsockets();

    const cameraStore = useCameraStore();
    const modelStore = useModelStore();

    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);


    const wantMimeType = 'video/webm;codecs=vp8,opus';

    const cameraScripts = {

        // Recording Logic
        handleDataAvailable: (event: BlobEvent) => {
            console.log("handleDataAvailable: ", event.data)
            if (event.data.size > 0) {
                cameraStore.setVideoChunks((prevChunks: any) => [...prevChunks, event.data]);
                console.log("handleDataAvailable.videoChunks: ", cameraStore.videoChunks)
                ws.send(JSON.stringify(event.data)); // For websocket streaming | SecurityHub microservice
            };
        },

        handleStartCaptureClick: (webcam: any, mediaRecorder: any) => {
            console.log("handleStartCaptureClick: ", webcam)
            if (webcam && (webcam as any).video.srcObject) {
                cameraStore.setCapturing(true);
                
                mediaRecorder = new MediaRecorder((webcam as any).video.srcObject as MediaStream, {
                    mimeType: wantMimeType
                });
    
                setStartTime(Date.now());
    
                const recorder = mediaRecorder;
                recorder.ondataavailable = cameraScripts.handleDataAvailable;
    
                recorder.start(10000); // 10 seconds
                // recorder.start();
                console.log("mediaRecorderRef: ", recorder)
            }
        },

        handleStopCaptureClick: (mediaRecorder: any) => {
            console.log("handleStopCaptureClick: ", mediaRecorder)
            if (mediaRecorder) {
                mediaRecorder.stop();
    
                setEndTime(Date.now());
                cameraStore.setCapturing(false);
    
                // console.log("videoChunks: ", videoChunks)
                
            }
        },
    
        handleSaveVideo: async (mediaRecorder: any) => {
            let mimetype = (mediaRecorder as any).mimeType;
            // console.log("mimetype: ", mimetype, videoChunks)
    
            const blob = new Blob(cameraStore.videoChunks, { type: mimetype });
    
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
            cameraStore.setVideoChunks([]);
    
            // console.log("restarting recording: ", {videoChunks, capturing})
            // if (!capturing && automatedStart) handleStartCaptureClick();
        },

        // AI/ML Camera Logic
        getAdjacentKeyPoints: (keypoints: any, minConfidence: number) => {
            const connectedPartIndices = [
                [5, 7], [7, 9], [6, 8], [8, 10],
                [5, 6], [5, 11], [6, 12], [11, 12],
                [11, 13], [13, 15], [12, 14], [14, 16]
            ];
        
            return connectedPartIndices.filter((indices) => {
                return (
                    keypoints[indices[0]].score >= minConfidence &&
                    keypoints[indices[1]].score >= minConfidence
                );
            }).map((indices) => {
                return [keypoints[indices[0]], keypoints[indices[1]]];
            });
        },

        detectFaces: async (canvasRef: any, videoRef: any, webcamRef: any) => {

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
                    // console.log({ predictions });
                    cameraStore.setClassifiedImage(predictions);

                    if (predictions.map(({ className }: { className: string }) => className).includes("document")) {
                        client.post('/api/sensative?endpoint=/api/v1/camera/document', { imageSrc });
                    };
                };
    
                // Facial Recognition
                if (modelStore.blazeface) {
                    const facialRecognition = await modelStore.blazeface.estimateFaces(image);
    
                    // console.log({ facialRecognition });
                    cameraStore.setFacesDetected(facialRecognition.length);
    
                    // facialRecognition.forEach((face: any) => {
                    //     canvasContext.strokeStyle = 'yellow';
                    //     canvasContext.strokeRect(face.box?.[0], face.box?.[1], face.box?.[2], face.box?.[3]);
                    // });
    
    
                    // Drawing facial recognition results
                    facialRecognition.forEach((face: any) => {
                        const { topLeft, bottomRight, landmarks } = face;
    
                        const x = topLeft[0];
                        const y = topLeft[1];
                        const width = bottomRight[0] - topLeft[0];
                        const height = bottomRight[1] - topLeft[1];
                        canvasContext.strokeStyle = 'green';
                        canvasContext.strokeRect(x, y, width, height);
    
                        landmarks.forEach((landmark: any) => {
                            canvasContext.beginPath();
                            canvasContext.arc(landmark[0], landmark[1], 2, 0, 2 * Math.PI);
                            canvasContext.fillStyle = 'yellow';
                            canvasContext.fill();
                        });
                    });
                    // const isMichaelsFace = compareLandmarks(michaelsFacialLandmarks, facialRecognition[0]);
                    // if (isMichaelsFace) {
                    //     canvasContext = {}
                    //     console.log({ detectInterval })
                    //     clearInterval(detectInterval);
                    //     actions.setIsAuthenticated(true)
                    //     // navigate('/')
                    // }
                };
    
                // Object Detection
                if (modelStore.ssd) {
                    const objectDetected = await modelStore.ssd.detect(image);
    
                    // console.log({ objectDetected });
                    
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
    
                // Pose Detection
                if (modelStore.detector) {
                    const poses = await modelStore.detector.estimatePoses(image);
    
                    // console.log({ poses }); 
                    
                    // Drawing pose estimation results
                    poses.forEach((pose: any) => {
                        pose.keypoints.forEach((keypoint: any) => {
                            if (keypoint.score > 0.5) {
                                canvasContext.beginPath();
                                canvasContext.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                                canvasContext.fillStyle = 'blue';
                                canvasContext.fill();
                            }
                        });
    
                        const adjacentKeyPoints = cameraScripts.getAdjacentKeyPoints(pose.keypoints, 0.5);
                        adjacentKeyPoints.forEach((keypoints: any) => {
                            canvasContext.beginPath();
                            canvasContext.moveTo(keypoints[0].x, keypoints[0].y);
                            canvasContext.lineTo(keypoints[1].x, keypoints[1].y);
                            canvasContext.strokeStyle = 'blue';
                            canvasContext.lineWidth = 2;
                            canvasContext.stroke();
                        });
                    });
                };
    
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
                if (cameraStore.problems.includes(problem)) return;
                // else cameraStore.setProblems((problems: any) => [...problems, problem]);
            };
        },

        capture: async (cameraStore: any, webcam: any) => {
            const imageSrc = webcam.getScreenshot();
            cameraStore.handleImageSrc(imageSrc);
            cameraStore.handleView("image");
        },

        startDetecting: async (canvasRef: any, videoRef: any, webcamRef: any) => {
            const detectInterval = setInterval(() => cameraScripts.detectFaces(canvasRef, videoRef, webcamRef), 20)
            cameraStore.setDetectInterval(detectInterval)
        },

        // Camera Logic
        handleDoubleClick: (event: any, cameraStore: any) => {
            console.log("Camera handleDoubleClick: ", event)
            cameraStore.setVideoConstraints((prev: any) => ({
                ...prev,
                facingMode: prev.facingMode === "user"
                    ? "environment"
                    : "user"
            }))
        },

        // Needs to be rewritten to use cameraStore
        handleDownload: (recordedChunks: any, setRecordedChunks?: any) => {
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
        },

    }

    return cameraScripts
};
