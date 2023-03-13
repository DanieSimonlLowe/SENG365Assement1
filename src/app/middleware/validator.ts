import Ajv from 'ajv';
import emailChecker from "./emailChecker";
const ajv = new Ajv({removeAdditional:'all', strict: false})

export default async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if (!valid) {
            return ajv.errorsText(validator.errors);
        }
        if (data.hasOwnProperty("email")) {
            return await emailChecker(data.email);
        }
        return true;
    } catch (err) {
        return err.message;
    }
};