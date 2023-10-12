const { Telegraf } = require("telegraf");
const puppeteer = require("puppeteer");
require("dotenv").config();
const express = require("express");

const app = express();

const { job } = require("./cron.js")
job.start()

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
      if (error instanceof puppeteer.errors.TimeoutError) {
        ctx.reply(
          "There was a timeout error while processing the URL. This could be due to the page being too large or the server being slow. Please try again later."
        );
      } else {
        ctx.reply(
          "An error occurred while processing the URL. " + JSON.stringify(error)
        );
      }
    }
  } else {
    ctx.reply("Please send a valid URL.");
  }
});

bot.launch();

app.get("/wake-up", (req, res) => {
  res.send("Bot is awake!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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
    page.waitForTimeout(1000);
  } catch (error) {
    if (error instanceof puppeteer.errors.TimeoutError) {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 1000000 });
      page.waitForTimeout(1000);
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
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("Browser launched.");

    const page = await browser.newPage();
    console.log("New page opened.");

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["video"].includes(request.resourceType())) {
        if (request.resourceType() === "video") {
          request.abort();
        } else {
          request.continue();
        }
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

    // Check if all images have loaded
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
    
    
    console.log("Generating PDF...");
    const pdfBuffer = await page.pdf({ printBackground: true, format: "A4" });
    console.log("PDF generated.");

    console.log("Closing browser...");
    await browser.close();
    console.log("Browser closed.");

    const filename = sanitizeFilename(pageTitle);
    console.log("Filename sanitized:", filename);

    return { buffer: pdfBuffer, title: filename };
  } catch (error) {
    console.error("Error in createPDF:", error);
    if (browser) {
      console.log("Attempting to close browser due to error...");
      await browser.close();
      console.log("Browser closed.");
    }

    throw error;
  }
}

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