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
    ): Promise<any|null>;
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
