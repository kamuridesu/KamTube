# Examples


## Search for a video and download or save it
```js
import KamTube from 'kamtube' // import the package

const youtube = new KamTube();  // create an instance of the class
let videos = await youtube.search("Never gonna give you up");   // searches the video, this returns an array with the first 18 results metadata
let video_id = videos[0].videoId;  // get the videoId of the first video
// if you want to get the video as bytes
let video_data = await youtube.download(video_id, "360");  // downloads the video by video_id and sets the quality
// if you just want to save the video locally
youtube.save(video_id);
```
## Save all videos from a playlist
```js
import KamTube from 'kamtube' // import the package
const youtube = new KamTube(); // create an instance of the class

let playlist = await youtube.playlist("PLxMD4Nzoqa87MZBJIJXGvCql7xEG4028J"); // call the playlist method that retrieves the playlist information
let video_ids = playlist.map(async (video) => {
    youtube.save(video.videoId); // async download
});
```