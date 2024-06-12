import axios from 'axios';

// Types
interface CrossPlatformState {
    id: number,
    created_at: string,
    name: string | null,
    url: string | null,
    user_id: string | null,
    source: string | null,
    appId: string | null,
    data: any | null,
    session_id: string | null
};

// Constants
const queryPaths = {
    "getCrossPlatformState": '/api/cross-platform',
    "theme": "/api/theme/themeConfig",
    "content": "/api/cms/content",
    "appDepotUrl": import.meta.env.VITE_HOME_APP
};

// Client Config + Init
const client = axios.create({
    baseURL: import.meta.env.VITE_HOSTNAME,
    headers: {
        "Content-Type": "application/json",
    },
    auth: JSON.parse(import.meta.env.VITE_BASIC_AUTH),
});

// Queries
const queries = {
    getCrossPlatformState: () => ({
        queryKey: ['crossPlatformState'],
        queryFn: async () => (await client.get(queryPaths.getCrossPlatformState)).data,
        select: (data: CrossPlatformState) => {
            (window as any).crossPlatformState = data;
            return data;
        },
    })
};

export {
    client,
    queries,
    queryPaths
};