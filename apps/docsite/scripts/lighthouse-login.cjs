/* global module, URL */
// Public local-test fixture, not a production credential.
module.exports = async (browser, context) => {
  const page = await browser.newPage();
  try {
    await page.goto(new URL("/__access/login?lang=en", context.url).href);
    if (!new URL(page.url()).pathname.startsWith('/__access/')) return;
    await page.type('input[name="password"]', 'yami-local-preview-only');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);
    if (new URL(page.url()).pathname.startsWith('/__access/')) throw new Error('Lighthouse test login failed');
  } finally {
    await page.close();
  }
};
