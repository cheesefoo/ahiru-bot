import Twitter from 'twitter-v2';
import fetch, { HeadersInit, Response } from 'node-fetch';
import fs, { mkdir, createWriteStream } from 'fs';
import { open, readdir } from 'fs/promises';
import { URL, URLSearchParams, parse } from 'url';
import { pipeline } from 'stream/promises';
import sanitize from 'sanitize-filename';
import os from 'os';
import path from 'path';

export class TwitterSpaceUtils {
    //Gets a guest token from twitter
    public static async GetGuestToken(): Promise<string> {
        let res = await fetch('https://twitter.com/');
        let txt = await res.text();
        let token = txt.match(/(?<=gt\=)\d{19}/gm)[0];
        console.log(token);
        return token;
    }

    //Query twitter graphql for space metadata
    public static async GetMetadata(id, guestToken?) {
        let params = {
            variables:
                '{' +
                '"id": ' +
                `"${id}",` +
                '"isMetatagsQuery": false,' +
                '"withSuperFollowsUserFields": true,' +
                '"withUserResults": true,' +
                '"withBirdwatchPivots": false,' +
                '"withReactionsMetadata": false,' +
                '"withReactionsPerspective": false,' +
                '"withSuperFollowsTweetFields": true,' +
                '"withReplays": true,' +
                '"withScheduledSpaces": true' +
                '}',
        };
        let searchParams = new URLSearchParams(params).toString();

        let headers = {
            authorization: process.env.twitter_bearer,
            'x-guest-token': await this.GetGuestToken(),
        };

        let url = new URL(process.env.twitter_endpoint);
        url.search = searchParams;

        let res = await fetch(url.toString(), {
            headers: headers,
        });
        let json = await res.json();
        return json;
    }

    //Get space stream url
    public static async GetURL(metadata): Promise<URL> {
        if (metadata['data']['audioSpace']['metadata']['state'] == 'Ended') {
            console.error('space is ended');
        }
        let headers = {
            authorization: process.env.twitter_bearer,
            cookie: 'auth_token=',
        };
        let mediaKey = metadata['data']['audioSpace']['metadata']['media_key'];
        let res = await fetch(
            'https://twitter.com/i/api/1.1/live_video_stream/status/' + mediaKey,
            { headers: headers }
        );
        let json = await res.json();
        let dynamicUrl: string = json['source']['location'];
        let url = dynamicUrl.replace('?type=live', '').replace('dynamic', 'master');
        let baseURL = new URL(url);
        return baseURL;
    }
}
