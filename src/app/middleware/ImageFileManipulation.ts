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

const isValidImageReq = async (req: Request): Promise<boolean> => {
    let type:string = null
    if (req.headers.hasOwnProperty('content-type')) {
        type = req.headers['content-type'];
    } else if (req.headers.hasOwnProperty('Content-Type')) {
        if (req.headers['Content-Type'].length !== 1) {
            return false;
        }
        type = req.headers['Content-Type'][0];
    }
    if (type !== 'image/png' && type !== 'image/jpeg' && type !== 'image/gif') {
        return false;
    }
    try {
        const data = req.body as Buffer;
        if (data === null) {
            return false;
        }
        /*const mime: string = (await fileTypeFromFile("type")).mime;
        if (mime !== type) {
            return false;
        }*/
    } catch (err) {
        return false;
    }
    return true;
}

function getImageContentType(req: Request) : string {
    if (req.headers.hasOwnProperty('content-type')) {
        return req.headers['content-type'];
    } else if (req.headers.hasOwnProperty('Content-Type')) {
        if (req.headers['Content-Type'].length !== 1) {
            return null;
        }
        return req.headers['Content-Type'][0];
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