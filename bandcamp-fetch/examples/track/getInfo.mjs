import bcfetch from '../../dist/mjs/index.js';

const trackUrl = 'https://musique.coeurdepirate.com/track/tes-belle';

const params = {
  trackUrl,
  albumImageFormat: 'art_app_large',
  artistImageFormat: 'bio_featured',
  includeRawData: false
};

bcfetch.track.getInfo(params).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
