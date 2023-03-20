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
    const output = [];
    for (let i = 0; i<input.length; i++) {
        output[i] = input[i];
    }
    output[input.length] = 'Z'

    return new Date(Date.parse(output.join('')));
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