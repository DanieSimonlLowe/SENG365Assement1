import path from "path";

import * as fs from "fs";
const imageDirectory = './storage/images/';

function getImagePath (file:string) : string {
    return path.dirname(imageDirectory)+'\\images\\'+file
}


const readFile = async (fileName: string) : Promise<any> => {
    return fs.readFileSync(getImagePath(fileName));
}

const writeFile = async (fileName: string, data: Buffer) : Promise<void> => {
    fs.createWriteStream(getImagePath(fileName)).write(data);
}

const deleteFile = async (fileName: string) : Promise<void> => {
    await fs.promises.unlink(fileName);
}


export {readFile,writeFile,deleteFile}