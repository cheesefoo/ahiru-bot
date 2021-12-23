import fetch from 'node-fetch';
import { URL, URLSearchParams } from 'url';

import child_process, { SpawnOptions } from 'child_process'
import fs from 'fs'
import path from 'path'
import stream from 'stream'
import { promisify } from 'util'

export class TwitterSpaceUtils
{
    //Gets a guest token from twitter
    public static async GetGuestToken(): Promise<string>
    {
        let res = await fetch('https://twitter.com/');
        let txt = await res.text();
        let token = txt.match(/(?<=gt\=)\d{19}/gm)[0];
        console.log(token);
        return token;
    }

    //Query twitter graphql for space metadata
    public static async GetMetadata(id, guestToken?)
    {
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

        let res = await fetch(url, {
            headers: headers,
        });
        let json = await res.json();
        return json;
    }
    public static GetChunks(data: string): number[] {
        const regex = /(?<=chunk_\d+_)\d+(?=_a\.)/gm
        return data.match(regex)?.map((v) => Number(v)) || []
    }

    public static async GetStatus(mediaKey, headers?)
    {
        if (headers === undefined)
        {
            headers = {
                authorization: process.env.twitter_bearer,
                'x-guest-token': await this.GetGuestToken(),
            };
        }
        const url = new URL(`https://twitter.com/i/api/1.1/live_video_stream/status/${mediaKey}`);
        const res = await fetch(url, {
            headers: headers,
        });
        const { data } = await res.json();
        return data;
    }

    //Get space stream url
    public static async GetURL(metadata): Promise<URL>
    {
        if (metadata['data']['audioSpace']['metadata']['state'] == 'Ended')
        {
            console.error('space is ended');
        }
        let headers = {
            authorization: process.env.twitter_bearer,
            cookie: 'auth_token=',
        };
        let mediaKey = metadata['data']['audioSpace']['metadata']['media_key'];
        let res = await fetch(
            'https://twitter.com/i/api/1.1/live_video_stream/status/' + mediaKey,
            { headers: headers },
        );
        let json = await res.json();
        let dynamicUrl: string = json['source']['location'];
        let url = dynamicUrl.replace('?type=live', '').replace('dynamic', 'master');
        let baseURL = new URL(url);
        return baseURL;
    }


    public static async downloadImage(url: string, filePath: string) {
        logger.debug('Download image', { url, filePath })
        const response = await axios.get(url, { responseType: 'stream' })
        const writer = fs.createWriteStream(filePath)
        response.data.pipe(writer)
        await promisify(stream.finished)(writer)
    }

    public static async downloadSpace(nonTranscodePlaylistUrl: string, filename: string, subDir = '', metadata?: Record<string, any>) {
        const playlistPath = path.join(Util.getMediaDir(subDir), `${filename}.m3u8`)
        logger.verbose(`Playlist path: "${playlistPath}"`)
        Util.createMediaDir(subDir)
        await this.downloadSpacePlaylist(nonTranscodePlaylistUrl, playlistPath)
        const audioPath = path.join(Util.getMediaDir(subDir), `${filename}.m4a`)
        logger.verbose(`Audio path: "${audioPath}"`)
        this.runFfmpeg(playlistPath, audioPath, metadata)
    }

    public static async downloadSpacePlaylist(nonTranscodePlaylistUrl: string, filePath: string) {
        const data = await this.getAbsoluteTranscodePlaylist(nonTranscodePlaylistUrl)
        fs.writeFileSync(filePath, data)
        logger.verbose(`Playlist saved to: "${filePath}"`)
    }

    public static async getAbsoluteTranscodePlaylist(nonTranscodePlaylistUrl: string) {
        const nonTranscodeMasterPlaylistUrl = Util.getMasterUrlFromDynamicUrl(nonTranscodePlaylistUrl)
        logger.debug('getAbsoluteTranscodePlaylist', { nonTranscodePlaylistUrl, nonTranscodeMasterPlaylistUrl })
        const baseAudioUrl = nonTranscodeMasterPlaylistUrl.replace('master_playlist.m3u8', '')
        const chunkPattern = /^chunk/gm
        const rawData = await this.getRawTranscodePlaylist(nonTranscodePlaylistUrl)
        const data = rawData.replace(chunkPattern, `${baseAudioUrl}chunk`)
        return data
    }

    public static async getRawTranscodePlaylist(nonTranscodePlaylistUrl: string) {
        // eslint-disable-next-line max-len
        const nonTranscodePlaylistData = await Downloader.getNonTranscodeMasterPlaylist(nonTranscodePlaylistUrl)
        const transcodePlaylistUrl = new URL(nonTranscodePlaylistUrl).origin + nonTranscodePlaylistData.split('\n')[3]
        logger.debug('getRawTranscodePlaylist', { nonTranscodePlaylistUrl, transcodePlaylistUrl })
        const { data, headers } = await axios.get<string>(transcodePlaylistUrl)
        logger.debug('getRawTranscodePlaylist', { headers })
        return data
    }

    public static async getNonTranscodeMasterPlaylist(nonTranscodePlaylistUrl: string) {
        const nonTranscodeMasterPlaylistUrl = Util.getMasterUrlFromDynamicUrl(nonTranscodePlaylistUrl)
        logger.debug('getNonTranscodeMasterPlaylist', { nonTranscodePlaylistUrl, nonTranscodeMasterPlaylistUrl })
        const { data, headers } = await axios.get<string>(nonTranscodeMasterPlaylistUrl)
        logger.debug('getNonTranscodeMasterPlaylist', { headers })
        return data
    }

    private static runFfmpeg(
        playlistPath: string,
        mediaPath: string,
        metadata?: Record<string, any>,
    ) {
        const cmd = 'ffmpeg'
        const args = [
            '-protocol_whitelist',
            'file,https,tls,tcp',
            '-i',
            playlistPath,
            '-c',
            'copy',
        ]
        if (metadata) {
            logger.debug('Metadata', metadata)
            Object.keys(metadata).forEach((key) => {
                const value = metadata[key]
                if (!value) {
                    return
                }
                args.push('-metadata', `${key}=${value}`)
            })
        }
        args.push(mediaPath)
        logger.verbose(`Audio saving to: "${mediaPath}"`)
        logger.verbose(`${cmd} ${args.join(' ')}`)
        Util.createMediaDir()

        const spawnOptions: SpawnOptions = { detached: true, stdio: 'ignore' }
        const cp = process.platform === 'win32'
            ? child_process.spawn(process.env.comspec, ['/c', cmd, ...args], spawnOptions)
            : child_process.spawn(cmd, args, spawnOptions)
        cp.unref()
    }

}
