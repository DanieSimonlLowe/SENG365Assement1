import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as user from "../models/user.image.server.model";
import {getAuthToken} from "../middleware/user.auth.middleware";
import * as files from "../middleware/ImageFileManipulation"
import * as types from "../middleware/typeValidation";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        if (!types.isInt(req.params.id)) {
            res.statusMessage = "Bad Request. Invalid information!";
            res.status(400).send();
            return;
        }
        const id = parseInt(req.params.id,10);
        const result = await user.get(id);
        if (result === null) {
            res.statusMessage = "Not Found. No user with specified ID, or user has no image";
            res.status(404).send();
            return;
        }

        res.statusMessage = "OK";
        const extension = result.ext;
        if (extension === 'jpeg' || extension === '.jpg') {
            res.header("content-type", "image/jpeg");
        } else if (extension === '.png') {
            res.header("content-type", "image/png");
        } else {
            res.header("content-type", "image/gif");
        }

        res.status(200).send(result.data);
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
        if (!await files.isValidImageReq(req)) {
            res.statusMessage = "Bad Request. Invalid image supplied (possibly incorrect file type)"
            res.status(400).send();
            return;
        }

        if (!types.isInt(req.params.id)) {
            res.statusMessage = "Bad Request. Invalid image supplied (possibly incorrect file type)";
            res.status(400).send();
            return;
        }
        const id = parseInt(req.params.id,10);
        const token = getAuthToken(req);
        if (token === "") {
            res.statusMessage = "Unauthorized"
            res.status(401).send();
            return;
        }
        const data = req.body as Buffer;
        // Your code goes here
        const result: number = await user.set(id,token,data,files.getImageContentType(req));
        if (result === 404) {
            res.statusMessage = "Not found. No such user with ID given"
            res.status(404).send();
            return;
        } else if (result === 403) {
            res.statusMessage = "Forbidden. Can not change another user's profile photo"
            res.status(403).send();
            return;
        } else if (result === 200) {
            res.statusMessage = "OK. Image updated"
            res.status(200).send();
            return;
        } else if (result === 201) {
            res.statusMessage = "Created. New image created"
            res.status(201).send();
            return;
        } else {
            throw new Error("result of setting user image is unexpected value: " + result);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error: ";
        res.status(500).send();
        return;
    }
}


const deleteImage = async (req: Request, res: Response): Promise<void> => {
    if (!types.isInt(req.params.id)) {
        res.statusMessage = "Bad Request. Invalid information!";
        res.status(400).send();
        return;
    }
    const id = parseInt(req.params.id,10);
    const token = getAuthToken(req);
    if (token === "") {
        res.statusMessage = "Unauthorized"
        res.status(401).send();
        return;
    }
    try{
        const result: number = await user.remove(id,token);
        if (result === 404) {
            res.statusMessage = "Not Found. No such user with ID given"
            res.status(404).send();
            return;
        } else if (result === 403) {
            res.statusMessage = "Forbidden. Can not delete another user's profile photo"
            res.status(403).send();
            return;
        } else if (result === 200) {
            res.statusMessage = "OK"
            res.status(200).send();
            return;
        } else {
            throw new Error("result of setting user image is unexpected value: " + result);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}