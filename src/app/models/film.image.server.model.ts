import {getPool} from "../../config/db";
import * as files from "../middleware/ImageFileManipulation"

const get = async (film: number): Promise<any> => {
    const query = 'SELECT image_filename FROM film WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [film]);
    await conn.release();
    if (result.length === 0) {
        return null;
    } else if (result[0].image_filename === null) {
        return null;
    }
    return files.readFile(result[0].image_filename);
}

const set = async (film: number, user: number, img: Buffer, type: string): Promise<number> => {
    const query = 'SELECT image_filename, director_id FROM film WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [film]);
    await conn.release();
    if (result.length === 0) {
        return 404;
    }
    if (user === result[0].director_id) {
        return 403;
    }

    let ret: number = 201;
    if (result[0].image_filename !== null ) {
        if (files.sameExtension(type,result[0].image_filename)) {
            await files.writeFile(result[0].image_filename, img);
            return 200;
        } else {
            await files.deleteFile(result[0].image_filename);
            ret = 200;
        }
    }
    let file = 'film_' + film + '.';
    if (type === 'image/gif') {
        file += 'gif';
    } else if (type === 'image/jpeg') {
        file += 'jpeg';
    } else {
        file += 'png';
    }
    await files.writeFile(file, img);

    const query2 = 'UPDATE film Set image_filename = ? WHERE id = ?';
    const conn2 = await getPool().getConnection();
    await conn2.query( query2, [file,film]);
    await conn2.release();
    return ret;
}
export {get, set}