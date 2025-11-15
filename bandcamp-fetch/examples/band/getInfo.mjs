import bcfetch from '../../dist/mjs/index.js';

const artistUrl = 'https://macmccaughan.bandcamp.com';
const labelUrl = 'https://mergerecords.bandcamp.com';

const artistInfoParams = {
  bandUrl: artistUrl,
  imageFormat: 'art_app_large',
  labelId: 1415932000
};

const labelInfoParams = {
  bandUrl: labelUrl,
  imageFormat: 'art_app_large'
};

bcfetch.band.getInfo(artistInfoParams).then((results) => {
  console.log(`Artist URL: ${artistUrl}`);
  console.log(JSON.stringify(results, null, 2));
  console.log();
});

bcfetch.band.getInfo(labelInfoParams).then((results) => {
  console.log(`Label URL: ${labelUrl}`);
  console.log(JSON.stringify(results, null, 2));
  console.log();
});
