# KamTube
Download video and audio from Youtube

## Usage
### As package
`npm i kamtube`

`import KamTube from 'kamtube'`
### As CLI app
`npm i -g kamtube@latest`

`kamtube [URL|search query]`

CLI also supports `-x` argument, this means that only the audio will be downloaded.

Examples in [docs/examples.md](https://github.com/kamuridesu/KamTube/blob/main/docs/examples.md)

## Purpose
This package uses ytb.trom.tf and Invidious instances to load the videos, retrieve metadata and download. Those youtube alternate frontends aren't blocked on places that youtube may be and are trade-free, making them a good alternative.

The downside is that they are much slower than default youtube and modules, so my recommendation is to only use this as last alternative.

