import path from "path";

import * as fs from "fs";
import {Request} from "express";
const imageDirectory = '.'+path.sep+'storage'+path.sep+'images'+path.sep;

function getImagePath (file:string) : string {
    return path.dirname(imageDirectory)+path.sep+'images'+path.sep+file
}


const readFile = async (fileName: string) : Promise<any> => {
    return fs.readFileSync(getImagePath(fileName));
}

const writeFile = async (fileName: string, data: Buffer) : Promise<void> => {
    fs.createWriteStream(getImagePath(fileName)).write(data);
}

const deleteFile = async (fileName: string) : Promise<void> => {
    await fs.promises.unlink(getImagePath(fileName));
}

function isValidImageReq(req: Request): boolean { // TODO deal with wrong body data formats.
    if (req.headers.hasOwnProperty('content-type')) {
        const type: string = req.headers['content-type'];
        if (type !== 'image/png' && type !== 'image/jpeg' && type !== 'image/gif') {
            return false;
        }
    }
    try {
        if (!(req.body.is('image/png') || req.body.is('image/jpeg') || req.body.is('image/gif'))) {
            return false;
        }
        const data = req.body as Buffer;
        if (data === null) {
            return false;
        }
    } catch (err) {
        return false;
    }
    return true;
}

function getImageContentType(req: Request) : string {
    if (req.headers.hasOwnProperty('content-type')) {
        return req.headers['content-type'];
    }
    try {
        if (req.body.is('image/png')) {
            return "image/png";
        } else if (req.body.is('image/jpeg')) {
            return "image/jpeg";
        } else if (req.body.is('image/gif')) {
            return "image/gif";
        }
    } catch {
        return null;
    }
    return null;
}

function sameExtension(type: string, fileName: string): boolean {
    const extension = (fileName).split('.')[1];
    if (extension === "png" && type === "image/png") {
        return true;
    } else if ((extension === "jpeg" || extension === "jpg") && type === "image/jpeg") {
        return true;
    } else if (extension === "gif" && type === "image/gif") {
        return true;
    }
    return false;
}


export {readFile,writeFile,deleteFile,isValidImageReq,sameExtension,getImageContentType}