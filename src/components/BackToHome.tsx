import { Box, Button, Stack } from "@mui/material";
import { queryPaths } from "../api";

function BackToHome(props: any) {
    return (
        <Box
            sx={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                minHeight: "100vh",
                // background: "rgba(80, 170, 255, 0.8)",
                width: "100vw" 
            }}
            component={Stack}
        >
            {props?.message?.element && props.message.element}
            <Button variant="contained" color="error" onClick={() => window.open(queryPaths.appDepotUrl, "_parent")}>
                Back to AppDepot
            </Button>
        </Box>
    )
};

export default BackToHome;