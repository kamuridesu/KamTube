import { parse } from 'node-html-parser';

function urlParse(url) {
    const regex1 = /^(?:http:\/\/)?youtu\.be/;
    const regex2 = /^(?:(?:http:)?\/\/)?(?:www\.)?youtube(?:-nocookie)?.com/;
    const regex3 = /(?:http:\/\/)?(?:www\.)?youtube\.com.*?v=(.{11})/;
    const regex4 = /(?:vi=|vi?\/|embed\/)(.{11})/;
    
    if (regex1.test(url)) {
      return url.match(/^(?:http:\/\/)?youtu\.be\/(.{11})/)[1];
    } else if (regex2.test(url)) {
      let match = url.match(regex3);
      if (!match) {
        match = url.match(regex4);
      }
      if (!match && /user/.test(url)) {
        match = url.split("/");
        return match[match.length - 1].split("?")[0];
      }
      return (match || ["", url])[1];
    } else if (!/\//.test(url)) {
      return url;
    } else {
      return null;
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
