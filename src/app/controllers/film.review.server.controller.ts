import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as reviews from "../models/film.review.server.model."
import * as auth from "../middleware/user.auth.middleware";
import validator from "../middleware/validator";
import * as schemas from "../resources/schemas.json";

const getReviews = async (req: Request, res: Response): Promise<void> => {
    const id: number = parseInt(req.params.id,10);
    try{
        const result = await reviews.get(id);
        // Your code goes here
        if (result === null) {
            res.statusMessage = "OK";
            res.status(404).send();
            return;
        } else {
            res.statusMessage = "Not Found. No film found with id";
            res.status(200).send();
            return;
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const addReview = async (req: Request, res: Response): Promise<void> => {
    const isValid = await validator(schemas.film_review_post,req.body);
    if (isValid !== true) {
        res.statusMessage = "Bad Request. Invalid information!";
        res.status(400).send();
        return;
    }
    const id: number = parseInt(req.params.id,10);
    const token = auth.getAuthToken(req);
    if (token === "") {
        res.statusMessage = "Unauthorized";
        res.status(401).send();
        return;
    }
    try{
        const uId = await auth.getUserId(auth.getAuthToken(req));
        if (uId === null) {
            res.statusMessage = "Forbidden. Cannot review your own film, or cannot post a review on a film that has not yet released";
            res.status(403).send();
            return;
        }
        const result: number = await reviews.add(id,uId,req.body.rating,req.body.review);
        if (result === 403) {
            res.statusMessage = "Forbidden. Cannot review your own film, or cannot post a review on a film that has not yet released";
            res.status(403).send();
            return;
        } else if (result === 404) {
            res.statusMessage = "Not Found. No film found with id";
            res.status(501).send();
            return;
        } else if (result === 201) {
            res.statusMessage = "Forbidden. Cannot review your own film, or cannot post a review on a film that has not yet released";
            res.status(501).send();
            return;
        } else {
            throw new Error();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}



export {getReviews, addReview}