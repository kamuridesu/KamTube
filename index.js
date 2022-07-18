import axios from 'axios';
import { parse } from 'node-html-parser';
import fs from 'fs';


/*
*   @param {string} url
*   @return {string} with the url of the video
*   @description: Get the video id from the url
*/
async function urlParser(url) {
    url = url.includes("https://") ? url.split("https://")[1] : (url.includes("https://") ? url.split("http://")[1] : url);
    if (url.includes("shorts")) {
        url = url.split("shorts/")[1];
    }
    if (url.includes("watch")) {
        url = url.split("watch?v=")[1]
    }
    if (url.includes("youtu.be")) {
        url = url.split("youtu.be/")[1];
    }
    if (url.includes("?")) {
        url = url.split("?")[0];
    }
    return url;
}

/*
*   @param {string} url: The url of the video
*   @param {number} count: Retry count
*   @return {object} with the data
*   @description: Get the content of the url
*/
async function fetcher(url, count) {
    count = count ? count : 0;
    url = encodeURI(url);
    if (count >= 3) {
        if (this.cli) {
            console.log("Too many requests, aborting");
            process.exit(1);
        }
        throw new Error("Max retries");
    }
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (e) {
        this.cli_log("Error fetching resources!, Retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        fetcher(url, count + 1);
    }
}


class KamTube {
    constructor(mode, debug) {
        this.cli = false;
        this.debug = debug ? debug: false;
        if (mode == "cli") this.cli = true;
        this.base_api_url = "https://invidious.namazso.eu/api/v1/";
        this.download_endpoint = "https://ytb.trom.tf/download";
    }

    cli_log(msg) {
        if (this.cli) console.log(msg);
    }

    debug_log(msg) {
        if (this.debug) console.log(msg);
    }

    /*
    *   @param {string} query
    *   @param {string} page
    *   @param {string} sort_by
    *   @param {string} date
    *   @param {string} duration
    *   @param {string} type
    *   @param {string} region
    *   @return {Array}
    *   @description: Searches for a video
    */
    async search(query, page, sort_by, date, duration, type, region) {
        this.cli_log("Searching for: " + query);
        page = page ? page : 1
        sort_by = sort_by ? sort_by : "relevance"
        date = date ? "&date=" + date : ""
        duration = duration ? "&duration" + duration : ""
        type = type ? type : "video"
        region = region ? region : "US"
        const full_query = `search?q=${query}&page=${page}&sort_by=${sort_by}${date}${duration}&type=${type}&region=${region}`
        return await fetcher(this.base_api_url + full_query)
    }

    /*
    *   @param {string} video_id
    *   @return {object}
    *   @description: Get the video full info
    */
    async getFullMetadata(video_id) {
        video_id = await urlParser(video_id);
        return await fetcher(this.base_api_url + `videos/${video_id}`)
    }

    /*
    *   @param {string} video_id
    *   @return {Array}
    *   @description: Get the video info to build the query
    */
    async getVideoInfos(video_id) {
        video_id = await urlParser(video_id);
        let data = await fetcher("https://ytb.trom.tf/watch?v=" + video_id);
        let parser = parse(data);
        let options = parser.getElementsByTagName("select")[0].childNodes;
        const name = parser.getElementsByTagName("title")[0].innerText.replace(" - Invidious", "").trim();
        let infos = {name: name, mixed: [], audio: [], video: []};
        for (let i = 0; i < options.length; i++) {
            let option = options[i];
            try{
                let attrs = option.attrs;
                if (attrs != undefined) {
                    let quality_name = option.text.trim();
                    if (quality_name.includes("audio only")) {
                        infos.audio.push({
                            name: quality_name,
                            url: attrs.value
                        });
                    } else if (quality_name.includes("video only")) { 
                        infos.video.push({
                            name: quality_name,
                            url: attrs.value
                        });
                    } else {
                        infos.mixed.push({
                            name: quality_name,
                            url: attrs.value
                        });
                    }
                }
            } catch (e) {
                //
            }
        }
        return infos;
    }

    /* @param {string} media_id
    *  @param {number} audio_or_video 1 for audio only, 2 for video only
    *  @return {object}
    *  @description: Get the media resolution options
    */
    async getMediaQuality(media_id, audio_or_video) {
        this.cli_log("Getting quality options...");
        media_id = await urlParser(media_id);
        const base_url = "https://ytb.trom.tf/latest_version?download_widget=";
        const media_full_data = await this.getVideoInfos(media_id);
        let media_data = media_full_data.mixed;
        if(audio_or_video == 1) {
            media_data = media_full_data.audio;
        } else if(audio_or_video == 2) {
            media_data = media_full_data.video;
        }
        return {'media_title': media_full_data.name, "qualities": media_data};
    }

    /*
    *   @param {string} media_id
    *   @param {number} audio_or_video
    *   @param {string} quality
    *   @return {object}
    *   @description: Get the video url, pass 0 to get the full video, 1 to get the audio only, 2 to get the video only
    */
    async getMediaDownloadBody(media_id, audio_or_video, quality) {
        this.cli_log("Getting video url");
        media_id = await urlParser(media_id);
        let aviable_qualities_infos = await this.getMediaQuality(media_id, audio_or_video);
        let aviable_qualities = aviable_qualities_infos.qualities;
        let media_title = aviable_qualities_infos.media_title;
        if(quality) {
            if(quality == 'max') {
                quality = audio_or_video == 0 ? aviable_qualities[0] : aviable_qualities[aviable_qualities.length - 1];
            } else {
                for(let i = 0; i < aviable_qualities.length; i++) {
                    if(aviable_qualities[i].name.includes(quality)) {
                        quality = aviable_qualities[i];
                    }
                }
            }
        } else {
            quality = aviable_qualities.length > 1 ? aviable_qualities[1] : aviable_qualities[0];
        }
        let body = {
            'id': media_id,
            'title': media_title,
            'download_widget': quality.url
        }
        return body;
    }

    /*
    *   @param {string} video_id
    *   @param {string} quality
    *   @param {number} audio_or_video
    *   @return {object}
    *   @description: Get the video
    */
    async download(media_id, audio_or_video, quality) {
        media_id = await urlParser(media_id);
        const media_download_body = await this.getMediaDownloadBody(media_id, audio_or_video, quality);
        const body = `id=${media_download_body.id}&title=${media_download_body.title}&download_widget=${encodeURIComponent(media_download_body.download_widget)}`
        const title = media_download_body.title;
        try {
            this.cli_log("Downloading media");
            const response = await axios({
                method: "post",
                url: this.download_endpoint,
                data: body,
                headers: {
                    "DNT": 1,
                    "Upgrade-Insecure-Request": 1
                },
                responseType:'arraybuffer'
            });
            return {title: title, data: response.data}
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /*
    *   @param {string} video_id
    *   @return {string}
    *   @description: Get the video thumbnail
    */
    async getThumbnail(video_id) {
        video_id = await urlParser(video_id);
        let data = await this.getFullMetadata(video_id);
        let quality = "maxres";
        for (let d of data.videoThumbnails) {
            if (d.quality === quality) {
                return d.url;
            }
        }
    }

    /*
    *   @param {string} video_id
    *   @param {number} audio_or_video
    *   @param {string} quality
    *   @return {string}
    */
    async save(id, audio_or_video, quality) {
        let data = await this.download(id, audio_or_video, quality);
        if (data == null) throw "Error while downloading";
        const bffer = data.data;
        const name = data.title.replace(/\//g, "-");
        if (data) {
            const ext = audio_or_video == 1 ? ".mp3" : ".mp4"
            fs.writeFileSync(name + ext, bffer);
            this.cli_log("Success!");
            return name + ext;
        }
        throw "Error while saving";
    }

    /*
    *   @param {string} playlist_id
    *   @return {Array}
    *   @description: Get all the videos from the playlist
    */
    async playlist(playlist_id) {
        const request_url = this.base_api_url + "playlists/" + playlist_id;
        const data = await fetcher(request_url);
        const videos = data.videos;
        return videos;
    }
}


export default KamTube;
