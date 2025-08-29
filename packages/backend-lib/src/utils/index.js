"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPortOrGetNext = void 0;
const node_net_1 = __importDefault(require("node:net"));
const checkPortOrGetNext = async (port = 3000) => {
    let _port = parseInt(port.toString());
    if (isNaN(_port)) {
        _port = 3000;
    }
    return new Promise((resolve, reject) => {
        const server = node_net_1.default.createServer();
        server.listen(_port, () => {
            resolve(_port);
        });
        server.on('error', async (err) => {
            if (err?.code === 'EADDRINUSE') {
                const nextPort = await checkPortOrGetNext(_port + 1);
                resolve(nextPort);
            }
            reject(err);
        });
        server.on('listening', () => {
            resolve(_port);
            server.close();
        });
    });
};
exports.checkPortOrGetNext = checkPortOrGetNext;
