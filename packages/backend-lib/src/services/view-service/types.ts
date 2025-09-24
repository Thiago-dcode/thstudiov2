export type ViewData = {
    [key: string]: any;
}
export type ViewConfig = {
    basePath: string;
    globals?: ViewData;
}

export type ViewServiceEngine = 'pug' | 'edge' | 'ejs';