import { parse } from 'node-html-parser';

function urlParse(url) {
    const regex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
    const match = url.match(regex);
    if (match && match[2]) {
        return match[2];
    } else {
        // Handle invalid YouTube URL
        return url;
    }
}

function parseVideoPage(document) {
    const root = parse(document);
    const select = root.querySelector('select');
    const title = root.querySelector('title').rawText.replace(' - Invidious', '');
    const media_informations = {
        title,
        mixed: [],
        audio: [],
        video: [],
        subs: [],
    };

    select.querySelectorAll('option').forEach((item) => {
        if (item.rawText.includes('video only')) {
            const [resolutionStr, extensionFpsStr] = item.rawText.split(' - ');
            const resolution = parseInt(resolutionStr.replace('p', ''));
            const [extension, fpsStr] = extensionFpsStr.split(' @ ');
            const fps = parseInt(fpsStr.replace('fps', ''));
            const data = {
                quality: resolution,
                fps,
                extension,
                query: item.getAttribute('value'),
            };
            media_informations.video.push(data);
        } else if (item.rawText.includes('audio only')) {
            const [extensionQualityStr,] = item.rawText.split(' - ');
            const [extension, qualityStr] = extensionQualityStr.split(' @ ');
            const quality = parseFloat(qualityStr.replace('k', ''));
            const data = {
                quality,
                extension,
                query: item.getAttribute('value'),
            };
            media_informations.audio.push(data);
        } else if (item.rawText.includes('Subtitles')) {
            const [, language] = item.rawText.split(' - ');
            media_informations.subs.push({
                language,
                query: item.getAttribute('value'),
            });
        } else {
            const [resolutionStr, extensionStr] = item.rawText.split(' - ');
            const resolution = parseInt(resolutionStr.replace('p', ''));
            const extension = extensionStr.split('/')[1];
            const data = {
                quality: resolution,
                extension,
                query: item.getAttribute('value'),
            };
            media_informations.mixed.push(data);
        }
    });

    return media_informations;
}

function formatDuration(durationInSeconds) {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


export {
    urlParse,
    parseVideoPage,
    formatDuration
};
