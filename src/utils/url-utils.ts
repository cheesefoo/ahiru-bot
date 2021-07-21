let Config = require("../../config/config.json");

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
}