// Packages
import { useMemo } from 'react';
import { createTheme, CssBaseline } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@emotion/react';
import { motion } from "framer-motion"


const useTheme = ({ mode, themeConfig }: { mode: string, themeConfig: any }) => useMemo(() => createTheme({
  ...themeConfig,
  ...themeConfig[mode],
}), [mode])

export const ThemeProvider = ({ children, themeConfig }: { children: React.ReactNode, themeConfig: any }) => {
  // const system = useSelector((state) => state.system)
  const theme = useTheme({ mode: 'dark', themeConfig })

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
        {children}
    </MuiThemeProvider>
  )
}

export const PageTransitionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { 
          opacity: 0,
          transition: { duration: 0.35 }
        }
      }}
    >
      {children}
    </motion.div>
  )
}
