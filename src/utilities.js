function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9\u0400-\u04FF\-]/g, "_") + ".pdf";
}

async function autoScroll(page, maxScrolls = 20) {
  let scrollHeight = -1;
  let attempts = 0;

  while (
    attempts < maxScrolls &&
    scrollHeight !== (await page.evaluate(() => document.body.scrollHeight))
  ) {
    scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(100);
    attempts++;
  }
}

module.exports = {
  sanitizeFilename,
  autoScroll,
};
