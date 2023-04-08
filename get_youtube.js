//const {google} = require('googleapis');
//const moment = require('moment');

import {google} from "googleapis";
import moment from "moment";

export async function get_info(videoId, apiKey) {
  const youtube = google.youtube({
    version: 'v3',
    auth: apiKey
  });

  const request = youtube.videos.list({
    part: 'snippet,contentDetails,statistics',
    id: videoId
  });

  return request.then(response => {
    const video = response.data.items[0];
    const title = video.snippet.title;
    const thumbnail = video.snippet.thumbnails.medium.url;
    //const tags = video.snippet.tags;
    //const duration = moment.duration(video.contentDetails.duration).format('hh:mm:ss');
    const duration = moment.utc(moment.duration(video.contentDetails.duration).asMilliseconds()).format('HH:mm:ss');
    return {title, thumbnail, duration};
  });
}

//module.exports = getYoutubeVideoInfo;