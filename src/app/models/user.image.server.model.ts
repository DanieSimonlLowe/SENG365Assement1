import {getPool} from "../../config/db";
import * as fs from "fs";
import * as path from "path";

const imageDirectory = './storage/images/';
const defaultPhotoDirectory = './storage/default/';


const get = async (user: number) : Promise<any> => {
    const query = 'SELECT image_filename FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [user]);
    await conn.release();
    if (result.length === 0) {
        return null;
    }
    const pathStr : string = (result[0].image_filename as string);
    if (pathStr === null) {
        return null;
    }
    const extension = pathStr.substring(pathStr.length-4);
    if (extension !== '.png' && extension !== 'jpeg' && extension !== '.jpg' && extension !== '.gif') {
        return null;
    }
    return fs.readFileSync(path.dirname(imageDirectory+pathStr));
};

const set = async (user: number, token: string, img: any, type: string) : Promise<number> => {
    const query = 'SELECT auth_token, image_filename FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [user]);
    await conn.release();
    if (result.length === 0) {
        return 404;
    } else if (result[0].auth_token !== token) {
        return 403;
    }

    if (result[0].image_filename !== null) {
        fs.writeFileSync(path.dirname(imageDirectory+result[0].image_filename),img);
        return 200;
    } else {
        let file = 'user${user}.';
        if (type === 'image/gif') {
            file += 'gif';
        } else if (type === 'image/jpeg') {
            file += 'jpeg';
        } else {
            file += 'png';
        }
        fs.writeFileSync(path.dirname(imageDirectory+file),img);
        const query2 = 'UPDATE user Set image_filename = ? WHERE id = ?';
        const conn2 = await getPool().getConnection();
        await conn2.query( query2, [file,user]);
        await conn2.release();
        return 201;
    }
}

const remove = async (user: number, token: string) : Promise<number> => {
    const query = 'SELECT auth_token, image_filename FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [user]);
    await conn.release();
    if (result.length === 0) {
        return 404;
    } else if (result[0].auth_token !== token) {
        return 403;
    }

    fs.unlinkSync(path.dirname(imageDirectory+result[0].image_filename));
    const query2 = 'UPDATE auth_token = NULL WHERE id = ?';
    const conn2 = await getPool().getConnection();
    await conn.query( query2, [user]);
    await conn2.release();
    return 200;
}

export {get, set, remove}