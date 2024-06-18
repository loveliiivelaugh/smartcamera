// Packages
import { useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Box, Typography, List, ListItemText, IconButton, Skeleton, TextField } from '@mui/material';
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { styled } from '@mui/material/styles';
import { Settings as SettingsIcon, Camera as CameraIcon } from '@mui/icons-material';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';

import { useCameraStore } from '../store';
import { client, queries, queryPaths } from '../api';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseStore } from '../Auth/Auth';


const ImageViewContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
}))

const ImageView = () => {
    const cameraStore = useCameraStore();
    const supabaseStore = useSupabaseStore();
    const contentQuery = useQuery(queries.getContent());

    const textfieldRef = useRef(null);

    const handleSendImage = async () => {

        // Make a copy of the current cameraStore state
        // Remove all functions from cameraStore
        const cameraStoreData = Object.assign(
            {}, 
            ...Object
                .keys(cameraStore)
                .map((key: string) => (typeof((cameraStore as any)[key]) !== 'function') && ({ [key]: (cameraStore as any)[key] }))
                .filter(Boolean)
        );

        function getApp(appName: string) {
            return (contentQuery as any).data.apps
                .find(({ name }: { name: string }) => (name === appName));
        };

        // get the current app metadata
        const thisApp = getApp("camera");
        // get the next app metadata
        const nextApp = getApp("AI");

        // get the next app url
        const link = (import.meta.env.MODE === "development")
            ? nextApp.dev_url
            : nextApp.url;

        console.log({ thisApp, nextApp })

        // Format the cross platform state
        const payload = {
            appId: thisApp?.name,
            source: thisApp?.dev_url,
            destination_url: link,
            destination_app: nextApp?.name,
            data: {
                cameraStoreData: { 
                    ...cameraStoreData, 
                    message: (textfieldRef as any)?.current?.value
                },
                crossPlatformState: (window as any).crossPlatformState
            },
            user_id: (supabaseStore.session.user?.id || null)
        };

        console.log("handleSendImage: ", {
            currentAppStores: {cameraStoreData}, 
            incomingPlatformState: (window as any)?.crossPlatformState, 
            outgoingPlatformState: payload,
            payload
        });

        // Send the cross platform state to the db
        const response = (await client.post(
            queryPaths.getCrossPlatformState, 
            payload
        ));

        console.log("handleSendImage response: ", response);
        
        if (response.status === 200) {
            let queryString = `${link}/cross_platform?id=${response.data[0].id}`;
            window.location.href = queryString;
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

                {((window as any)?.crossPlatformState?.appId === "AI") 
                    && (
                        <TextField
                            inputRef={textfieldRef}
                            id="outlined-multiline-static"
                            label="Message"
                            placeholder="Test Message"
                            fullWidth
                        />
                    )
                }
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