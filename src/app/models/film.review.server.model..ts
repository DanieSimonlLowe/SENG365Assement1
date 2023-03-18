import {getPool} from "../../config/db";

const get = async (film: number): Promise<any> => {
    const query = 'SELECT * FROM film WHERE id = ?';
    const conn = await getPool().getConnection();
    const [test] = await conn.query( query, [film]);
    await conn.release();
    if (test.length < 1) {
        return null;
    }

    const query2 = 'SELECT * FROM film_review JOIN user ON user_id = user.id WHERE film_id = ? ORDER BY DESC timestamp';
    const conn2 = await getPool().getConnection();
    const [result] = await conn.query( query2, [film]);
    await conn2.release();

    const list: any[] = [];
    for (let i = 0; i < result.length; i++) {
        const review = result[i];
        list.push({
            reviewerId: review.user_id,
            rating: review.rating,
            review: review.review,
            reviewerFirstName: review.first_name,
            reviewerLastName: review.last_name,
            timestamp: review.timestamp
        })
    }
    return list;
}

const add = async (film: number, user: number, rating: number, review: string): Promise<number> => {
    const query = 'SELECT release_date, director_id FROM film WHERE id = ?';
    const conn = await getPool().getConnection();
    const [test] = await conn.query( query, [film]);
    await conn.release();
    if (test.length < 1) {
        return 404;
    }
    const now: Date = new Date();
    if (test[0].director_id === user || test[0].release_date > now) {
        return 403;
    }

    const query2 = 'INSERT INTO film_review (film_id,user_id,rating,review) \n VALUES (?,?,?,?)';
    const conn2 = await getPool().getConnection();
    await conn2.query( query2, [film,user,rating,review]);
    await conn2.release();
    return 201;
}


export {get,add}