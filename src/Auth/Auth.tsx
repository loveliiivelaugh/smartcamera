import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Box } from '@mui/material';
import { create } from 'zustand';
// import './index.css'

const {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_PUBLIC_KEY: supabaseAnonKey,
} = import.meta.env;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SupabaseStoreTypes {
    session: any
    setSession: (session: any) => void
}

export const useSupabaseStore = create<SupabaseStoreTypes>((set) => ({
    session: null,
    setSession: (session: any) => set(() => ({ session })),
}))

export function SupabaseAuthProvider({ children }: any) {
    const supabaseStore = useSupabaseStore();
    const [session, setSession] = useState(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
            setSession(session)
            supabaseStore.setSession(session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setSession(session)
            supabaseStore.setSession(session)
        })


        return () => subscription.unsubscribe()
    }, [])

    console.log({ session })

    if (!session) {
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
            >
                <Auth 
                    supabaseClient={supabase} 
                    appearance={{ theme: ThemeSupa }} 
                    redirectTo='http://localhost:3000/authenticated'
                />
            </Box>
        )
    }
    else return children(session);
}