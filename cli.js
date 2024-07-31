#!/usr/bin/env node

import { KamTube } from './index.js';
import { formatDuration } from "./src/parsers.js";

import * as readline from 'readline';

class CLI {
    constructor(media_type = 'mixed') {
        this.media_type = media_type;
        this.downloader = new KamTube('cli');
    }

    async search(query) {
        const results = (await this.downloader.search(query)).filter(x => x.type != 'playlist' && x.type != 'channel');
        const template = '[{id}] - {title} - {duration}';
        const results_formatted = results
            .map((result, id) =>
                template.replace(
                    '{id}', id
                ).replace(
                    '{title}', result.title
                ).replace(
                    '{duration}', formatDuration(result.lengthSeconds)
                )
            ).join('\n');
        return {
            text: results_formatted,
            results
        };
    }

    async interactiveSearch(query) {
        const results = await this.search(query);
        console.log(results.text);

        const rline = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve, reject) => {
            rline.question('Choose an option >>> ', async (option) => {
                try {
                    option = parseInt(option);
                    if (option < 0 || option > results.results.length - 1) {
                        throw new Error();
                    }
                    const quality = await this.qualitySelector(results.results[option]);
                    resolve(await this.save(results.results[option], quality));
                } catch (error) {
                    console.log(`Option needs to be a number between 0 and ${results.results.length - 1}`);
                    reject(error);
                } finally {
                    rline.close();
                }
            });
        });
    }


    async qualitySelector(result) {
        const qualities = (await this.downloader.getMediaInfo(result.videoId))[this.media_type];
        const qualities_str = this.media_type === 'video' ?
            qualities.map((quality, index) =>
                `[${index}] - Resolution: ${quality.quality};FPS: ${quality.fps}`
            ).join('\n') :
            qualities.map((quality, index) =>
                `[${index}] - Quality: ${quality.quality}`
            ).join('\n');
        console.log(qualities_str);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve, reject) => {
            rl.question('Choose a quality >>> ', (option) => {
                rl.close();
                if (option < 0 || option > qualities.length - 1 || isNaN(option)) {
                    reject(new Error(`Option needs to be a number between 0 and ${qualities.length - 1}`));
                } else {
                    resolve(qualities[option].quality);
                }
            });
        });
    }

    async directDownload(query) {
        const results = await this.search(query);
        return await this.save(results.results[0]);
    }

    async save(result, quality = null) {
        await this.downloader.save(result.videoId, this.media_type, quality);
    }
}

async function argparse() {
    const args = process.argv.slice(2);
    const usage = () => {
        console.log(`Usage: kamtube [flags] search query
Flags:
  -h or --help: Print this message
  -d or --direct: Direct download (non interactive)
  -x or --extract: download audio only`);
    };
    if (!args.length) {
        usage();
        process.exit(1)
    }
    const known_flags = ['-x', '--extract', '-d', '--direct', '-h', '--help'];
    let extract = 'mixed';
    let direct = false;
    const query_args = [];
    for (const arg of args) {
        switch (arg) {
            case '-x':
            case '--extract':
                extract = 'audio';
                break;
            case '-d':
            case '--direct':
                direct = true;
                break;
            case '-h':
            case '--help':
                usage()
                return;
            default:
                if (known_flags.includes(arg)) {
                    console.log(`Unknown flag: ${arg}`);
                    usage();
                    throw new Error();
                }
                query_args.push(arg);
        }
    }
    const cli = new CLI(extract);
    const query = query_args.join(' ');
    if (direct) {
        await cli.directDownload(query);
        console.log('Download complete!');
    } else {
        try {
            await cli.interactiveSearch(query);
            console.log('Download complete!');
        } catch (e) {
            // console.log(e);
            process.exit(1);
        }
    }
}

argparse();

