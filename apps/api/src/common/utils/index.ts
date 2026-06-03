import path from "path";

export const SRC_PATH = path.join(process.cwd(), 'src');


export const viewPath = (view: string) => {
    return path.join(SRC_PATH, 'resources', 'views', view);
}

const isTruthyEnv = (value: string | undefined) => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export const isRegistrationClosed = () => {
    return isTruthyEnv(process.env.REGISTRATION_IS_CLOSED);
}

