# KamTube
This package uses ytb.trom.tf and Invidious instances to load the videos, retrieve metadata and download. Those youtube alternate frontends aren't blocked on places that youtube may be and are trade-free, making them a good alternative.

The downside is that they are much slower than default youtube and modules, so my recommendation is to only use this as last alternative.

## Methods
### urlParser
Parses the URL and returns only the video id.

Params:
* url: url to be parsed

Returns:
* the video id parsed from the url
### fetcher
Gets the url content

Params
* url: the url from where you want to get the data

Returns:
* the response fetched from the url
### search
Searches for a video

Params:
* query: query to be searched
* page: page to search (defaults to 1)
* sort_by: sort order (defaults to relevance)
* date: date of the video (defaults to none)
* duration: duration of the video (defaults to none)
* type: type of the content (defaults to video)
* region: region to use on search (defaults to US)

Returns:
* A list of 18 objects cotaining all the video metadata
### getFullMetadata
Gets all video metadata (including recomendations)

Params:
* video_id: id of the video

Returns:
* an object with all the metadata
### getVideoInfos
Get all info of that video (this is used by all download functions, as its main use is to retrieve the id of the video in a query)

Params:
* video_id: id of the video

Returns:
* a list of objects containing the qualiaty and necessary info to build the query

### getVideoDownloadUrl
Gets the video url, getting the infos from the method above

Params:
* video_id: id of the video
* quality: the quality of the video, pass "audio" to download as audio

Returns:
* The encoded URI to direct download
* null in case of error

### download
Downloads the video and get the result into an arraybuffer

Params:
* video_id: if of the video to be download
* quality: quality of the video, pass "audio" to download as audio

Returns:
* an arraybuffer with the video or audio download
* null in case of error
### getThumbnail
Gets the thumbnail url (maxres)

Params:
* video_id: id of the video

Returns:
* a string with the maxres thumbnail url
### save
Saves the video/audio to a file

Params:
* id: id of the video
* path: same as filename

Returns:
* undefined