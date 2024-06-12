import { create } from 'zustand'

interface CameraStore {
    view: string
    imageSrc: string | null
    imageClassification: any
    visionMode: string
    handleView: (view: "launching" | "chat" | "image" | "voice") => void
    handleImageSrc: (imageSrc: string) => void
    handleImageClassification: (imageClassification: any) => void
    toggleVisionMode: (visionMode: "default" | "documents") => void
}


const useCameraStore = create<CameraStore>((set) => ({
    view: "camera",
    imageSrc: null,
    imageClassification: null,
    visionMode: 'default',
    handleView: (view: "launching" | "chat" | "image" | "voice") => set((state: CameraStore) => ({ ...state, view })),  // String ["launching", "chat", "image", "voice"]
    handleImageSrc: (imageSrc: string) => set(() => ({ imageSrc })), // String Base64 image
    handleImageClassification: (imageClassification: any) => set(() => ({ imageClassification })), // Object {}
    toggleVisionMode: (visionMode: "default" | "documents") => set(() => ({ visionMode })), // String ["Default", "Documents", "Receipts"]
}));


interface KeycloakStore {
    auth: boolean
    authToken: string | null
    keycloakUser: any
    setKeycloakUser: (keycloakUser: any) => void
    setAuthToken: (token: string) => void
    setAuth: (auth: boolean) => void
}

const useKeycloakStore = create<KeycloakStore>((set) => ({
    // states
    auth: false,
    authToken: null,
    keycloakUser: null,
    setKeycloakUser: (keycloakUser: any) => set(() => ({ keycloakUser })),
    setAuthToken: (token: string) => set(() => ({ authToken: token })),
    setAuth: (auth: boolean) => set(() => ({ auth })),
}));

// Camera Scripts
const compareLandmarks = (landmarks1: any, landmarks2: any) => {

    if (landmarks2?.probability[0] > 0.5) {
        
        const isInRange = (value: number) => ((value >= 0.6) && (value <= 1.4));
        
        const isTopLeftMatch = landmarks1.topLeft.every((value: number, index: number) => isInRange(value / landmarks2.topLeft[index]));
        const isBottomRightMatch = landmarks1.bottomRight.every((value: number, index: number) => isInRange(value / landmarks2.bottomRight[index]));
        const isLandmarksMatch = landmarks1.landmarks.every((landmark1: any, index: number) => landmark1.every((value: number, i: number) => isInRange(value / landmarks2.landmarks[index][i])));
        
        return (isTopLeftMatch && isBottomRightMatch && isLandmarksMatch);
    }
    else return false
};


export { 
    useCameraStore, 
    useKeycloakStore, 
    compareLandmarks
}
