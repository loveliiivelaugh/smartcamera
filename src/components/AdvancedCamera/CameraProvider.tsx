import { useEffect, useState } from "react";
import { motion } from "framer-motion"; // not needed
// Importing the tensorflow.js library 
import * as tf from "@tensorflow/tfjs"
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as depthEstimation from '@tensorflow-models/depth-estimation'
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';
import * as mobilenet from '@tensorflow-models/mobilenet';

import { useCameraStore, useModelStore } from "../../store";

// Starting the webgl tf backend
tf.setBackend('webgl'); 

function CameraProvider({ children }: any) {
    const cameraStore = useCameraStore();
    const modelStore = useModelStore();

    const [isModelsLoaded, setIsModelsLoaded] = useState(false);

    const loadModels = async () => {
        const ssd = await cocoSsd.load();
        const blazefaceModel = await blazeface.load();
        const model = poseDetection.SupportedModels.MoveNet;
        const detector = await poseDetection.createDetector(model);
        const depthEstimationModel = depthEstimation.SupportedModels.ARPortraitDepth;
        const estimator = await depthEstimation.createEstimator(depthEstimationModel);
        const mnet = await mobilenet.load();
        
        modelStore.setSsd(ssd);
        modelStore.setBlazeface(blazefaceModel);
        modelStore.setPoseDetector(detector);
        modelStore.setDepthEstimator(estimator);
        modelStore.setMobileNet(mnet);

        const devices = await navigator.mediaDevices.enumerateDevices();
        cameraStore.setAvailableDevices(devices);

        return true;
    };

    useEffect(() => {

        (async () => {
            await tf.ready().then(() => { 
                console.log(JSON.stringify(tf.getBackend())) 
            });
            const models = await loadModels();
            console.log({ models });
            if (models) setIsModelsLoaded(true);
        })();


        return () => {
            cameraStore.handleImageClassification(null);
            setIsModelsLoaded(false);
        };

    }, [])


    return !isModelsLoaded ? "Loading AI/ML Models..." : (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {children}
        </motion.div>
    );
};

export default CameraProvider