declare function get(url: string, headers?: any, response_type?: string): Promise<any>;
declare function post(url: string, headers?: any, response_type?: string): Promise<any>;

export {
    get, post
};
