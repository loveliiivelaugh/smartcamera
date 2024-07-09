import { AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home';

// import Camera from './components/CameraView'
import CameraBare from './components/BareCameraView'
import AdvancedCamera from './components/AdvancedCamera/AdvancedCamera';
import ImageView from './components/ImageView'
import { useCameraStore } from './store'
import { queryPaths } from './api'
import { useSupabaseStore } from './Auth/Auth';
// import './App.css'

function App() {
  const cameraStore = useCameraStore();
  const supabaseStore = useSupabaseStore();

  function getLink(apps: any, appName: string = "FamilyApps") {
    const app = apps.find(({ name }: { name: string }) => (name === appName));

    return (import.meta.env.MODE === "development")
      ? app.dev_url
      : app.url
  };

  // console.log("app content", supabaseStore)

  const link = () => {
    return (
      <Typography 
        variant="body1" 
        component="a" 
        href={getLink((window as any)?.appContent?.apps, "Fitness")}
        px={2}
      >
        Back to {supabaseStore.cpxData?.appId}
      </Typography>
    )
  };

  return (
    <>
      <AppBar>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <>
              <IconButton component="a" href={queryPaths.appDepotUrl}>
                  <HomeIcon />
              </IconButton>
              {supabaseStore.cpxData ? link() : <></>}
            </>
              <Typography variant="h6">Smart Camera</Typography> 
              <Avatar src={"M"} sx={{ width: 40, height: 40 }} />
          </Toolbar>
      </AppBar>
      {/* {cameraStore.view === "camera" && <Camera />} */}
      {cameraStore.view === "recordingCamera" && <CameraBare />}
      {cameraStore.view === "camera" && <AdvancedCamera />}
      {cameraStore.view === "image" && <ImageView />}
    </>
  )
}

export default App
