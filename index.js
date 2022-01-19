import axios from 'axios';
import { parse } from 'node-html-parser';
import fs from 'fs';

class YTBTromloader {
    constructor(url) {
        this.url = url
    }

    async fetcher() {
        const response = await axios.get(this.url);
        return response.data;
    }

    async getVideoInfos() {
        let data = await this.fetcher();
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

    async getVideoDownloadUrl(id) {
        let base_url = "https://ytb.trom.tf/latest_version?download_widget=";
        let data = await this.getVideoInfos();
        try{
            let request_url = base_url + encodeURI((data[id].infos));
            return request_url;
        } catch (e) {
            console.log(e);
        }
    }

    async download(id) {
        try {
            const response = await axios({
                method: "get",
                url: await this.getVideoDownloadUrl(id),
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

    async save(id, path) {
        let data = await this.download(id);
        if (data) {
            fs.writeFileSync(path, data);
        }
    }
}


export default YTBTromloader;