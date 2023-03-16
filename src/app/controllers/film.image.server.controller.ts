import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from "../models/film.image.server.model"
import * as auth from "../middleware/user.auth.middleware";
import * as files from "../middleware/ImageFileManipulation"

const getImage = async (req: Request, res: Response): Promise<void> => {
    const id: number = parseInt(req.params.id,10);
    try{
        const result = films.get(id);
        if (result === null) {
            res.statusMessage = "Not found. No film found with id, or film has no image";
            res.status(404).send();
            return;
        } else {
            res.statusMessage = "OK";
            res.status(200).send(result);
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    const id: number = parseInt(req.params.id,10);
    const token = auth.getAuthToken(req);
    if (token === "") {
        res.statusMessage = "Unauthorized";
        res.status(401).send();
    }
    if (!files.isValidImageReq(req)) {
        res.statusMessage = "Bad Request";
        res.status(400).send();
    }
    try{
        const uid: number = await auth.getUserId(token);
        if (uid === null) {
            res.statusMessage = "Forbidden. Only the director of a film can change the hero image";
            res.status(403).send();
        }

        const result: number = await films.set(id,uid,req.body,req.headers['content-type']);
        if (result === 404) {
            res.statusMessage = "Not Found. No film found with id";
            res.status(404).send();
        } else if (result === 403) {
            res.statusMessage = "Forbidden. Only the director of a film can change the hero image";
            res.status(403).send();
        } else if (result === 200) {
            res.statusMessage = "OK";
            res.status(500).send();
        } else if (result === 201) {
            res.statusMessage = "Created";
            res.status(201).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage};