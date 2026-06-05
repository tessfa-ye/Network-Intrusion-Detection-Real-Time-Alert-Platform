import { io, Socket } from 'socket.io-client';

// Derive the base URL by stripping '/api' from the API_URL if a specific socket URL isn't provided
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket'],
        });
    }
    return socket;
};

export const connectSocket = (token: string) => {
    const s = getSocket();
    s.auth = { token };
    if (!s.connected) {
        s.connect();
    }
    return s;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
