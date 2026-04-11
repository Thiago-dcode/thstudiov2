export const generateUUID = async () => {
    const uuidv4 = await import('uuid').then(module => module.v4);
    return uuidv4();
}