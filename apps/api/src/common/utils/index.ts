import path from "path";

export const SRC_PATH = path.join(process.cwd(), 'src');


export const viewPath = (view: string) => {
    return path.join(SRC_PATH, 'resources', 'views', view);
}