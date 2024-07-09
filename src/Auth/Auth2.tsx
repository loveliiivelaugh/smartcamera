import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Box, Button, Grid, TextField } from '@mui/material';
import { create } from 'zustand';
import { client, queryPaths } from '../api';
import { encodeJWT } from '../config/jwt';
import { useCameraStore } from '../store';


const useAppConfig = async () => {
    const cameraStore = useCameraStore();
    const [appConfigIsLoading, setAppConfigIsLoading] = useState(true);

    async function getAndSetAppConfig() {
        const appConfigQuery = (await client.get(queryPaths.appConfig)).data;
        cameraStore.setAppConfig(appConfigQuery);
        setAppConfigIsLoading(false);
        return appConfigQuery
    };

    return {
        getAndSetAppConfig,
        appConfigIsLoading
    };
}


interface SupabaseStoreTypes {
    session: any
    setSession: (session: any) => void
}

export const useSupabaseStore = create<SupabaseStoreTypes>((set) => ({
    session: null,
    setSession: (session: any) => set(() => ({ session })),
}));

const {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_PUBLIC_KEY: supabaseAnonKey,
    VITE_GUEST_LOGIN_EMAIL: email,
    VITE_GUEST_LOGIN_PASSWORD: password,
} = import.meta.env;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function SupabaseAuthProvider({ children }: any) {
    const supabaseStore = useSupabaseStore();
    const appConfigHook = useAppConfig();
    const [userType, setUserType] = useState<"admin" | "guest" | null>("admin");

    // Create the JWT and authenticate with server
    async function handleJwtSignIn(session: any) {
        // Encode JWT to enable authentication across microservices
        const token = encodeJWT(session);
        (client as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Authenticate with Server
        await client.post("/auth/v1/login", session);

        // After authentication, get and set app config
        (await appConfigHook).getAndSetAppConfig();
    };

    async function handleGuestSignIn() {
        setUserType("guest");
        await supabase.auth.signInWithPassword({ email, password });
    };

    async function handleSubmit(e: any) {
        e.preventDefault();

        setUserType("admin");
        await supabase.auth.signInWithPassword({
            email: e.target.email.value,
            password: e.target.password.value,
        });
    };

    useEffect(() => {
        // client.get('/auth/v1/protected')
        //     .then((response: any) => {
        //         console.log("auth/v1/protected: ", response.data)
        //     })

        // Listen for auth state changes
        supabase.auth
            .getSession()
            .then(({ data: { session } }: { data: { session: any } }) => {
                supabaseStore.setSession(session)
                handleJwtSignIn(session);
            });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            
            if (!session) setUserType(null);

            supabaseStore.setSession(session)
            handleJwtSignIn(session);
        });

        return () => subscription.unsubscribe()
    }, [])


    if (!supabaseStore.session && !userType) return (
        <Box sx={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Box sx={{ border: "1px solid white", borderRadius: 1, p: 3, display: "block" }}>
                <Button onClick={() => setUserType("admin")}>Continue as Admin</Button>
                <Button onClick={handleGuestSignIn}>Continue as Guest</Button>
            </Box>
        </Box>
    )

    if (!supabaseStore.session && (userType === "admin")) {
        return (
            <Box
                sx={{ 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    minHeight: "100vh",
                    width: "100vw" 
                }}
            >
                <Box sx={{ border: "1px solid white", borderRadius: 2, p: 3, display: "block" }}>
                    <Grid container
                        component="form"
                        onSubmit={handleSubmit}
                    >
                        <Grid item xs={12}>
                            <TextField
                                id="email"
                                type='email'
                                label="Email"
                                variant="outlined"
                                autoComplete="email"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                id="password"
                                type='password'
                                label="Password"
                                variant="outlined"
                                autoComplete="current-password"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 2, pt: 2 }}>
                            <Button variant="outlined" color="error" onClick={() => setUserType(null)}>Cancel</Button>
                            <Button variant="outlined" type="submit">Submit</Button>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        )
    }
    else if ((appConfigHook as any)?.appConfigIsLoading) "Loading App Configuration Settings..."
    else return children;
}