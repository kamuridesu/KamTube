#!/usr/bin/env node
import KamTube from './index.js';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as readline from 'readline';
const rline = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const yargs = _yargs(hideBin(process.argv))
const kamtube = new KamTube("cli");

class cli {
    constructor(extract) {
        this.audio_only = extract;
        this.choosen_video = '';
        this.quality = undefined;
    }

    async direct(args) {
        let option = 0;
        if (this.audio_only) option = 1;
        await kamtube.save((await kamtube.search(args))[0].videoId, option);
    }

    async download(args) {
        let option = 0;
        if (this.audio_only) option = 1;
        await this.search(args);
        rline.on('close', async () => {
            // console.log(this.choosen);
            await kamtube.save(this.choosen_video.videoId, option, this.quality);
            process.exit(0);
        });
    }

    async search(args, output) {
        let results = await kamtube.search(args);
        for(const [index, res] of results.entries()) {
            let out = `[${index}] - ${res.title} - ${res.author} - ${res.lengthSeconds}s`
            console.log(out);
        }
        console.log("\n");
        if(output) {
            process.exit(0);
        }
        let option = 'Error!';
        rline.question('Choose an option >>> ', async (opt) => {
            option = opt;
            if (option > results.length - 1) {
                console.log("Error! Cannot access the result!");
                process.exit(1);
            }
            const choosen_video = results[option];
            // console.log(choosen_video);
            this.choosen_video = choosen_video;
            let aud_only = 0;
            if (this.audio_only) aud_only = 1;
            const qualities = (await kamtube.getMediaQuality(choosen_video.videoId, aud_only)).qualities;
            console.log("Now choose the quality: ");
            for(const [index, qua] of qualities.entries()) {
                const out = `[${index}] - ${qua.name}`
                console.log(out);
            }
            console.log("\n");
            let choose = 'Error';
            rline.question("Choose a quality >>> ", async (o) => {
                choose = o;
                if(choose > qualities.length - 1) {
                    console.log("Error! Cannot access the result!");
                    process.exit(1);
                }
                const choosen_quality = qualities[choose];
                this.quality = choosen_quality;
                rline.close();
            });
        });
    }
}

// get the arguments, -x or --extract extracts the audio from the video
function main () {
    const argv = yargs.options({
        'extract': {
            alias: 'x',
            type: 'boolean',
            default: false,
            description: 'Extract the audio from the video'
        },
        'help': {
            alias: 'h',
            type: 'boolean',
            description: 'Show the help'
        },
        'search': {
            alias: 's',
            type: 'boolean',
            description: 'Search for a video or song'
        },
        'direct': {
            alias: 'd',
            type: 'boolean',
            description: 'Directly downloads the video or audio without search prompt'
        }
    }).argv;
    const _cli = new cli(argv.extract);
    if (argv._.length < 1) {
        return;
    }
    if (argv.search) {
        return _cli.search(argv._.join(" "), true);
    }
    if (argv.direct) {
        return _cli.direct(argv._.join(" "));
    }
    return _cli.download(argv._.join(" "));
}

main();
