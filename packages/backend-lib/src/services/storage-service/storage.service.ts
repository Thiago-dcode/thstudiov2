
export abstract class StorageService {
    public abstract setup(): Promise<void>;
    public abstract write(file: Express.Multer.File, path: string): Promise<boolean>;
    public abstract getUrl(path: string): Promise<string>;
    public abstract read(path: string): Promise<File>;
    public abstract delete(path: string): Promise<boolean>;
    public abstract list(path: string): Promise<File[]>;
    public abstract exists(path: string): Promise<boolean>;
}