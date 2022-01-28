import axios from 'axios';
import { parse } from 'node-html-parser';
import fs from 'fs';

class KamTube {
    constructor() {
        this.base_api_url = "https://invidious.namazso.eu/api/v1/";
    }

    /*
    *   @param {string} url
    *   @return {string}
    *   @description: Get the video id from the url
    */
    async urlParser(url) {
        if(!url.includes("https://")) {
            url = "https://" + url;
        }
        if (url.includes("youtu.be")) {
            url = url.split("/");
            let id = 0;
            if ("shorts" in url) {
                id = url[4];
            } else {
                id = url[3];
            }
            url = id;
        } else if (url.includes("youtube.com")) {
            url = url.replace("youtube.com/watch?=");
        }
        if (url.includes("&")) {
            url = url.split("&")[0];
        }
        if (url.includes("https://")) {
            url = url.split("https://")[1];
        }
        return url;
    }

    /*
    *   @param {string} url
    *   @return {object}
    *   @description: Get the content of the url
    */
    async fetcher(url) {
        const response = await axios.get(url);
        return response.data;
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
        let data = await this.fetcher("https://ytb.trom.tf/watch?v=" + video_id);
        let parser = parse(data);
        let options = parser.getElementsByTagName("select")[0].childNodes;
        const name = parser.getElementsByTagName("title")[0].innerText.replace(" - Invidious", "").trim();
        let infos = {name: name, infos: []};
        for (let i = 0; i < options.length; i++) {
            let option = options[i];
            try{
                let attrs = option.attrs;
                if (attrs != undefined) {
                    infos.infos.push({name: option.text.trim(), urinfo: attrs.value});
                }
            } catch (e) {
                //
            }
        }
        return infos;
    }

    /*
    *   @param {string} video_id
    *   @param {string} quality
    *   @return {object}
    *   @description: Get the video url
    */
    async getVideoDownloadUrl(video_id, quality) {
        video_id = await this.urlParser(video_id);
        quality = quality ? quality : "360"
        const base_url = "https://ytb.trom.tf/latest_version?download_widget=";
        const v_data = await this.getVideoInfos(video_id);
        const data = v_data.infos;
        const name = v_data.name;
        try{
            let request_url = base_url
            for(let d of data) {
                if(d.name.includes(quality)) {
                    request_url += encodeURI(d.urinfo);
                    break;
                }
            }
            return {name: name, uri: request_url};
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /*
    *   @param {string} video_id
    *   @param {string} quality
    *   @return {object}
    *   @description: Get the video
    */
    async download(video_id, quality) {
        video_id = await this.urlParser(video_id);
        const video_url_data = await this.getVideoDownloadUrl(video_id, quality);
        const name = video_url_data.name;
        const url = video_url_data.uri;
        try {
            const response = await axios({
                method: "get",
                url: url,
                headers: {
                    "DNT": 1,
                    "Upgrade-Insecure-Request": 1
                },
                responseType:'arraybuffer'
            })
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
    *   @param {string} path
    *   @return {string}
    */
    async save(id) {
        let data = await this.download(id);
        if (data == null) throw "Error while downloading";
        const bffer = data.data;
        const name = data.title
        if (data) {
            fs.writeFileSync(name + ".mp4", bffer);
            return name + ".mp4";
        }
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
let x = await new KamTube().playlist("PLxMD4Nzoqa87MZBJIJXGvCql7xEG4028J")
x.map(async (video) => {
    console.log("Downloading " + video.title);
    new KamTube().save(video.videoId);
});