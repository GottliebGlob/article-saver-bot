const puppeteer = require("puppeteer");
const { sanitizeFilename, autoScroll } = require("./utilities");

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function loadPage(page, url) {
    try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 100000 });
        await page.waitForTimeout(1000);
    } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
            await page.goto(url, { waitUntil: "networkidle0", timeout: 1000000 });
            await page.waitForTimeout(1000);
        } else {
            throw error;
        }
    }
}

async function createPDF(url, isImage) {
  console.log("Starting createPDF for URL:", url);

  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("Browser launched.");

    const page = await browser.newPage();
    console.log("New page opened.");

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.resourceType() === "video") {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.setViewport({
      width: 1680,
      height: 1050,
    });
    console.log("Viewport set.");

    console.log("Loading page...");
    await loadPage(page, url);
    console.log("Page loaded.");

    const allImagesLoaded = await page.evaluate(() => {
      return [...document.images].every((img) => img.complete);
    });
    if (!allImagesLoaded) {
      console.log("Waiting for all images to load...");
      await page.waitForTimeout(5000);
    }

    const pageTitle = await page.title();
    console.log("Retrieved page title:", pageTitle);

    console.log("Starting auto-scroll...");
    await autoScroll(page);
    console.log("Auto-scroll completed.");


    if (isImage) {
      console.log("Taking a screenshot...");
      const screenshotBuffer = await page.screenshot({ fullPage: true });
      console.log("Screenshot taken.");
      await page.setContent(`
  <img src="data:image/png;base64,${screenshotBuffer.toString(
    "base64"
  )}" style="width: 100%; height: auto;">
`);
    }
   
    console.log("Generating PDF." + (isImage ? " from image" : ""));

    const pdfBuffer = await page.pdf({ printBackground: true, format: "A4" });
    console.log("PDF generated.");

    console.log("Closing browser...");
    await browser.close();
    console.log("Browser closed.");

    const filename = sanitizeFilename(pageTitle);
    console.log("Filename sanitized:", filename);

    return { buffer: pdfBuffer, title: filename };
  } catch (error) {
    console.error("Error in create PDF:", error);
    if (browser) {
      console.log("Attempting to close browser due to error...");
      await browser.close();
      console.log("Browser closed.");
    }

    throw error;
  }
}

module.exports = {
  isValidURL,
  createPDF,
};