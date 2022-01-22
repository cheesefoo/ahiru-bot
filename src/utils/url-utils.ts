import { createRequire } from 'node:module';
import { URL } from 'url';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class UrlUtils {
    public static isValidImageArg(imgUrl: string): boolean {
        imgUrl = imgUrl.toLowerCase();
        let validExtensions = Config.validImageExtensions;
        let valid = false;
        validExtensions.forEach((xt: string) => {
            valid = valid || imgUrl.endsWith(xt);
        });
        return valid;
    }

    public static isValidHttpUrl(str: string): boolean {
        let url;

        try {
            url = new URL(str);
        } catch (_) {
            return false;
        }

        return url.protocol === 'http:' || url.protocol === 'https:';
    }
}
