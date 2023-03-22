import {getPool} from "../../config/db";
import * as files from "../middleware/ImageFileManipulation"
import * as types from "../middleware/typeValidation"

const validAgeRatings = ['G','PG','M','R16','R18','TBC'];

function isInvalidAgeRating(rating:string): boolean {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i<validAgeRatings.length; i++) {
        if (rating === validAgeRatings[i]) {
            return false;
        }
    }
    return true;
}

const isGenre = async (id: number) : Promise<boolean> => {
    const query = 'SELECT * FROM genre WHERE id  = ?'
    const conn = await getPool().getConnection();
    const [result] = await conn.query(query, [id]);
    await conn.release();
    return result.length > 0;
}

const isUser = async (user: number) : Promise<boolean> => {
    const query = 'SELECT auth_token FROM user WHERE id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [user]);
    await conn.release();
    return (result.length !== 0)
}

const search = async (params: any) : Promise<any> => {
    let query = 'SELECT id, title, genre_id, age_rating, director_id, release_date, description FROM film AS f ';

    let where: string = "";

    if (params.hasOwnProperty("q")) {
        const q : string = params.q;
        if (!types.isString(q)) {
            return 400;
        }
        where += '(title LIKE \'%' + q + '%\' OR description LIKE \'%' + q + '%\') AND ';
    }
    if (params.hasOwnProperty("genreIds")) {
        if (!Array.isArray(params.genreIds)) {
            params.genreIds = [params.genreIds]
        }
        if (params.genreIds.length > 0) {
            where += '('
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < params.genreIds.length; i++) {
                if (!types.isInt(params.genreIds[i])) {
                    return 400;
                }
                if (!await isGenre(params.genreIds[i])) {
                    return 400;
                }
                where += 'genre_id = ' + params.genreIds[i] + ' OR '
            }
            where = where.substring(0,where.length-3) + ') AND '
        }
    }
    if (params.hasOwnProperty("ageRatings")) {
        if (!Array.isArray(params.ageRatings)) {
            params.ageRatings = [params.ageRatings];
        }
        if (params.ageRatings.length > 0) {
            where += '('
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < params.ageRatings.length; i++) {
                const ageRating = params.ageRatings[i];
                if (!types.isString(ageRating)) {
                    return 400;
                }
                if (isInvalidAgeRating(ageRating)) {
                    return 400;
                }
                where += 'age_rating = \'' + ageRating + '\' OR '
            }
            where = where.substring(0,where.length-3) + ') AND '
        }
    }
    if (params.hasOwnProperty("directorId")) {
        if (!types.isInt(params.directorId)) {
            return 400;
        }
        if (! await isUser(params.directorId)) {
            return 400;
        }
        where += 'director_id = '+ params.directorId +' AND ';
    }
    if (params.hasOwnProperty("reviewerId")) {
        if (!types.isInt(params.reviewerId)) {
            return 400;
        }
        if (! await isUser(params.reviewerId)) {
            return 400;
        }
        where += 'id IN (SELECT film_id FROM `film_review` WHERE user_id = ' + params.reviewerId + ') AND ';
    }
    if (where !== "") {
        where = where.substring(0,where.length-4);
        query = query + "WHERE " + where;
    }

    let sortKey = "RELEASED_ASC";
    if (params.hasOwnProperty("sortBy")) {
        sortKey = params.sortBy;
    }
    if (sortKey === 'ALPHABETICAL_ASC') {
        query += 'ORDER BY title ASC'
    } else if (sortKey === 'ALPHABETICAL_DESC') {
        query += 'ORDER BY title DESC'
    } else if (sortKey === 'RELEASED_ASC') {
        query += 'ORDER BY release_date ASC'
    } else if (sortKey === 'RELEASED_DESC') {
        query += 'ORDER BY release_date DESC'
    } else if (sortKey === 'RATING_ASC') {
        query += 'ORDER BY (SELECT CASE WHEN AVG(rating) IS NULL THEN 0 ELSE AVG(rating) END FROM film_review WHERE f.id = film_id) ASC'
    } else if (sortKey === 'RATING_DESC') {
        query += 'ORDER BY (SELECT CASE WHEN AVG(rating) IS NULL THEN 0 ELSE AVG(rating) END FROM film_review WHERE f.id = film_id) DESC'
    } else {
        return 400;
    }

    query += ', f.id ASC'

    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, []);

    let startIndex = 0;
    if (params.hasOwnProperty("startIndex")) {
        if (types.isInt(params.startIndex)) {
            return 400;
        }
        startIndex = parseFloat(params.startIndex);
        if (startIndex <  0) {
            return 400;
        }
    }

    let count = result.length - startIndex;
    if (params.hasOwnProperty("count")) {
        count = parseFloat(params.count);
        if (!Number.isInteger(count)) {
            return 400;
        }
        if (count < 0) {
            return 400;
        }
        if (count + startIndex > result.length) {
            return 400;
        }
    }
    const list = [];

    // get director
    for (let i = startIndex; i < startIndex+count; i++) {
        const [dirInfo] = await conn.query('SELECT first_name, last_name FROM user WHERE id = ?', [result[i].director_id]);
        const [ratingInfo] = await conn.query('SELECT AVG(rating) AS rat FROM film_review WHERE film_id = ?', [result[i].id]);
        let ratin: number = 0;
        if (ratingInfo.length !== 0) {
            if (ratingInfo[0].rat !== null) {
                const rat: number = parseFloat(ratingInfo[0].rat);
                ratin = Math.round(rat * 100) / 100
            }
        }
        list.push({
            filmId: result[i].id,
            title: result[i].title,
            genreId: result[i].genre_id,
            ageRating: result[i].age_rating,
            directorId: result[i].director_id,
            directorFirstName: dirInfo[0].first_name,
            directorLastName: dirInfo[0].last_name,
            rating: ratin,
            releaseDate: result[i].release_date
        });
    }

    await conn.release();

    return {
        films: list,
        count: result.length
    }
}



