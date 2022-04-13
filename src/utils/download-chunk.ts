import Twitter from 'twitter-v2';
import fetch, { HeadersInit, Response } from 'node-fetch';
import fs, { mkdir, createWriteStream } from 'fs';
import { open, readdir } from 'fs/promises';
import { URL, URLSearchParams, parse } from 'url';
import { pipeline } from 'stream/promises';
import os from 'os';

// Access the workerData by requiring it.
import { parentPort, workerData } from 'worker_threads';

async function DownloadChunk(url: string) {
    let chunk = await fetch(url);
    let name = url.split('/').at(-1);
    console.log(name);
    await pipeline(chunk.body, createWriteStream(`tmp/${name}`));
}
// Main thread will pass the data you need
// through this event listener.
parentPort.on('message', async url => {
    const result = await DownloadChunk(url);

    // return the result to main thread.
    parentPort.postMessage(result);
});
