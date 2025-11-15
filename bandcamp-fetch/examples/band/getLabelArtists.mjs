import bcfetch from '../../dist/mjs/index.js';

const labelUrl = 'https://mergerecords.bandcamp.com';

const params = {
  labelUrl,
  imageFormat: 'art_app_large'
};

bcfetch.band.getLabelArtists(params).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
