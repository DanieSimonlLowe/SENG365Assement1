import * as hasher from "bcrypt";
import {Request} from "express";
import {getPool} from "../../config/db";

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

const getUserId = async (token: string) : Promise<number> => {
    const query = 'SELECT id FROM user WHERE auth_token = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [token]);
    await conn.release();
    if (result.length < 1) {
        return null;
    }
    return result[0].id;
}


export {generatePasswordHash,generateToken,checkPassword,checkToken,getAuthToken,getUserId};