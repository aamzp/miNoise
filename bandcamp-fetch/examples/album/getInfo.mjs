import bcfetch from '../../dist/mjs/index.js';

const albumUrl = 'https://musique.coeurdepirate.com/album/blonde';

const params = {
  albumUrl,
  albumImageFormat: 'art_app_large',
  artistImageFormat: 'bio_featured',
  includeRawData: false
};

bcfetch.album.getInfo(params).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
