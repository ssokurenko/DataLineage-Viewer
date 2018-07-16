import * as http from "http";
import SocketIO = require("socket.io");

export class SocketIOServer {
    private readonly _IO: SocketIO.Server;
    private readonly _Clients: { [id: string]: SocketIO.Socket };

    constructor(httpServer: http.Server) {
        this._Clients = {};
        this._IO = SocketIO(httpServer);
        this._IO.on("connection", this.onClientConnect.bind(this));
    }

    private onClientConnect(socket: SocketIO.Socket): void {
        console.log(`a user connected from ${socket.client.conn.remoteAddress}`);
        this._Clients[socket.client.id] = socket;
        socket.on("disconnecting",
            reason => {
                console.log(`One client (id: ${socket.client.id}) is disconnecting with the reason '${reason}'`);
                delete this._Clients[socket.client.id];
            });
    }

    sendMessage(clientId: string, event: string, msg: any): void {
        if (!clientId) return;
        if (this._Clients[clientId]) {
            try {
                this._Clients[clientId].emit(event, msg);
            } catch (e) {
                console.error(`send message to client (id:${clientId}, ip:${this._Clients[clientId].client.conn.remoteAddress}) faile with error ${e}`);
            }
        } else {
            console.warn(`Can't find client with id ${clientId}`);
        }
    }
}

const io: { server: SocketIOServer } = {} as any;
export default io;
export function initIOServer(httpServer: http.Server) {
    io.server = new SocketIOServer(httpServer);
}