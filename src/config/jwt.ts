import sign from 'jwt-encode';
import { v4 as uuidv4 } from 'uuid';


const sessionID = uuidv4();

type JWTSessionType = {
    user: {
        id: string;
    };
    access_token: string;
    refresh_token?: string;
}

export function encodeJWT(session: JWTSessionType) {
    return sign(
        { 
            user_id: session.user.id,
            sub: session.access_token,
            app_id: window.location.origin,
            session_id: sessionID,
            refresh_token: session.refresh_token,
            exp: Math.floor(Date.now() / 1000) + (60 * 60),
            iat: Math.floor(Date.now() / 1000)
        }, 
        import.meta.env.VITE_JWT_SECRET
        // { expiresIn: "1h" }
    );
}