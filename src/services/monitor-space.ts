
import EventEmitter from 'events'
import fetch from 'node-fetch';
import { Logger } from '.';
import TwitterSpaceUtils from '../utils/'


let Logs = require('../../lang/logs.json');
export class monitorSpace {
    private metadata: any;
    private mediaKey: any;
    private status: any;
    private dynamicPlaylistUrl: URL;
    private lastChunk: number;
    constructor(private spaceId:string){}

    public async watch(): Promise<void> {

        try {

            
            this.metadata = await TwitterSpaceUtils.GetMetadata(this.spaceId)

            this.dynamicPlaylistUrl = await TwitterSpaceUtils.GetURL(this.metadata);
            


            this.watchSpaceCaptions()
            this.checkDynamicPlaylist()
        } catch (error) {
            await Logger.error(error.message)
            const timeoutMs = 5000
            Logger.info(`Retry watch in ${timeoutMs}ms`)
            setTimeout(() => this.watch(), timeoutMs)
        }
    }

    private getUsername(): string {
        const username = this.username || this.metadata.creator_results?.result?.legacy?.screen_name
        return username
    }

    private getFilename(): string {
        const date = new Date(this.metadata.started_at || this.metadata.created_at)
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, '')
        const filename = `[${date}] ${this.getUsername()} (${this.spaceId})`
        return filename
    }

    private async checkDynamicPlaylist(): Promise<void> {

        try {
            let res = await fetch(this.dynamicPlaylistUrl);
            let json = await res.json();
            let status = json['status'];
            let data = json['data'];
            const chunkIndexes = TwitterSpaceUtils.GetChunks(data)
            if (chunkIndexes.length !== undefined) {

                this.lastChunk = Math.max(...chunkIndexes)
            }
        } catch (error) {
            const status = error.response?.status
            if (status === 404) {
                Logger.info(`Status: ${status}`)
                this.unwatchSpaceCaptions()
                this.checkMasterPlaylist()
                return
            }
            await Logger.error(error.message)
        }
        const recheckInterval = 6000

        setTimeout(() => this.checkDynamicPlaylist(), recheckInterval)
    }

    private async checkMasterPlaylist(): Promise<void> {
        Logger.debug('Checking master playlist')
        try {
            // eslint-disable-next-line max-len
            const masterChunkSize = Util.getChunks(await Downloader.getRawTranscodePlaylist(this.dynamicPlaylistUrl)).length
            Logger.debug(`Master chunk size ${masterChunkSize}, last chunk index ${this.lastChunkIndex}`)
            if (!this.lastChunkIndex || masterChunkSize >= this.lastChunkIndex) {
                this.downloadMedia()
                return
            }
            Logger.warn(`Master chunk size (${masterChunkSize}) lower than last chunk index (${this.lastChunkIndex})`)
        } catch (error) {
            Logger.error(error.message)
        }
        const ms = APP_PLAYLIST_REFRESH_INTERVAL
        Logger.info(`Recheck master playlist in ${ms}ms`)
        setTimeout(() => this.checkMasterPlaylist(), ms)
    }

    private async downloadMedia() {
        try {
            const username = this.getUsername()
            const filename = this.getFilename()
            const metadata = {
                title: this.metadata.title,
                author: this.metadata.creator_results?.result?.legacy?.name,
                artist: this.metadata.creator_results?.result?.legacy?.name,
                episode_id: this.spaceId,
            }
            Logger.info(`File name: ${filename}`)
            Logger.info(`File metadata: ${JSON.stringify(metadata)}`)
            await Downloader.downloadSpace(this.dynamicPlaylistUrl, filename, username, metadata)
            this.emit('complete')
        } catch (error) {
            // Attemp to download transcode playlist right after space end could return 404
            Logger.error(error.message)
            this.retryDownload(10000)
        }
    }

    private retryDownload(timeoutMs: number) {
        Logger.info(`Retry download in ${timeoutMs}ms`)
        setTimeout(() => this.downloadMedia(), timeoutMs)
    }

    private watchSpaceCaptions() {
        this.spaceCaptions = new SpaceCaptions(this.spaceId, this.liveStreamStatus, {
            username: this.getUsername(),
            filename: this.getFilename(),
        })
        this.spaceCaptions.watch()
    }

    private unwatchSpaceCaptions() {
        if (!this.spaceCaptions) {
            return
        }
        this.spaceCaptions.unwatch()
    }

    private async showNotification() {
        if (!program.getOptionValue('notification') || this.isNotificationNotified) {
            return
        }
        try {
            const user = this.metadata.creator_results?.result
            const notification: nodeNotifier.Notification = {
                title: `${user.legacy?.name || ''} Space Live`.trim(),
                message: `${this.metadata.title || ''}`,
            }
            const profileImgUrl: string = user.legacy?.profile_image_url_https?.replace('_normal', '')
            if (profileImgUrl) {
                // Since notifier can not use url, need to download it
                try {
                    const imgPathname = profileImgUrl.replace('https://pbs.twimg.com/', '')
                    Util.createCacheDir(path.dirname(imgPathname))
                    const imgPath = path.join(Util.getCacheDir(), imgPathname)
                    if (!fs.existsSync(imgPath)) {
                        await Downloader.downloadImage(profileImgUrl, imgPath)
                    }
                    notification.icon = imgPath
                } catch (error) {
                    Logger.error(error.message)
                }
            }
            Logger.debug('Notification:', notification)
            nodeNotifier.notify(notification, (error, response) => {
                Logger.debug('Notification callback', { response, error })
                // Tested on win32/macOS, response can be undefined, activate, timeout
                if (!error && (!response || response === 'activate')) {
                    open(this.spaceUrl)
                }
            })
            this.isNotificationNotified = true
        } catch (error) {
            Logger.error(error.message)
        }
    }
}
