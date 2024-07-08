import { hc } from 'hono/client';

export const useWebsockets = () => {

    const websocketClient = hc('http://localhost:5001');
    const ws = websocketClient.ws.$ws(0);

    ws.addEventListener('open', () => {
        console.log('WebSocket connected');
    });

    return ws
};