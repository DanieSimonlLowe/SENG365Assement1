function isEmpty(value: any): boolean {
    return value === null;
}

function isInt(value: any): boolean {
    if (isEmpty(value)) {
        return false;
    }

    try {
        const num = parseInt(value,10);
        if (isNaN(num)) {
            return false;
        }
        return num >= 0;
    } catch (err) {
        return false;
    }
}

function isString(value: any): boolean {
    if (isEmpty(value)) {
        return false;
    }
    if  (!(typeof value === 'string' || value instanceof String)) {
        return false;
    }
    return value.length > 0;
}

function parseDate(input: string) : Date {
    return new Date(input);
}

function isDate(input: any): boolean {
    if (!isString(input)) {
        return false;
    }
    if (input.length === 10) {
        return /\d\d\d\d-\d\d-\d\d/.test(input)
    } else if (input.length === 19) {
        return /\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d/.test(input);
    } else if (input.length === 23) {
        return /\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d.\d\d\d/.test(input);
    } else {
        return false
    }
}

function isFloat(value: any): boolean {
    if (isEmpty(value)) {
        return false;
    }
    return !isNaN(parseFloat(value));
}

function isPassword(value: any): boolean {
    if (!isString(value)) {
        return false;
    }
    return !(value.length < 6 || value > 64);
}

export {isInt, isString, isFloat, isDate, parseDate,isPassword}