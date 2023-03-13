export default async (email: string): Promise<boolean> => {
    let lastAt: number = -1;
    let lastDot: number = -1;
    for (let i = 0; i < email.length; i++) {
        if (email.charAt(i) === '@') {
            lastAt = i;
        } else if (email.charAt(i) === '.') {
            lastDot = i;
        }
    }
    if (lastAt === -1 || lastDot === -1) {
        return false;
    } else {
        return lastAt + 1 < lastDot;
    }
};