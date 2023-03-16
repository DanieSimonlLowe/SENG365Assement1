import {getPool} from "../../config/db";

const validAgeRatings = ['G','PG','M','R16','R18','TBC'];

const search = async (params: any) : Promise<any> => {
    let query = 'SELECT id, title, genre_id, age_rating, director_id, release_date FROM film AS f ';
    if (params.hasOwnProperty("q")) {
        query += 'title LIKE \'%' + params.q + '%\' AND ';
    }
    let where: string = "";
    if (params.hasOwnProperty("genreIds")) {
        if (params.genreIds.length > 0) {
            where += '('
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < params.genreIds.length; i++) {
                where += 'genre_id = ' + params.genreIds[i] + ' OR '
            }
            where = where.substring(0,where.length-3) + ') AND '
        }
    }
    if (params.hasOwnProperty("ageRatings")) {
        if (params.ageRatings.length > 0) {
            where += '('
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < params.ageRatings.length; i++) {
                query += 'age_ratings = ' + params.ageRatings[i] + ' OR '
            }
            where = where.substring(0,where.length-3) + ') AND '
        }
    }
    if (params.hasOwnProperty("directorId")) {
        where += 'title = '+ params.directorId +' AND ';
    }
    if (params.hasOwnProperty("reviewerId")) {
        where += 'id IN (SELECT film_id FROM `film_review` WHERE user_id = ' + params.reviewerId + ') AND ';
    }
    if (where !== "") {
        where = where.substring(0,where.length-4);
        query =query + "WHERE " + where;
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
    } else if (sortKey === 'RATING_ASC') {// TODO check this treats no reviews as 0.
        query += 'ORDER BY (SELECT AVG(rating) FROM film_review WHERE f.id = film_id) ASC'
    } else if (sortKey === 'RATING_DESC') {
        query += 'ORDER BY (SELECT AVG(rating) FROM film_review WHERE f.id = film_id) DESC'
    }

    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, []);

    let startIndex = 0;
    if (params.hasOwnProperty("startIndex")) {
        startIndex = params.startIndex;
    }

    let count = result.length - startIndex;
    if (params.hasOwnProperty("count")) {
        count = params.count;
        if (count + startIndex >= result.length) {
            count = result.length - startIndex - 1;
        }
    }
    const list = [];

    // get director
    for (let i = startIndex; i < startIndex+count; i++) {
        const [dirInfo] = await conn.query('SELECT first_name, last_name FROM user WHERE id = ?', [result[i].director_id]);
        const [ratingInfo] = await conn.query('SELECT AVG(rating) AS rat FROM film_review WHERE film_id = ?', [result[i].id]);
        let ratin = 0;
        if (ratingInfo.length !== 0) {
            ratin = ratingInfo[0].rat.toFixed(1);
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

    const temp = count;
    return {
        films: list,
        count: temp
    }
}


const getOne = async (film: number) : Promise<any> => {
    const query = 'SELECT title, genre_id, age_rating, director_id, first_name, last_name, release_date, AVG(rating) as avg_rating, description, runtime, COUNT(rating) as count_rating FROM film JOIN user ON user.id = director_id, film_review WHERE film.id = ? AND film_review.film_id = ?';
    const conn = await getPool().getConnection();
    const [result] = await conn.query( query, [film,film]);
    await conn.release();
    if (result.length < 1) {
        return 404;
    }
    return {
        filmId: film,
        title: result[0].title,
        genreId: result[0].genre_id,
        ageRating: result[0].age_rating,
        directorId: result[0].director_id,
        directorFirstName: result[0].first_name,
        directorLastName: result[0].last_name,
        rating: result[0].avg_rating,
        description: result[0].description,
        runtime: result[0].runtime,
        numRating: result[0].count_rating
    }
}

const add = async (body: any, dirId: number) : Promise<any> => {
    const title : string = body.title;

    const conn = await getPool().getConnection();
    const [test] = await conn.query( 'SELECT * FROM user WHERE title = ?', [title]);
    await conn.release();
    if (test.length > 0) {
        return 403;
    }

    const description : string = body.description;
    const genreId : number = body.genreId;

    const conn3 = await getPool().getConnection();
    const [test2] = await conn3.query( 'SELECT * FROM genre WHERE id = ?', [genreId]);
    await conn3.release();
    if (test2.length < 1) {
        return 400;
    }

    const now: Date = new Date();
    let releaseDate: Date = now;
    if (body.hasOwnProperty('releaseDate')) {
        releaseDate = new Date(body.releaseDate+'Z');
        if (releaseDate < now) {
            releaseDate = now;
        }
    }

    let ageRating: string = 'TBC';
    if (body.hasOwnProperty('ageRating')) {
        if (body.ageRating in validAgeRatings) {
            ageRating = body.ageRating;
        }
    }

    let runtime = null;
    if (body.hasOwnProperty('runtime')) {
        runtime = body.runtime;
    }

    const query = 'INSERT INTO film (title,description,genre_id,release_date,age_rating,runtime, director_id) VALUES (?,?,?,?,?,?,?)'
    const conn2 = await getPool().getConnection();
    const [result] = await conn.query(query, [title,description,genreId,releaseDate,ageRating,runtime,dirId]);
    await conn2.release();
    if (result.length < 0) {
        return null;
    }
    return {
        filmId:result[0].id
    }
}

const update = async (body: any, dirId: number, id: number) : Promise<number> => {
    const conn = await getPool().getConnection();
    const [test] = await conn.query( 'SELECT * FROM film WHERE id = ?', [id]);
    await conn.release();
    if (test.length > 0) {
        return 404;
    } else if (test[0].director_id !== dirId) {
        return 403;
    }

    const conn2 = await getPool().getConnection();
    const [test2] = await conn2.query( 'SELECT * FROM film_view WHERE film_id = ?', [id]);
    await conn2.release();
    if (test2.length > 0) {
        return 403;
    }

    let query = 'UPDATE film SET '
    const values = [];
    if (body.hasOwnProperty('releaseDate')) {
        const now = new Date();
        if (test[0].release_date < now) {
            return 403;
        }

        const releaseDate = new Date(body.releaseDate+'Z');
        if (releaseDate < now) {
            return 403;
        }
        query += 'release_date = ? ';
        values.push(releaseDate);
    }

    if (body.hasOwnProperty('genreId')) {
        const conn4 = await getPool().getConnection();
        const [test3] = await conn4.query( 'SELECT * FROM genre WHERE id = ?', [body.genreId]);
        await conn4.release();
        if (test3.length < 1) {
            return 400;
        }
        query += 'genre_id = ? ';
        values.push(body.genreId);
    }

    if (body.hasOwnProperty('title')) {
        query += 'title = ? ';
        values.push(body.tilte);
    }
    if (body.hasOwnProperty('description')) {
        query += 'description = ? ';
        values.push(body.description);
    }
    if (body.hasOwnProperty('runtime')) {
        query += 'runtime = ? ';
        values.push(body.runtime);
    }
    if (body.hasOwnProperty('ageRating')) {
        query += 'age_rating = ? ';
        if (!(body.ageRating in validAgeRatings)) {
            return 400;
        }
        values.push(body.ageRating);
    }
    query += 'WHERE id = ?'
    values.push(id);
    const conn3 = await getPool().getConnection();
    const [result] = await conn3.query( query, values);
    await conn3.release();
    return 200;
}

const getGenres =  async () : Promise<any[]> => {
    const query = 'SELECT * FROM genre'
    const conn = await getPool().getConnection();
    const [result] = await conn.query(query);
    await conn.release();

    const list = [];
    for (let i = 0; i<result.length; i++) {
        list.push({
            genreId:result.id,
            name:result.name
        })
    }
    return list;
}

export {search, getOne, add, update, getGenres}