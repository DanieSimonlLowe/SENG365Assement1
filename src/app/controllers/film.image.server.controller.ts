import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from "../models/film.image.server.model"
import * as auth from "../middleware/user.auth.middleware";
import * as files from "../middleware/ImageFileManipulation"
import * as types from "../middleware/typeValidation";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        if (!types.isInt(req.params.id)) {
            res.statusMessage = "Bad Request. Invalid information!";
            res.status(400).send();
            return;
        }
        const id: number = parseInt(req.params.id,10);
        const result = await films.get(id);
        if (result === null) {
            res.statusMessage = "Not found. No film found with id, or film has no image";
            res.status(404).send();
            return;
        }

        const extension = result.ext;
        if (extension === 'jpeg' || extension === '.jpg') {
            res.header("content-type", "image/jpeg");
        } else if (extension === '.png') {
            res.header("content-type", "image/png");
        } else {
            res.header("content-type", "image/gif");
        }
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

const setImage = async (req: Request, res: Response): Promise<void> => {
    try{
        if (!types.isInt(req.params.id)) {
            res.statusMessage = "Bad Request. Invalid information!";
            res.status(400).send();
            return;
        }
        const id: number = parseInt(req.params.id,10);
        const token = auth.getAuthToken(req);
        if (token === "") {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        }
        if (!await files.isValidImageReq(req)) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        }
        const uid: number = await auth.getUserId(token);
        if (uid === null) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
        }


        const result: number = await films.set(id,uid,req.body,files.getImageContentType(req));
        if (result === 404) {
            res.statusMessage = "Not Found. No film found with id";
            res.status(404).send();
        } else if (result === 403) {
            res.statusMessage = "Forbidden. Only the director of a film can change the hero image";
            res.status(403).send();
        } else if (result === 400) {
            res.statusMessage = "Bad Request";
            res.status(400).send();
        } else if (result === 200) {
            res.statusMessage = "OK";
            res.status(200).send();
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