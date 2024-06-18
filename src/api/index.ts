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
    "appConfig": "/api/appConfig",
    "appDepotUrl": (import.meta.env.MODE === "development")
        ? "http://localhost:3000"
        : import.meta.env.VITE_HOME_APP,
    "hostname": (import.meta.env.MODE === "development")
        ? "http://localhost:5001"
        : import.meta.env.VITE_HOSTNAME
};

// Client Config + Init
const client = axios.create({
    baseURL: queryPaths.hostname,
    headers: {
        "Content-Type": "application/json",
    },
    auth: {
        username: import.meta.env.VITE_BASIC_AUTH_USERNAME,
        password: import.meta.env.VITE_BASIC_AUTH_PASSWORD
    },
});

let crossPlatformData: any // temp state 
// Queries
const queries = {
    getCrossPlatformState: () => ({
        queryKey: ['crossPlatformState'],
        queryFn: async () => (await client.get(queryPaths.getCrossPlatformState)).data,
        select: (data: CrossPlatformState) => {
            (window as any).crossPlatformState = data;
            return data;
        },
    }),

    getContent: () => ({
        queryKey: ['content'],
        queryFn: async () => (await client.get(queryPaths.content)).data
    }),

    initConfigQuery: ({
        queryKey: ['appConfig'],
        queryFn: async () => (await client.get(queryPaths.appConfig)).data,
        select: (data: any) => {
            const { cms, themeConfig, crossPlatformStateTable } = data;

            // Check URL Params
            const { search, pathname } = window.location;

            const [, crossPlatformStateId] = search 
                ? search.split('?')[1].split('=') 
                : [null, null];

            const isCrossPlatform = pathname.includes('cross_platform');

            crossPlatformData = crossPlatformStateId
                ? crossPlatformStateTable
                    .find((session: any) => (session.id == crossPlatformStateId))
                : null;

            (window as any).appContent = cms ? cms : null;
            (window as any).crossPlatformState = crossPlatformData ? crossPlatformData : null;

            return { cms, themeConfig, crossPlatformData, isCrossPlatform };
        }
    }),
};

export {
    client,
    queries,
    queryPaths
};