const getOne = async (film: number) : Promise<any> => {
    const query = 'SELECT title, genre_id, age_rating, director_id, first_name, last_name, release_date, AVG(rating) as avg_rating, description, runtime, COUNT(rating) as count_rating FROM film JOIN user ON user.id = director_id, film_review WHERE film.id = ? AND film_review.film_id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [film,film]);
    await conn.release();
    if (result.length < 1) {
        return 404;
    } else if (result[0].title === null) {
        return 404;
    }
    let ratin: number = 0;
    if (result[0].avg_rating !== null) {
        const rat: number = parseFloat(result[0].avg_rating);
        ratin = Math.round(rat * 100) / 100
    }
    return {
        filmId: film,
        title: result[0].title,
        description: result[0].description,
        genreId: result[0].genre_id,
        directorId: result[0].director_id,
        directorFirstName: result[0].first_name,
        directorLastName: result[0].last_name,
        releaseDate: result[0].release_date,
        ageRating: result[0].age_rating,
        runtime: result[0].runtime,
        rating: ratin,
        numReviews: result[0].count_rating
    }
}

const add = async (body: any, dirId: number) : Promise<any> => {
    const title : string = body.title;

    const conn = await getPool().getConnection();
    const [test] = await conn.query( 'SELECT * FROM film WHERE title = ?', [title]);
    await conn.release();
    if (test.length > 0) {
        return 403;
    }

    if (!types.isString(body.description)) {
        return 400;
    }
    const description : string = body.description;
    if (!types.isInt(body.genreId)) {
        return 400;
    }
    const genreId : number = body.genreId;

    if (!await isGenre(genreId)) {
        return 400;
    }
    const now: Date = new Date();
    let releaseDate: Date = now;
    if (body.hasOwnProperty('releaseDate')) {
        releaseDate = types.parseDate(body.releaseDate);
        if (!types.isDate(releaseDate)) {
            return 400;
        }
        if (releaseDate < now) {
            return 403;
        }
    }

    let ageRating: string = 'TBC';
    if (body.hasOwnProperty('ageRating')) {
        if (!types.isString(body.ageRating)) {
            return 400;
        }
        if (isInvalidAgeRating(body.ageRating)) {
            return 400;
        }
        ageRating = body.ageRating;
    }

    let runtime = null;
    if (body.hasOwnProperty('runtime')) {
        if (!types.isInt(body.runtime)) {
            return 400;
        }
        runtime = body.runtime;
    }

    const query = 'INSERT INTO film (title,description,genre_id,release_date,age_rating,runtime, director_id) VALUES (?,?,?,?,?,?,?)'
    const conn2 = await getPool().getConnection();
    const [result] = await conn.query(query, [title,description,genreId,releaseDate,ageRating,runtime,dirId]);
    await conn2.release();

    const val = result.insertId;

    return {filmId:val}
}

