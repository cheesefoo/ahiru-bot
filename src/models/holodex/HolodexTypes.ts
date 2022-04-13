export type ChatComment = {
    id: string;
    name: string;
    body: string;
    time: number;
    isMod: boolean;
    isOwner: boolean;
    isTl?: boolean;
    isV?: boolean;
};

export type HolodexFrame = {
    id: string;
    title: string;
    type: 'stream' | 'clip';
    topic_id?: string;
    published_at: string;
    available_at: string;
    duration: number;
    status: 'new' | 'upcoming' | 'live' | 'past' | 'missing';
    start_scheduled: string;
    start_actual?: string;
    description: string;
    channel: HolodexChannel;
};
export type HolodexChannel = {
    id: string;
    name: string;
    org: string;
    type: 'vtuber' | 'subber';
    photo: string;
    english_name: string;
};
