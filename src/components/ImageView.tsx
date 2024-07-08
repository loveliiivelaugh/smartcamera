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
import { useSupabaseStore } from '../Auth/Auth';
import * as cpxScripts from '../cpxHelpers/cpxScripts';


const ImageViewContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
}))

const ImageView = () => {
    const cameraStore = useCameraStore();
    const supabaseStore = useSupabaseStore();

    console.log('cameraStore: ', cameraStore, 'supabaseStore: ', supabaseStore)
    const textfieldRef = useRef(null);

    const handleSendImage = async () => {

        // Make a copy of the current cameraStore state
        // Remove all functions and unnecessary data from cameraStore
        const cameraStoreData = Object.assign(
            {}, 
            ...Object
                .keys(cameraStore)
                .map((key: string) => ( 
                    (typeof((cameraStore as any)[key]) !== 'function') 
                    && !['appConfig', 'websocketClient'].includes(key) 
                ) && ({ [key]: (cameraStore as any)[key] }))
                .filter(Boolean)
        );

        console.log('cameraStoreData: ', cameraStoreData);
        await cpxScripts.handleNextApp({
            app: "AI", // TODO: Ideally grab this app from the cpx data -- the app it should go back to
            apps: cameraStore.appConfig.cms.apps,
            session: supabaseStore.session,
            data: {
                cameraStoreData: { 
                    ...cameraStoreData, 
                    message: (textfieldRef as any)?.current?.value
                },
                crossPlatformState: supabaseStore.cpxData
            },
        });
    };

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
            <IconButton onClick={() => cameraStore.handleView("camera")}>
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
                src={(cameraStore.imageSrc) || ""}
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

                {(supabaseStore.cpxData?.appId === "AI") 
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