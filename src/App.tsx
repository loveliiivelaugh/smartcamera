import { AppBar, Toolbar, Typography, IconButton, Avatar } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home';

import Camera from './components/CameraView'
import ImageView from './components/ImageView'
import { useCameraStore } from './store'
import { queryPaths } from './api'
// import './App.css'

function App() {
  const cameraStore = useCameraStore();
  return (
    <>
      <AppBar>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
              <IconButton component="a" href={queryPaths.appDepotUrl}>
                  <HomeIcon />
              </IconButton>
              <Typography variant="h6">Smart Camera</Typography> 
              <Avatar src={"M"} sx={{ width: 40, height: 40 }} />
          </Toolbar>
      </AppBar>
      {cameraStore.view === "camera" && <Camera />}
      {cameraStore.view === "image" && <ImageView />}
    </>
  )
}

export default App
