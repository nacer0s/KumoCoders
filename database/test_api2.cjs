const http = require('http');

function test(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:3001' + path, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(res.statusCode, path);
        resolve();
      });
    }).on('error', (e) => {
      console.log('ERR', path, e.message);
      resolve();
    });
  });
}

async function main() {
  await test('/api/community/posts?page=1&limit=1');
  await test('/api/community/posts/trending-tags');
  await test('/api/community/posts/drafts/count');
  await test('/api/community/posts/pinned');
  await test('/api/community/tags');
}
main();
