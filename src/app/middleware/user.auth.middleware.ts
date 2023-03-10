import * as hasher from "bcrypt";
import {Request} from "express";

const rounds: number = 8;
async function generateToken(email: string, password: string): Promise<string> {
    return hasher.hash(email + ":" + password, rounds);
}

function checkToken(email: string, password: string, token: string): Promise<boolean> {
    return hasher.compare(email + ":" + password, token);
}

function generatePasswordHash( password: string): Promise<string> {
    return hasher.hash(password,rounds);
}

function checkPassword(password: string, hash: string): Promise<boolean> {
    return hasher.compare(password, hash);
}

function getAuthToken(req: Request) : string {
    if (req.headers.hasOwnProperty("x-authorization")) {
        return req.headers["x-authorization"] as string;
    } else {
        return "";
    }
}


export {generatePasswordHash,generateToken,checkPassword,checkToken,getAuthToken};