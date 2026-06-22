import path from "path";

// Resolve views relative to THIS compiled file rather than process.cwd().
// At runtime this file lives at <root>/common/utils/index.js (dist) or
// <root>/common/utils/index.ts (ts tests), so the views sit two levels up under
// resources/views. Using cwd broke in Docker, where the API runs from the monorepo
// root (/workspace) and would look in /workspace/src instead of the app directory.
export const VIEWS_PATH = path.join(__dirname, '..', '..', 'resources', 'views');


export const viewPath = (view: string) => {
    return path.join(VIEWS_PATH, view);
}

const isTruthyEnv = (value: string | undefined) => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export const isRegistrationClosed = () => {
    return isTruthyEnv(process.env.REGISTRATION_IS_CLOSED);
}

