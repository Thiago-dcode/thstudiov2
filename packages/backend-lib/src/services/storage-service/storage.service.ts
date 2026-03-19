
export abstract class StorageService {
    public abstract setup(): Promise<void>;
    public abstract write(file: Express.Multer.File, path: string): Promise<boolean>;
    public abstract writeAnGet(file: Express.Multer.File, path: string): Promise<string|null>;
    /**
     * @param config.expireIn - Custom expiration in **seconds**. Implementations should fall back to their default expiration when omitted.
     */
    public abstract getUrl(path: string, config?: {
        expireIn?: number
    }): Promise<string>;
    public abstract read(path: string): Promise<File>;
    public abstract delete(path: string): Promise<boolean>;
    public abstract list(path: string): Promise<File[]>;
    public abstract exists(path: string): Promise<boolean>;
}