function isEmpty(value: any): boolean {
    return value === null;
}

function isInt(value: any): boolean {
    if (isEmpty(value)) {
        return false;
    }
    return Number.isInteger(parseFloat(value));
}

function isString(value: any): boolean {
    if (isEmpty(value)) {
        return false;
    }
    return typeof value === 'string' || value instanceof String;
}

function parseDate(input: string) : Date {
    return new Date(input);
}

function isDate(value: Date): boolean {
    if (isEmpty(value)) {
        return false;
    }
    return !isNaN(value.getTime());
}

function isFloat(value: any): boolean {
    if (isEmpty(value)) {
        return false;
    }
    return !isNaN(parseFloat(value));
}

export {isInt, isString, isFloat, isDate, parseDate}