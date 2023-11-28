import axios from 'axios';


async function get(url, headers, response_type = "json") {
    try {
        const response = await axios({
            method: "get",
            url: url,
            headers: headers ? headers : {
                "DNT": 1,
                "Upgrade-Insecure-Request": 1
            },
            responseType: response_type
        });
        if (response.status == 200) {
            return response.data;
        }
    } catch (error) {
        console.error(error);
    }
    return null;
}


async function post(url, data, headers, response_type = "json") {
    try {
        const response = await axios({
            method: "post",
            url: url,
            headers: headers ? headers : {
                "DNT": 1,
                "Upgrade-Insecure-Request": 1
            },
            data: data ? data : "",
            responseType: response_type
        });
        return response.data
    } catch (e) {
        console.error(e);
    }
}


export {
    get, post
};
