import { ImageAnnotatorClient } from '@google-cloud/vision';
import { google } from '@google-cloud/vision/build/protos/protos';
import translate from 'deepl';

let Config = require('../../config/config.json');

export class ApiUtils {
    public static async OCRRequest(
        url: string
    ): Promise<google.cloud.vision.v1.IAnnotateImageResponse> {
        let googleApiKey: string = process.env.google_privatekey;

        googleApiKey = googleApiKey.replace(/\\n/g, '\n');

        const options = {
            credentials: { client_email: process.env.google_email, private_key: googleApiKey },
        };
        const client = new ImageAnnotatorClient(options);
        const request = {
            image: {
                source: {
                    imageUri: `${url}`,
                },
            },
            // "features": [{ "type": "TEXT_DETECTION" }],
            imageContext: {
                languageHints: ['JA'],
                textDetectionParams: {
                    enableTextDetectionConfidenceScore: 'true',
                },
            },
        };
        const requests = {
            requests: [request],
        };

        const [result] = await client.textDetection(request);
        return result;
    }

    public static async ParseTranslations(translations: {
        detected_source_language: string;
        text: string;
    }): Promise<string> {
        let srcLang = translations.detected_source_language;
        let text = translations.text;
        let tl = text;
        if (ApiUtils.IsEnglish(srcLang)) {
            tl = await translate({
                text: text,
                source_lang: 'EN',
                target_lang: 'JA',
                auth_key: Config.deepl.key,
                free_api: true,
            })
                .then(resp => resp.data.translations[0].text)
                .catch(error => error.toString());
        }
        return tl;
    }

    private static IsEnglish(lang: string): boolean {
        return lang == 'EN' || lang == 'EN-US' || lang == 'EN-GB';
    }
}
