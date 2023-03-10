import {Request, Response} from "express";
import Logger from "../../config/logger";
import validator from "./validator";
import * as schemas from "../resources/schemas.json";
import * as user from "../models/user.server.model";
import * as auth from "../middleware/user.auth.middleware"
import {getAuthToken} from "../middleware/user.auth.middleware";

const register = async (req: Request, res: Response): Promise<void> => {
    const isValid = await validator(schemas.user_register,req.body);
    if (isValid !== true) {
        res.statusMessage = "Bad Request. Invalid information!";
        res.status(400).send();
        return;
    }

    try{
        if (await user.emailInUse(req.body.email)) {
            res.statusMessage = "Forbidden. Email already in use";
            res.status(403).send();
            return;
        }

        const result = await user.make(req);

        res.statusMessage = "OK"
        res.status(201).send(result);
        return;
    } catch (err) {
        Logger.error(err.toString());
        res.statusMessage = "Internal Server Error: " + err;
        res.status(500).send(`ERROR creating user: ${err}`);
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    const isValid = await validator(schemas.user_login,req.body);
    if (isValid !== true) {
        res.statusMessage = "Bad Request. Invalid information";
        res.status(400).send();
        return;
    }
    try{
        const result = await user.login(req.body.email, req.body.password);

        if (result === false) {
            res.statusMessage = "Not Authorised. Incorrect email/password";
            res.status(401).send();
            return;
        }
        res.statusMessage = "OK";
        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error: " + err;
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    const token = auth.getAuthToken(req);
    if (token === "") {
        res.statusMessage = "Unauthorized. Cannot log out if you are not authenticated";
        res.status(401).send();
        return;
    }
    try{
        // Your code goes here
        await user.logout(getAuthToken(req));
        res.statusMessage = "OK";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error: " + err;
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id,10);

    try{
        // Your code goes here
        if (!await user.userExists(id)) {
            res.statusMessage = "Not Found. No user with specified ID";
            res.status(404).send();
            return;
        }
        const result = await user.get(id,auth.getAuthToken(req));
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


const update = async (req: Request, res: Response): Promise<void> => {

    const isValid = await validator(schemas.user_edit,req.body);
    if (isValid !== true) {
        res.statusMessage = "Bad request. Invalid information";
        res.status(400).send();
        return;
    }

    if (req.body.hasOwnProperty("password")) {
        if (!req.body.hasOwnProperty("currentPassword")) {
            res.statusMessage = "Forbidden. This is not your account, or the email is already in use, or identical current and new passwords";
            res.status(403).send();
            return;
        }
        if (req.body.currentPassword === req.body.password) {
            res.statusMessage = "Forbidden. This is not your account, or the email is already in use, or identical current and new passwords";
            res.status(403).send();
            return;
        }
    }
    try{
        if (!await user.hasSamePassword(req.body.currentPassword,auth.getAuthToken(req))) {
            res.statusMessage = "Unauthorized or Invalid currentPassword"
            res.status(401).send();
            return;
        }

        const result = await user.update(req);

        if (result === 0) {
            res.statusMessage = "Forbidden. This is not your account, or the email is already in use, or identical current and new passwords";
            res.status(403).send();
            return;
        } else if (result === 1) {
            res.statusMessage = "Not Found"
            res.status(404).send();
            return;
        }
        // Your code goes here
        res.statusMessage = "OK!";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error: " + err;
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}