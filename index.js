const { Telegraf } = require("telegraf");
const puppeteer = require("puppeteer");
require("dotenv").config();

const botToken = process.env.BOT_TOKEN;
const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply("Send me a link and I will return it as a PDF!"));

bot.on("text", async (ctx) => {
  const url = ctx.message.text;

  if (isValidURL(url)) {
    try {
      ctx.reply("Processing your request...");
      const result = await createPDF(url);
      ctx.replyWithDocument({ source: result.buffer, filename: result.title });
    } catch (error) {
      ctx.reply("An error occurred while processing the URL. " + JSON.stringify(error));
    }
  } else {
    ctx.reply("Please send a valid URL.");
  }
});

bot.launch();

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
    await page.goto(url, { waitUntil: "networkidle2", timeout: 10000 });
  } catch (error) {
    if (error instanceof puppeteer.errors.TimeoutError) {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 100000 });
    } else {
      throw error;
    }
  }
}

async function createPDF(url) {
  console.log("Starting createPDF for URL:", url);

  let browser;
  try {
    console.log("Launching browser...");
   const browser = await puppeteer.launch({
     args: ["--no-sandbox", "--disable-setuid-sandbox"],
   });
    console.log("Browser launched.");

    const page = await browser.newPage();
    console.log("New page opened.");

    await page.setViewport({
      width: 1200,
      height: 800,
    });
    console.log("Viewport set.");

    console.log("Loading page...");
    await loadPage(page, url);
    console.log("Page loaded.");

    const pageTitle = await page.title();
    console.log("Retrieved page title:", pageTitle);

    console.log("Starting auto-scroll...");
    await autoScroll(page);
    console.log("Auto-scroll completed.");

    console.log("Generating PDF...");
    const pdfBuffer = await page.pdf({ format: "A4" });
    console.log("PDF generated.");

    console.log("Closing browser...");
    await browser.close();
    console.log("Browser closed.");

    const filename = sanitizeFilename(pageTitle);
    console.log("Filename sanitized:", filename);

    return { buffer: pdfBuffer, title: filename };
  } catch (error) {
    console.error("Error in createPDF:", error);

    // Close browser in case of an error to prevent lingering instances.
    if (browser) {
      console.log("Attempting to close browser due to error...");
      await browser.close();
      console.log("Browser closed.");
    }

    throw error; // Re-throw the error so you can handle it upstream.
  }
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9\u0400-\u04FF\-]/g, "_") + ".pdf";
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
