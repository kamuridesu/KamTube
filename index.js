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
    *   @return {object}
    *   @description: Get the video info to build the query
    */
    async getVideoInfos(video_id) {
        video_id = await this.urlParser(video_id);
        let data = await this.fetcher("https://ytb.trom.tf/watch?v=" + video_id);
        let parser = parse(data);
        let infos = [];
        let options = parser.getElementsByTagName("select")[0].childNodes;
        for (let i = 0; i < options.length; i++) {
            let option = options[i];
            try{
                let attrs = option.attrs;
                if (attrs != undefined) {
                    infos.push({name: option.text.trim(), infos: attrs.value});
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
    *   @return {string}
    *   @description: Get the video url
    */
    async getVideoDownloadUrl(video_id, quality) {
        video_id = await this.urlParser(video_id);
        quality = quality ? quality : "360"
        const base_url = "https://ytb.trom.tf/latest_version?download_widget=";
        const data = await this.getVideoInfos(video_id);
        try{
            let request_url = base_url
            for(let d of data) {
                if(d.name.includes(quality)) {
                    request_url += encodeURI(d.infos);
                    break;
                }
            }
            return request_url;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /*
    *   @param {string} video_id
    *   @param {string} quality
    *   @return {arraybuffer}
    *   @description: Get the video
    */
    async download(video_id, quality) {
        video_id = await this.urlParser(video_id);
        try {
            const response = await axios({
                method: "get",
                url: await this.getVideoDownloadUrl(video_id, quality),
                headers: {
                    "DNT": 1,
                    "Upgrade-Insecure-Request": 1
                },
                responseType:'arraybuffer'
            })
            return response.data
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
    *   @return {undefined}
    */
    async save(id, path) {
        let data = await this.download(id);
        if (data) {
            fs.writeFileSync(path, data);
        }
    }
}


export default KamTube;