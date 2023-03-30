import { get, post } from "./src/networking.js"
import { urlParse, parseVideoPage } from "./src/parsers.js";
import { promises as fs } from 'fs';

class KamTube {
    constructor(mode="string", debug=false) {
        this.mode = mode;
        this.debug = debug;
        this.cli = mode === "cli";
        this.base_api_url = "https://invidious.namazso.eu/api/v1/";
        this.video_html_page = "https://ytb.trom.tf/watch?v=";
        this.download_endpoint = "https://ytb.trom.tf/download";
    }

    async cliLog(message) {
        if (this.cli) {
            console.log(message);
        }
    }

    async search(
        query,
        page="",
        date="",
        sort_by="",
        duration="",
        _type="",
        region=""
    ) {
        date = date ? `&date=${date}` : "";
        duration = duration != 0 ? `duration=${duration}` : "";
        region = region ? `&region=${region}` : "";
        const full_query = `search?q=${query}&page=${page}&sort_by=${sort_by}${duration}${date}&type=${_type}${region}`;
        const response = (await get(this.base_api_url + full_query));
        return response;
    }

    async getMediaMetadata(media_id){
        media_id = urlParse(media_id);
        const result = (
            await get( this.base_api_url + `videos/${media_id}`)
        )
        if (!result) {
            try{
                const json_error = result.error;
                console.error(
                    "Error while retrieving "
                    + this.base_api_url
                    + `videos/${media_id}: `
                    + json_error
                );
                throw Error(json_error);
            } catch (e){
                throw Error(e);
            }
        }
        return result;
    }

    async getMediaInfo(media_id){
        media_id = urlParse(media_id);
        const headers = {
            "Host": "ytb.trom.tf",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": 1,
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": 1,
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Sec-GPC": 1,
            "Pragma": "no-cache",
            "Cache-Control": "no-cache"
        }
        const data = (await get(this.video_html_page + media_id, headers, "text"));
        return parseVideoPage(data);
    }

    async getThumbnail(media_id, quality = "maxres"){
        media_id = urlParse(media_id);
        const data = await this.getMediaMetadata(media_id);
        for (const q of data["videoThumbnails"]){
            if (q["quality"] == quality){
                return q["url"];
            }
        }
    }

    async processDownloadBody(media_id, media_type, quality) {
        if (media_type === "subs") {
            throw new Error("Subs are not implemented yet!");
        }
        if (!["mixed", "video", "audio", "subs"].includes(media_type)) {
            throw new TypeError("Media type can only be 'mixed', 'video', 'audio' or 'subs'");
        }
        const data = await this.getMediaInfo(media_id);
        const available_qualities_infos = data[media_type];
        if (!quality && media_type !== "subs") {
            quality = Math.max(...available_qualities_infos.map(x => x.quality));
        }
        const item = available_qualities_infos.find(x => x.quality === quality);
        if (item) {
            return {
                id: media_id,
                title: data.title,
                query: item.query,
                extension: item.extension,
            };
        }
        console.error("Cannot process download body! Please, check the parameters");
        throw new Error("Cannot process download body! Please, check the parameters");
    }

    async download(media_id, media_type="mixed", quality=null) {
        const body = await this.processDownloadBody(media_id, media_type, quality);
        this.cliLog("Downloading " + body["title"]);
        const headers ={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0",
            "Accept": "*/*",
            "DNT": 1,
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": 1,
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Sec-GPC": 1,
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
            "Content-type": "application/x-www-form-urlencoded"
        }
        const body_query = `id=${body.id}&title=${body.title}&download_widget=${encodeURIComponent(body.query)}`;
        const response = await post(this.download_endpoint, body_query, headers, "arraybuffer");
        const result = {
            "title": body["title"],
            "type": media_type,
            "extension": body["extension"],
            "data": response,
        };
        return result;
    }

    async save(media_id, media_type = "mixed", quality = null) {
        const response = await this.download(media_id, media_type, quality);
        let extension = response.extension;
        if (media_type === "audio") {
          extension = "mp3";
        }
        const filename = `${response.title.replace("/", "-").replace("|", "")}.${extension}`;
        await fs.writeFile(filename, response.data);
        return response.title;
    }
}


export {
    KamTube
};
