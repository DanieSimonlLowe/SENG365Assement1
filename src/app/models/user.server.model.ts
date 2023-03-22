import Logger from "../../config/logger";
import {Request} from "express";
import { getPool } from '../../config/db';
import * as types from "../middleware/typeValidation"

import * as auth from "../middleware/user.auth.middleware"

const make = async (req: Request): Promise<any> => {
    const passwordHash : string = await auth.generatePasswordHash(req.body.password);
    const email : string = req.body.email;
    const firstName : string = req.body.firstName;
    const lastName : string = req.body.lastName;
    const query = 'INSERT INTO user (email,first_name,last_name,password) \n VALUES (?,?,?,?)';
    Logger.info(query);

    const conn = await getPool().getConnection();
    const [ result ] = await conn.query( query, [email,firstName,lastName,passwordHash]);
    await conn.release();

    return {userId: result.insertId};
}

const login = async (email: string, password: string): Promise<any> => {

    const query = 'SELECT password, id FROM user WHERE email = ?';
    const conn = await getPool().getConnection();
    const [ passwords ] = await conn.query( query, [email]);
    await conn.release();
    let isRightPassword : boolean = false;
    let id : number = -1;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i< passwords.length; i++) {
        if (await auth.checkPassword(password, passwords[i].password)) {
            isRightPassword = true;
            id = passwords[i].id;
            i = passwords.length;
        }
    }
    if (isRightPassword) {

        const tok = await auth.generateToken(email,password);
        const conn2 = await getPool().getConnection();
        const query2 = 'UPDATE user SET auth_token = ? WHERE id = ?';
        await conn2.query( query2, [tok, id]);
        await conn2.release();

        return {
            userId: id,
            token: tok
        }
    } else {
        return false;
    }
}


const logout = async (token: string): Promise<void> => {
    const query = 'UPDATE user SET auth_token = NULL WHERE auth_token = ?';
    const conn = await getPool().getConnection();
    await conn.query( query, [token,token]);
    await conn.release();
}

const userExists = async (user: number): Promise<boolean> => {
    const query = 'SELECT * FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [user]);
    await conn.release();
    return result.length !== 0;
}

const get = async (user: number, token: string) : Promise<any> => {
    const query = 'SELECT email, first_name, last_name, auth_token FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [user]);
    await conn.release();
    if (result[0].auth_token === token) {
        return {
            email: result[0].email,
            firstName: result[0].first_name,
            lastName: result[0].last_name
        };
    } else {
        return {
            firstName: result[0].first_name,
            lastName: result[0].last_name
        };
    }

}


const isUser = async (user: number, token: string) : Promise<boolean> => {
    const query = 'SELECT auth_token FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [user]);
    await conn.release();
    if (result.length === 0) {
        return false;
    }
    if (result[0].auth_token === null) {
        return false;
    }
    return token === result[0].auth_token;
}


const rightPassword = async (user: number, password: string) : Promise<boolean> => {
    const query = 'SELECT password FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [user]);
    await conn.release();
    if (result.length === 0) {
        return false;
    }
    if (result[0].password === null) {
        return false;
    }
    return auth.checkPassword(password,result[0].password);
}

const emailInUse = async (email: string) : Promise<boolean> => {
    const query = 'SELECT * FROM user WHERE email = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [email]);
    await conn.release();
    return result.length !== 0;
}

const update = async (req: Request) : Promise<number> => {
    if (!types.isInt(req.params.id)) {
        return 400;
    }
    const id = parseInt(req.params.id,10);

    if (!req.body.hasOwnProperty("currentPassword")) {
        return 401;
    } else if (!types.isString( req.body.currentPassword)) {
        return 401;
    } else if (req.body.currentPassword.length < 6) {
        return 401;
    } else if (!await rightPassword(id,req.body.currentPassword)) {
        return 403;
    }

    const query = 'SELECT auth_token FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [id]);
    await conn.release();
    if (result.length === 0) {
        return 404;
    } else if (result[0].auth_token !== auth.getAuthToken(req)) {
        return 403;
    } else {
        let query2 = 'UPDATE user SET ';
        const values = [];

        if (req.body.hasOwnProperty("email")) {
            if (!types.isString(req.body.email)) {
                return 400;
            }
            query2 += 'email = ?,'
            values.push(req.body.email);
        }
        if (req.body.hasOwnProperty("fisrtName")) {
            if (!types.isString(req.body.fisrtName)) {
                return 400;
            }
            query2 += 'fist_name = ?,'
            values.push(req.body.fisrtName)
        }
        if (req.body.hasOwnProperty("lastName")) {
            if (!types.isString(req.body.lastName)) {
                return 400;
            }
            query2 += 'last_name = ?,'
            values.push(req.body.lastName)
        }
        if (req.body.hasOwnProperty("password")) {
            if (!types.isString(req.body.password)) {
                return 400;
            }
            if (req.body.password.length  < 6) {
                return 400;
            }
            if (req.body.password === req.body.currentPassword) {
                return 403;
            }
            query2 += 'password = ?,'
            const password = await auth.generatePasswordHash(req.body.password);
            values.push(password);
        }
        query2 = query2.substring(0,query2.length-1) +  " WHERE id = ?";
        values.push(id);

        const conn2 = await getPool().getConnection();
        await conn2.query(query2,values);
        await conn2.release();

        return 200;
    }
}




export {make, login,logout,userExists,get,update,isUser,emailInUse,rightPassword}