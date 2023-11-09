declare function urlParse(url: string): string;
declare function parseVideoPage(document: string): {
    title: string;
    mixed: string[];
    audio: string[];
    video: string[];
    subs: string[];
};
declare function formatDuration(durationInSeconds: number): string;

export {
    urlParse,
    parseVideoPage,
    formatDuration
};
