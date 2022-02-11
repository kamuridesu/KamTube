import axios from 'axios';
import { parse } from 'node-html-parser';
import fs from 'fs';


class KamTube {
    constructor(mode) {
        this.debug = false;
        if (mode == "cli") this.debug = true;
        this.base_api_url = "https://invidious.namazso.eu/api/v1/";
    }

    debug_log(msg) {
        if (this.debug) console.log(msg);
    }

    /*
    *   @param {string} url
    *   @return {string}
    *   @description: Get the video id from the url
    */
    async urlParser(url) {
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
    *   @param {string} url
    *   @return {object}
    *   @description: Get the content of the url
    */
    async fetcher(url, count) {
        count = count ? count : 0;
        url = encodeURI(url);
        if (count >= 3) {
            if (this.debug) {
                console.log("Too many requests, aborting");
                process.exit(1);
            }
            throw new Error("Max retries");
        }
        try {
          const response = await axios.get(url);
          return response.data;
        } catch (e) {
            this.debug_log("Error fetching resources!, Retrying...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.fetcher(url, count + 1);
        }
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
        this.debug_log("Searching for: " + query);
        page = page ? page : 1
        sort_by = sort_by ? sort_by : "relevance"
        date = date ? "&date=" + date : ""
        duration = duration ? "&duration" + duration : ""
        type = type ? type : "video"
        region = region ? region : "US"
        const full_query = `search?q=${query}&page=${page}&sort_by=${sort_by}${date}${duration}&type=${type}&region=${region}`
        return await this.fetcher(this.base_api_url + full_query)
    }

    /*
    *   @param {string} video_id
    *   @return {object}
    *   @description: Get the video full info
    */
    async getFullMetadata(video_id) {
        video_id = await this.urlParser(video_id);
        return await this.fetcher(this.base_api_url + `videos/${video_id}`)
    }

    /*
    *   @param {string} video_id
    *   @return {Array}
    *   @description: Get the video info to build the query
    */
    async getVideoInfos(video_id) {
        video_id = await this.urlParser(video_id);
        this.debug_log("Downloading webpage");
        let data = await this.fetcher("https://ytb.trom.tf/watch?v=" + video_id);
        this.debug_log("Parsing webpage");
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

    /*
    *   @param {string} video_id
    *   @param {number} audio_video
    *   @param {string} quality
    *   @return {object}
    *   @description: Get the video url, pass 0 to get the full video, 1 to get the audio only, 2 to get the video only
    */
    async getVideoDownloadUrl(video_id, audio_video, quality) {
        this.debug_log("Getting video url");
        video_id = await this.urlParser(video_id);
        const base_url = "https://ytb.trom.tf/latest_version?download_widget=";
        const video_full_data = await this.getVideoInfos(video_id);
        let info_to_build_uri = ""
        if (audio_video == 0) {
            info_to_build_uri = video_full_data.mixed;
        } else if (audio_video == 1) {
            info_to_build_uri = video_full_data.audio;
        } else if (audio_video == 2) {
            info_to_build_uri = video_full_data.video;
        }
        if (quality == "max") {
            quality = audio_video == 0 ? info_to_build_uri[audio_video.length - 1].name : info_to_build_uri[0].name;
        }
        if (quality) {
            for (let i = 0; i < info_to_build_uri.length; i++) {
                if (info_to_build_uri[i].name.includes(quality)) {
                    return {name: video_full_data.name, url: base_url + encodeURI(info_to_build_uri[i].url)};
                }
            }
        }
        return {name: video_full_data.name, url: base_url + encodeURI(info_to_build_uri[0].url)};
    }

    /*
    *   @param {string} video_id
    *   @param {string} quality
    *   @param {number} audio_video
    *   @return {object}
    *   @description: Get the video
    */
    async download(video_id, audio_video, quality) {
        video_id = await this.urlParser(video_id);
        const video_url_data = await this.getVideoDownloadUrl(video_id, audio_video, quality);
        const name = video_url_data.name;
        const url = video_url_data.url;
        try {
            this.debug_log("Downloading video");
            const response = await axios({
                method: "get",
                url: url,
                headers: {
                    "DNT": 1,
                    "Upgrade-Insecure-Request": 1
                },
                responseType:'arraybuffer'
            });
            return {title: name, data: response.data}
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
        video_id = await this.urlParser(video_id);
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
    *   @param {number} audio_video
    *   @param {string} quality
    *   @return {string}
    */
    async save(id, audio_video, quality) {
        let data = await this.download(id, audio_video, quality);
        if (data == null) throw "Error while downloading";
        const bffer = data.data;
        const name = data.title.replace(/\//g, "-");
        if (data) {
            fs.writeFileSync(name + ".mp4", bffer);
            this.debug_log("Success!");
            return name + ".mp4";
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
        const data = await this.fetcher(request_url);
        const videos = data.videos;
        return videos;
    }
}


export default KamTube;
