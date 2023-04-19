const request = require('request-promise');
const cheerio = require('cheerio');
const url = require('url');

const crawl = async (startUrl, maxDepth, maxConcurrency, callback) => {
  const visited = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  let activeCount = 0;
  
  const processQueue = async () => {
    while (queue.length > 0 && activeCount < maxConcurrency) {
      const { url: currentUrl, depth } = queue.shift();
      if (visited.has(currentUrl) || depth > maxDepth) {
        continue;
      }
      visited.add(currentUrl);
      activeCount++;
      try {
        const html = await request(currentUrl);
        const $ = cheerio.load(html);
        console.log($('body').text())
        await callback($, currentUrl, depth);
        $('a').each((i, link) => {
          const href = $(link).attr('href');
          if (href) {
            const nextUrl = url.resolve(currentUrl, href);
            queue.push({ url: nextUrl, depth: depth + 1 });
          }
        });
      } catch (err) {
        console.error(`Error crawling ${currentUrl}: ${err}`);
      }
      activeCount--;
    }
    if (queue.length > 0 || activeCount > 0) {
      setTimeout(processQueue, 1000);
    }
  };
  
  await processQueue();
};

crawl('https://en.wikipedia.org/wiki/Ghana', 2, 10, ($, url, depth) => {
  console.log(`Crawled ${url} at depth ${depth}`);
  // Process the data here
}).catch(err => {
  console.error(`Error crawling: ${err}`);
});
