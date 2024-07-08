import { useEffect, useState } from "react";
import { useCameraStore } from "../store";
import { useSupabaseStore } from "../Auth/Auth";
import { useCrossPlatformQueryParams } from "./useCpxQueryParams";
import { client, queryPaths } from "../api";


export const CrossPlatformProvider = ({ children }: { children: any }) => {
    const supabaseStore = useSupabaseStore();
    const cameraStore = useCameraStore();
    const { 
        crossPlatformStateId, 
        // isCrossPlatform 
    } = useCrossPlatformQueryParams();

    const [isLoading, setIsLoading] = useState(true);

    // This seems to run twice?
    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                
                const crossPlatformQuery = (await client.get(queryPaths.getCrossPlatformState)).data
                
                const crossPlatformData = crossPlatformStateId
                    ? crossPlatformQuery.find((session: any) => (session.id == crossPlatformStateId))
                    : null;
                
                supabaseStore.setCpxData(crossPlatformData);

                const result = await client.delete(queryPaths.getCrossPlatformState + `?id=${crossPlatformStateId}`);

                console.log("delete last cpx entry after retrieval: ", result);

                // Need to move this AppConfig stuff out of here
                const appConfigQuery = (await client.get(queryPaths.appConfig)).data
                cameraStore.setAppConfig(appConfigQuery);

            } catch (error) {
                
                console.error(error, "Error in CrossPlatformProvider");
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    return isLoading 
        ? "Loading..." 
        : children;
};