export declare interface Video {
    title: string;
    videoId: string;
    lengthSeconds: number;
    videoThumbnails: Thumbnails;
}

export declare interface Thumbnails {
    quality?: string;
    url: string;
    width: number;
    height: number;
}

export declare interface SearchAPIResponse {
    type: string;
    title?: string;
    author: string;
    authorId: string;
    authorUrl: string;
    authorVerified: boolean;
    authorThumbnails: AuthorThumbnails[];
    autoGenerated: boolean;
    subCount: number;
    videoCount: number;
    description: string;
    descriptionHtml: string;
    viewCountText?: string;
    published?: number;
    publishedText?: string;
    lengthSeconds?: number;
    liveNow?: boolean;
    premium?: boolean;
    isUpcoming?: boolean;
    playlistId?: string;
    playlistThumbnail?: string;
    videoCount?: number;
    videos?: Video[];
    videoId?: string;
}


declare class KamTube {
    constructor(
        mode?: string,
        debug?: boolean,
    );

    cliLog(message: string): Promise<void>;
    search(
        query: string,
        page?: string,
        date?: string,
        sort_by?: string,
        duration?: string,
        _type?: string,
        region?: string
    ): Promise<SearchAPIResponse[]>;
    getMediaMetadata(media_id: string): Promise<any>;
    getMediaInfo(media_id: string): Promise<{
        title: string;
        mixed: string[];
        audio: string[];
        video: string[];
        subs: string[];
    }>;
    getThumbnail(media_id: string, quality?: string): Promise<string|null>;
    processDownloadBody(media_id: string, media_type: string, quality: string): Promise<{
        id: string;
        title: string;
        query: string;
        extension: string;
    }>;
    download(media_id: string, media_type?: string, quality?: string | null): Promise<{
        title: string;
        type: string;
        extension: string;
        data: ArrayBuffer;
    }>;
    save(media_id: string, media_type?: string, quality?: string | null): Promise<string>;
}

export { KamTube };
