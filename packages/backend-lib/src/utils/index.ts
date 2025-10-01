import  net from 'node:net';
import fs from 'node:fs';

const checkPortOrGetNext =async (port: number = 3000): Promise<number> => {
    let _port = parseInt(port.toString());
    if(isNaN(_port)) {
        _port = 3000;
    }
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(_port, () => {
            resolve(_port);
        });

        server.on('error', async (err) => {
            if((err as any)?.code === 'EADDRINUSE') {
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
}

const generateUUID = async () => {
    const uuidv4 = await import('uuid').then(module => module.v4);
    return uuidv4();
}
const randomStr = (length: number) => {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const generateString = (length: number) => {
        let result = '';
        const charactersLength = characters.length;
        for ( let i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result.trim();
    }
    return generateString(length);
}
const checkFileExistsAsync = async (file: string) => {
    return await fs.promises.access(file, fs.constants.F_OK)
             .then(() => true)
             .catch(() => false)
  }

export { checkPortOrGetNext, generateUUID, checkFileExistsAsync, randomStr };