const update = async (body: any, dirId: number, id: number) : Promise<number> => {
    const conn = await getPool().getConnection();
    const [test] = await conn.query( 'SELECT * FROM film WHERE id = ?', [id]);
    await conn.release();
    if (test.length < 1) {
        return 404;
    } else if (test[0].director_id !== dirId) {
        return 403;
    }

    const conn2 = await getPool().getConnection();
    const [test2] = await conn2.query( 'SELECT * FROM film_review WHERE film_id = ?', [id]);
    await conn2.release();
    if (test2.length > 0) {
        return 403;
    }

    let setsValue:boolean = false;
    let query = 'UPDATE film SET '
    const values = [];
    if (body.hasOwnProperty('releaseDate')) {
        const now = new Date();
        if (test[0].release_date < now) {
            return 403;
        }

        const releaseDate = types.parseDate(body.releaseDate);
        if (!types.isDate(releaseDate)) {
            return 400;
        }
        if (releaseDate < now) {
            return 403;
        }
        query += 'release_date = ? ,';
        values.push(releaseDate);
        setsValue = true;
    }

    if (body.hasOwnProperty('genreId')) {
        if (!types.isInt(body.genreId)) {
            return 400;
        }
        if (!await isGenre(body.genreId)) {
            return 400;
        }
        query += 'genre_id = ? ,';
        values.push(body.genreId);
        setsValue = true;
    }

    if (body.hasOwnProperty('title')) {
        if (!types.isString(body.title)) {
            return 400;
        }
        query += 'title = ? ,';
        values.push(body.title);
        setsValue = true;
    }
    if (body.hasOwnProperty('description')) {
        if (!types.isString(body.description)) {
            return 400;
        }
        query += 'description = ? ,';
        values.push(body.description);
        setsValue = true;
    }
    if (body.hasOwnProperty('runtime')) {
        if (!types.isInt(body.runtime)) {
            return 400;
        }
        query += 'runtime = ? ,';
        values.push(body.runtime);
        setsValue = true;
    }
    if (body.hasOwnProperty('ageRating')) {
        query += 'age_rating = ? ,';
        if (!types.isString(body.ageRating)) {
            return 400;
        }
        if (isInvalidAgeRating(body.ageRating)) {
            return 400;
        }
        values.push(body.ageRating);
        setsValue = true;
    }
    if (setsValue) {
        query = query.substring(0,query.length-1);
    }
    query += 'WHERE id = ?'
    values.push(id);
    const conn3 = await getPool().getConnection();
    await conn3.query( query, values);
    await conn3.release();
    return 200;
}

const getGenres =  async () : Promise<any[]> => {
    const query = 'SELECT * FROM genre'
    const conn = await getPool().getConnection();
    const [result] = await conn.query(query);
    await conn.release();

    const list = [];
    for (const item of result) {
        const id = item.id;
        const nam = item.name

        list.push({
            genreId:id,
            name:nam
        })
    }
    return list;
}

const remove = async (film: number, uid: number) : Promise<number> => {
    const conn = await getPool().getConnection();
    const [result] = await conn.query( 'SELECT director_id, image_filename FROM film WHERE id = ?', [film]);
    await conn.release();
    if (result.length < 1) {
        return 404;
    }
    if (result[0].director_id !== uid) {
        return 403;
    }
    if (result[0].image_filename !== null) {
        await files.deleteFile(result[0].image_filename);
    }
    const conn2 = await getPool().getConnection();
    await conn2.query( 'DELETE FROM film WHERE id = ?', [film]);
    await conn2.release();
    return 200;
}

export {search, getOne, add, update, getGenres, remove}