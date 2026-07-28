async function test() {
  const endpoints = [
    '/api/community/posts?page=1&limit=1',
    '/api/community/posts/pinned',
    '/api/community/posts/trending-tags',
    '/api/community/tags',
    '/api/community/posts/drafts/count',
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch('http://localhost:3001' + ep);
      const ok = res.ok ? 'OK' : 'FAIL';
      console.log(ok, res.status, ep);
    } catch (e) {
      console.log('ERR', ep, e.message);
    }
  }
}
test();
