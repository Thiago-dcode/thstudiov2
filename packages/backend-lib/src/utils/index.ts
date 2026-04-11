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
const checkFileExistsAsync = async (file: string) => {
    return await fs.promises.access(file, fs.constants.F_OK)
             .then(() => true)
             .catch(() => false)
  }



export { checkPortOrGetNext,  checkFileExistsAsync};