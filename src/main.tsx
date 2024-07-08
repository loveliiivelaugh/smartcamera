import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Utilities
// import { SupabaseAuthProvider } from './Auth/Auth';
import { SupabaseAuthProvider } from './Auth/Auth2';
import { PageTransitionWrapper, ThemeProvider } from './theme/ThemeProvider';
import { CrossPlatformProvider } from './cpxHelpers/CpxProvider.tsx';
import { queries } from './api';

// App + styles
import App from './App.tsx'
import './index.css'
import BackToHome from './components/BackToHome.tsx';


const queryClient = new QueryClient();


// On Apps First Load
const InitConfigProvider = ({ children }: any) => {
    const initConfigQuery = useQuery(queries.initConfigQuery);
    console.log("initConfigQuery: ", initConfigQuery);
    return ({
        pending: "Uninitialized...",
        loading: "Loading App Theme Configuration...",
        success: children((initConfigQuery as any)?.data?.themeConfig),
        error: (
            <BackToHome
                message={{ 
                    element: (
                        <h1>Oops! Something went wrong.</h1>
                    )
                }}
            />
        )
    }[initConfigQuery.status]);
};


export const Providers = ({ children }: { children: any }) => {
    return (
        <SupabaseAuthProvider>
            <QueryClientProvider client={queryClient}>
                <CrossPlatformProvider>
                    <InitConfigProvider>
                        {(themeConfig: any) => (
                            <ThemeProvider themeConfig={themeConfig}>
                                <PageTransitionWrapper>
                                    {children}
                                </PageTransitionWrapper>
                            </ThemeProvider>
                        )}
                    </InitConfigProvider>
                </CrossPlatformProvider>
            </QueryClientProvider>
        </SupabaseAuthProvider>
    )
}

createRoot(document.getElementById('root')!)
    .render(
        <StrictMode>
            <Providers>
                <App />
            </Providers>
        </StrictMode>
    );
