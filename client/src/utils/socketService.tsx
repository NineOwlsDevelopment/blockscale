import { io, Socket } from 'socket.io-client';

interface SocketService {
    connect(): void;
    getSocket(): Socket;
    subscribe(eventName: string, callback: Function): void;
    unsubscribe(eventName: string): void;
    emit(eventName: string, data?: any): void;
}

class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io(`${process.env.REACT_APP_SOCKET_URL}`, {
            transports: ['websocket'],
            autoConnect: false,
            withCredentials: true,
        });
    }

    public connect(): void {
        this.socket.connect();
    }

    public getSocket(): Socket {
        return this.socket;
    }

    public subscribe(eventName: string, callback: (...args: any[]) => void): void {
        this.socket.on(eventName, callback);
    }

    public unsubscribe(eventName: string): void {
        this.socket.off(eventName);
    }

    public emit(eventName: string, data?: any): void {
        this.socket.emit(eventName, data);
    }
}

export default new SocketService();
