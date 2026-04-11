import { config } from ".";

export const getConfigValue = <T extends keyof ReturnType<typeof config>>(key: T): ReturnType<typeof config>[T] => config()[key];


