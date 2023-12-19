import { Player, Queue, RepeatMode, Song } from "discord-music-player";
import { checkYoutubeLink, getYoutubeMusic, parseLinks } from "./youtube";
import { MusicError } from "../errors/music";
import { ChannelError } from "../errors/channel";
import { listenMusicPlayerEvent } from "../functions/music/events/musicPlayerEvents";

export let musicPlayer: Player;

export default function initializeMusicPlayer(client: any) {
    musicPlayer = new Player(client);
    listenMusicPlayerEvent(client, musicPlayer);
}

/**
 * connect to voice channel and add music to queue
 * 
 * @param title music title or url (only youtube)
 * @param guildId 
 * @param voiceChannelId 
 * @returns 
 */
export async function playMusicApi(title: string, guildId: string, voiceChannelId: string) {
    let queue: Queue = getOrCreateQueue(guildId);
    await connectVoiceChannelApi(guildId, voiceChannelId)

    let musicYoutubeLink = "";

    console.log(title)

    if (checkYoutubeLink(title)) {
        musicYoutubeLink = title;
    }
    else {
        const musicYoutube = await getYoutubeMusic(title);
        if (musicYoutube.items.length == 0) throw MusicError.getDefault("NO_MUSIC_FOUND_ERROR")
        musicYoutubeLink = parseLinks(musicYoutube).items[0]
        console.log(musicYoutubeLink)   
    }

    // TODO: check issue
    let song = await queue.play(title);
    console.log(song.url)
    return song as Song
}

export function pauseMusicApi(guildId: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    guildQueue?.setPaused(true);
}

export function resumeMusicApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    guildQueue?.setPaused(false);
}

export function showMusicListApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    return guildQueue?.songs;
}

export function skipMusicApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    guildQueue?.skip();
    return guildQueue.nowPlaying;
}

export function stopMusicApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    guildQueue?.stop();
}

export function toggleDisableLoopApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    guildQueue?.setRepeatMode(RepeatMode.DISABLED)
}

export function toggleSongLoopApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    guildQueue?.setRepeatMode(RepeatMode.SONG)
}

export function toggleQueueLoopApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    guildQueue?.setRepeatMode(RepeatMode.QUEUE)
}

export function clearQueueApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    guildQueue?.clearQueue()
}

export function shuffleApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    validateConnection(guildQueue)
    return guildQueue?.shuffle()
}

export async function connectVoiceChannelApi(guildId?: string | null, voiceChannelId?: string | null) {
    if (!voiceChannelId) throw new ChannelError({
        name: "NO_VOICE_CHANNEL_ERROR",
        message: "음성 채널을 찾을 수 없어요"
    })
    const guildQueue = getOrCreateQueue(guildId);
    await guildQueue.join(voiceChannelId);
}

export function disconnectVoiceChannelApi(guildId?: string | null) {
    const guildQueue = getOrCreateQueue(guildId);
    if (!guildQueue.connection) throw "음성 채널이 없어요"
    guildQueue.connection?.leave();
    return "음성 채널에서 나갔어요"
}

export function getOrCreateQueue(guildId?: string | null): Queue {
    if (!guildId) throw ChannelError.getDefault("NO_GUILD_CHANNEL_ERROR")
    if (musicPlayer.hasQueue(guildId)) return musicPlayer.getQueue(guildId) as Queue
    else return musicPlayer.createQueue(guildId)
}

function validateConnection(guildQueue: Queue) {
    if (!guildQueue.connection) throw MusicError.getDefault("NO_QUEUE_CONNECTION")
}