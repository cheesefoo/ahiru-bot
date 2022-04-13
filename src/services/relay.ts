import { Client, TextChannel } from 'discord.js';
import { Video } from 'holodex.js';
import { io } from 'socket.io-client';
import { Logger } from './index';

import { MessageUtils } from '../utils';

export class Relay {
    private broadcastCh = '963848133475967086';
    // private broadcastCh = '722257568361087057';
    private tldex;
    public subscribedVideos = [];

    constructor(private client: Client) {
        this.start().then(() => Logger.info('relay created'));
    }

    public async start(): Promise<void> {
        let ch = this.client.channels.cache.get(this.broadcastCh) as TextChannel;

        this.tldex = io('wss://holodex.net', {
            path: '/api/socket.io/',
            transports: ['websocket'],
        });

        this.tldex.on('connect_error', err => console.error(err));
        this.tldex.on('connect', () => {
            Logger.info('connected to socket');
        });
        this.tldex.on('subscribeSuccess', async msg => {
            Logger.info('subscribeSuccess ' + JSON.stringify(msg));
            this.subscribedVideos.push(msg.id);
            ch = this.client.channels.cache.get(this.broadcastCh) as TextChannel;
            await MessageUtils.send(ch, `Relaying holodex TLs for ${msg.id} :SubaDerp:`);
            Logger.error(this.subscribedVideos.toString());
        });
        const retries: Record<string, number> = {};
        this.tldex.on('subscribeError', msg => {
            /*            retries[msg.id]++;
                        if (retries[msg.id] < 20)
                        {
                            setTimeout(() => this.setupLive(live), 30000);
                        } else
                        {
                            delete retries[msg.id];
                        }*/
        });
        this.tldex.onAny((evtName, ...args) => {
            if (!evtName.includes('/en') && evtName !== 'subscribeSuccess') {
                Logger.warn(evtName + ': ' + JSON.stringify(args));
            }
        });
    }

    public setupLive(live: Video): void {
        let ch = this.client.channels.cache.get(this.broadcastCh) as TextChannel;

        Logger.info(`setting up ${live.status} ${live.videoId} ${live.title}`);
        // this.tldex.emit('subscribe', { video_id: live.videoId });
        this.tldex.emit('subscribe', { video_id: live.videoId, lang: 'en' });

        this.tldex.on(`${live.videoId}/en`, async msg => {
            Logger.info(`Received a message in ${live.videoId}: ${JSON.stringify(msg)}`);

            if (msg.name) {
                const cmt = {
                    id: msg.channel_id ?? 'MChad-' + (msg.name as string),
                    name: msg.name,
                    body: msg.message.replace(/:http\S+( |$)/g, ':'),
                    time: msg.timestamp,
                    isMod: msg.is_moderator,
                    isOwner: msg.channel_id === live.channel.channelId,
                    isTl: msg.is_tl || msg.source === 'MChad',
                    isV: msg.is_vtuber,
                    isVerified: msg.is_verified,
                };
                if (cmt.isV || cmt.isTl || cmt.isOwner) {
                    await MessageUtils.send(ch, `<t:${cmt.time}:t>${cmt.name}:${cmt.body}`);
                }
            } else if (msg.type === 'end') {
                await MessageUtils.send(ch, 'おつヴぁる～ (Stream ended).');
            }
        });
    }
}
