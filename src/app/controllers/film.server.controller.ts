import {Request, Response} from "express";
import Logger from "../../config/logger";
import validator from "../middleware/validator";
import * as schemas from "../resources/schemas.json";
import * as films from "../models/film.server.model"
import * as auth from "../middleware/user.auth.middleware";

const viewAll = async (req: Request, res: Response): Promise<void> => {
    const isValid = await validator(schemas.film_search,req.params);
    if (isValid !== true) {
        res.statusMessage = "Bad Request. Invalid information!";
        res.status(400).send();
        return;
    }
    try{
        // Your code goes here
        const result = await films.search(req.params);
        res.statusMessage = "OK";
        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getOne = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = parseInt(req.params.id,10);
        const result = await films.getOne(id);
        // Your code goes here
        if (result === 404) {
            res.statusMessage = "Not Found. No film with id";
            res.status(404).send();
        } else {
            res.statusMessage = "OK"
            res.status(200).send(result);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addOne = async (req: Request, res: Response): Promise<void> => {
    const isValid = await validator(schemas.film_post,req.body);
    if (isValid !== true) {
        res.statusMessage = "Bad Request. Invalid information!";
        res.status(400).send();
        return;
    }

    try{
        const dirId = await auth.getUserId(auth.getAuthToken(req));
        if (dirId === null) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }
        // Your code goes here
        const result = await films.add(req.body,dirId);
        if (result === 403) {
            res.statusMessage = "Forbidden. Film title is not unique, or cannot release a film in the past";
            res.status(403).send();
            return;
        } else if (result === 400) {
            res.statusMessage = "Bad Request. Invalid information!";
            res.status(400).send();
            return;
        }
        res.statusMessage = "Created";
        res.status(201).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editOne = async (req: Request, res: Response): Promise<void> => {
    const isValid = await validator(schemas.film_patch,req.body);
    if (isValid !== true) {
        res.statusMessage = "Bad Request. Invalid information!";
        res.status(400).send();
        return;
    }
    const id = parseInt(req.params.id,10);


    try{
        const dirId = await auth.getUserId(auth.getAuthToken(req));
        if (dirId === null) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }

        const result = await films.update(req.body,dirId,id);
        if (result === 404) {
            res.statusMessage = "Not Found. No film found with id";
            res.status(404).send();
            return;
        } else if (result === 403) {
            res.statusMessage = "Forbidden. Only the director of an film may change it, cannot change the releaseDate since it has already passed, cannot edit a film that has a review placed, or cannot release a film in the past";
            res.status(403).send();
            return;
        } else if (result === 401) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        } else if (result === 400) {
            res.statusMessage = "Bad Request. Invalid information";
            res.status(400).send();
            return;
        } else if (result === 200) {
            res.statusMessage = "OK";
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

const deleteOne = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getGenres = async (req: Request, res: Response): Promise<void> => {
    try{
        const result = films.getGenres();
        res.statusMessage = "OK";
        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {viewAll, getOne, addOne, editOne, deleteOne, getGenres};