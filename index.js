import axios from 'axios';
import { parse } from 'node-html-parser';
import fs from 'fs';

class KamTube {
    constructor() {
        this.base_api_url = "https://invidious.namazso.eu/api/v1/";
    }

    async fetcher(url) {
        const response = await axios.get(url);
        return response.data;
    }

    async search(query, page, sort_by, date, duration, type, region) {
        page = page ? page : 1
        sort_by = sort_by ? sort_by : "relevance"
        date = date ? "&date=" + date : ""
        duration = duration ? "&duration" : ""
        type = type ? type : "video"
        region = region ? region : "US"
        const full_query = `search?q=${query}&page=${page}&sort_by=${sort_by}&${date}&${duration}&type=${type}&region=${region}`
        return await this.fetcher(this.base_api_url + full_query)
    }

    async getFullMetadata(video_id) {
        return await this.fetcher(this.base_api_url + `videos/${video_id}`)
    }

    async getVideoInfos(video_id) {
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

    async getVideoDownloadUrl(video_id, quality) {
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

    async download(video_id, quality) {
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

    async getThumbnail(video_id) {
        let data = await this.getFullMetadata(video_id);
        let quality = "maxres";
        for (let d of data.videoThumbnails) {
            if (d.quality === quality) {
                return d.url;
            }
        }
    }

    async save(id, path) {
        let data = await this.download(id);
        if (data) {
            fs.writeFileSync(path, data);
        }
    }
}


export default KamTube;