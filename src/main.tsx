import ReactDOM from 'react-dom/client'
import { StrictMode, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { hc } from 'hono/client';
// import { useShallow } from 'zustand/react/shallow'

// Utilities
import { SupabaseAuthProvider } from './Auth/Auth';
// import { KeycloakProvider } from './Keycloak/KeycloakProvider';  
import { PageTransitionWrapper, ThemeProvider } from './theme/ThemeProvider';
import { client, queries } from './api';

// App + styles
import App from './App.tsx'
import './index.css'
// import { useCameraStore } from './store/index.ts';


const queryClient = new QueryClient();


// On Apps First Load
const InitConfigProvider = (props: any) => {
    const { children, session } = props;
    const initConfigQuery = useQuery(queries.initConfigQuery);
    // const cameraStore = useCameraStore(useShallow((state) => state));

    // Set authentication headers
    const authParams = `userAuthToken=${session?.access_token}&appId=${import.meta.env.VITE_APP_ID}`;
    (client as any).defaults.headers.common["auth-token"] = authParams;

    // // client.ts
    // const websocketClient = hc('http://localhost:5001');
    // const ws = websocketClient.ws.$ws(0);

    // ws.addEventListener('open', () => {
    //     setInterval(() => {
    //         ws.send(JSON.stringify({ 
    //             timestamp: new Date().toString(), 
    //             id: 2, 
    //             appID: "SmartCamera" 
    //         }))
    //     }, 1000);
    // });

    // (window as any).extras = { ws };

    // cameraStore.setWebsocketClient(ws);

    // Initialize Keycloak
    // const [keycloakInstance, setKeycloakInstance] = useState(null as any);
    // useEffect(() => {
    //     const instance = new Keycloak(JSON.parse(import.meta.env.VITE_KEYCLOAK_CONFIG));
    //     setKeycloakInstance(instance);
    // }, []);

    // return;
    // console.log("initConfigQuery: ", initConfigQuery);
    return ({
        pending: "Uninitialized...",
        loading: "Loading App Theme Configuration...",
        success: children((initConfigQuery as any)?.data?.themeConfig),
        error: "Something went wrong..."
    }[initConfigQuery.status]);
};


export const Providers = ({ children }: { children: any }) => {
    return (
        <SupabaseAuthProvider>
            {(session: any) => (
                <QueryClientProvider client={queryClient}>
                    <Suspense fallback="Loading App Configuration...">
                        <InitConfigProvider session={session}>
                            {(themeConfig: any) => (
                                <ThemeProvider themeConfig={themeConfig}>
                                    <PageTransitionWrapper>
                                        {/* <SmoothScroll></SmoothScroll> */}
                                        {children}
                                        {/* <KeycloakProvider keycloakInstance={keycloakInstance}>
                                    </KeycloakProvider> */}
                                    </PageTransitionWrapper>
                                </ThemeProvider>
                            )}
                        </InitConfigProvider>
                    </Suspense>
                </QueryClientProvider>
            )}
        </SupabaseAuthProvider>
    )
}

ReactDOM
    .createRoot(document.getElementById('root')!)
    .render(
        <StrictMode>
            <Providers>
                <App />
            </Providers>
        </StrictMode>
    );
