#!/usr/bin/env node
import KamTube from './index.js';
import _yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const yargs = _yargs(hideBin(process.argv))
const kamtube = new KamTube("cli");

class cli {
    constructor(extract) {
        this.audio_only = extract;
    }

    async run(args) {
        let option = "360";
        if (this.audio_only) option = "audio";
        await kamtube.save((await kamtube.search(args))[0].videoId, option);
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
        }
    }).argv;

    const _cli = new cli(argv.extract);
    if (argv._.length < 1) {
        return;
    }
    _cli.run(argv._.join(" "));
}

main();
