// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

const isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

interface ParseOptions {
    maxKeys?: number | undefined;
}

type ParsedUrlQuery = Record<string, string | string[]>;

type ParsedUrlQueryInput = Record<string, string | number | boolean | ReadonlyArray<string> | ReadonlyArray<number> | ReadonlyArray<boolean> | null | undefined>;

function stringifyPrimitive(v: string | boolean | number | undefined): string {
    switch (typeof v) {
        case 'string':
            return v;

        case 'boolean':
            return v ? 'true' : 'false';

        case 'number':
            return isFinite(v) ? v.toString() : '';

        default:
            return '';
    }
}

export function stringify(
    /** The object to serialize into a URL query string */
    obj?: ParsedUrlQueryInput,
    /** The substring used to delimit key and value pairs in the query string. */
    sep = '&',
    /** The substring used to delimit keys and values in the query string. */
    eq = '=',
): string {
    if (obj === null) {
        obj = undefined;
    }

    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).map((k) => {
            const val = obj?.[k];
            const ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
            if (isArray(val)) {
                return val.map((v) => {
                    return ks + encodeURIComponent(stringifyPrimitive(v));
                }).join(sep);
            } else {
                return ks + encodeURIComponent(stringifyPrimitive(val as string | number | boolean));
            }
        }).join(sep);
    }
    return '';
}

export function parse(
    /** The URL query string to parse */
    str?: string,
    /** The substring used to delimit key and value pairs in the query string. */
    sep = '&',
    /** The substring used to delimit keys and values in the query string. */
    eq = '=',
    options: ParseOptions = {}): ParsedUrlQuery {
    const obj: ParsedUrlQuery = {};

    if (typeof str !== 'string' || str.length === 0) {
        return obj;
    }

    const regexp = /\+/g;
    const qs = str.split(sep);

    let maxKeys = 1000;
    if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
    }

    let len = qs.length;
    // maxKeys <= 0 means that we should not limit keys count
    if (maxKeys > 0 && len > maxKeys) {
        len = maxKeys;
    }

    for (let i = 0; i < len; ++i) {
        const x = qs[i].replace(regexp, '%20');
        const idx = x.indexOf(eq);

        let kstr: string;
        let vstr: string;

        if (idx >= 0) {
            kstr = x.substr(0, idx);
            vstr = x.substr(idx + 1);
        } else {
            kstr = x;
            vstr = '';
        }

        const k = decodeURIComponent(kstr);
        const v = decodeURIComponent(vstr);

        const ref = obj[k];
        if (!Object.prototype.hasOwnProperty.call(obj, k)) {
            obj[k] = v;
        } else if (isArray(ref)) {
            ref.push(v);
        } else {
            obj[k] = [ref, v];
        }
    }

    return obj;
}

export default {
    encode: stringify,
    stringify: stringify,
    decode: parse,
    parse: parse,
};

export { stringify as encode, parse as decode };