// import { encodeJWT } from "./jwt";
import { client, queryPaths } from "../api";

const isDevEnvironment = (import.meta.env.MODE === "development");

async function handleNextApp(props: any) {
    const { session, app, apps, data } = props;

    // console.log("handleNextApp: ", session, apps, app)

    function getApp(appName: string) {
        return apps.find(({ name }: { name: string }) => (name === appName));
    };

    // get the current app metadata
    const thisApp = getApp("camera");
    // get the next app metadata
    const nextApp = getApp(app);

    // get the next app url
    const link = isDevEnvironment
        ? nextApp.dev_url
        : nextApp.url;

    // Format the cross platform state
    const payload = {
        appId: thisApp?.name,
        source: thisApp?.dev_url,
        destination_url: link,
        destination_app: nextApp?.name,
        data,
        user_id: (session.user?.id || null),
    };

    // Send the cross platform state to the db
    const response = (await client.post(
        queryPaths.getCrossPlatformState, 
        payload
    ));
    
    if (response.status === 200) {
        // // set the secret cookie
        // // only at "Home App" (FamilyApps)   
        // let cookieString = `${import.meta.env.VITE_SECRET_COOKIE}=${encodeJWT(session)}`;
        
        // document.cookie = cookieString;
        
        window.open(response.data.redirect, "_parent");
    }
    else {
        console.error(response, "Something went wrong...");
    }
};

export {
    handleNextApp
};