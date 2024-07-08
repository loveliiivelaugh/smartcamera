
export const useCrossPlatformQueryParams = () => {
    // Check URL Params
    const { search, pathname } = window.location;
    const [crossPlatformStateId, ] = search 
        ? search.split('?')[1].split('=')[1].split('&')
        : [null, null];

    const isCrossPlatform = pathname.includes('cross_platform');

    return {
        crossPlatformStateId,
        isCrossPlatform
    }
};