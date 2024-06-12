// Packages
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Box, Typography, List, ListItemText, IconButton, Skeleton } from '@mui/material';
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { styled } from '@mui/material/styles';
import { Settings as SettingsIcon, Camera as CameraIcon } from '@mui/icons-material';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';

import { useCameraStore } from '../store';
import { client, queryPaths } from '../api';


const ImageViewContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
}))

const ImageView = () => {
    const cameraStore = useCameraStore();

    const handleSendImage = async () => {

        // Remove all functions from cameraStore
        const cameraStoreData = Object.assign(
            {}, 
            ...Object
                .keys(cameraStore)
                .map((key: string) => (typeof((cameraStore as any)[key]) !== 'function') && ({ [key]: (cameraStore as any)[key] }))
                .filter(Boolean)
        );

        const payload = {
            appId: "smartcamera",
            source: "5175",
            data: {
                cameraStoreData,
                crossPlatformState: (window as any).crossPlatformState
            }
        };

        console.log("handleSendImage: ", {
            currentAppStores: {cameraStoreData}, 
            incomingPlatformState: (window as any)?.crossPlatformState, 
            outgoingPlatformState: payload
        });

        const response = await client.post(
            queryPaths.getCrossPlatformState, 
            payload
        );
        
        if (response.status === 200) {
            // let baseUrl = `http://localhost:${window.crossPlatformState.source}`;
            let baseUrl = "";
            let queryParams = `?appId=${payload.appId}&source=${payload.source}&session_id=${response.data.session_id}`;
            let nextUrl = (baseUrl + queryParams);
            nextUrl = "http://localhost:3002";
            window.location.href = nextUrl;
        };
    }

    const navItems = {
        "Settings": (
            <IconButton onClick={() => {}}>
                <SettingsIcon />
            </IconButton>
        ),
        "Edit": (
            <IconButton color="inherit">
                <EditIcon />
            </IconButton>
        ),
        "Download": (
            <IconButton>
                <DownloadIcon />
            </IconButton>
        ),
        "Camera": (
            <IconButton onClick={() => {}}>
                <CameraIcon />
            </IconButton>
        ),
        "Send": (
            <IconButton onClick={handleSendImage}>
                <SendIcon />
            </IconButton>
        )
    }

    return (
        <ImageViewContainer>
            <LazyLoadImage 
                effect="opacity" 
                loading="lazy" 
                src={cameraStore.imageSrc || ""}
                alt="Captured image" 
                style={{ maxWidth: '100%', marginTop: "24px" }} 
            />
            <List sx={{ px: 2 }}>
                <Typography variant="subtitle2">
                    Machine Learning model <b>MobileNet</b> Image Classification
                </Typography>
                {cameraStore.imageClassification 
                    ? cameraStore.imageClassification
                        .map((classification: any) => (
                            <ListItemText
                                primary={classification?.className}
                                secondary={classification?.probability.toFixed(2) + '% Probability'}
                            />
                        )) : (
                            <Skeleton variant="rectangular" width="100%" height={40} />
                        )}
            </List>
            <BottomNavigation
                showLabels
                // value={props.tab}
                // onChange={handleNavChange}
                sx={{ zIndex: 1000 }}
            >
                {Object
                    .keys(navItems)
                    .map((item, index) => (
                        <BottomNavigationAction
                            key={index} 
                            label={item} 
                            icon={(navItems as any)[item]}
                            sx={{ color: "#222" }}
                        />
                ))}
            </BottomNavigation>
        </ImageViewContainer>
    )
}

export default ImageView