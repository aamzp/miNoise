import bcfetch from '../../dist/mjs/index.js';

const artistUrl = 'https://musique.coeurdepirate.com';
const labelUrl = 'https://randsrecords.bandcamp.com';

const artistDiscogParams = {
  bandUrl: artistUrl,
  imageFormat: 'art_app_large'
};

const labelDiscogParams = {
  bandUrl: labelUrl,
  imageFormat: 'art_app_large'
};

bcfetch.band.getDiscography(artistDiscogParams).then((results) => {
  console.log(`Artist URL: ${artistUrl}`);
  console.log(JSON.stringify(results, null, 2));
  console.log();
});

bcfetch.band.getDiscography(labelDiscogParams).then((results) => {
  console.log(`Label URL: ${labelUrl}`);
  console.log(JSON.stringify(results, null, 2));
  console.log();
});
