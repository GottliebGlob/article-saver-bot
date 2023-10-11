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
      await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    } else {
      throw error;
    }
  }
}

async function createPDF(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({
    width: 1200,
    height: 800,
  });

  await loadPage(page, url); 

  const pageTitle = await page.title();
  await autoScroll(page);

  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  const filename = sanitizeFilename(pageTitle);
  return { buffer: pdfBuffer, title: filename };
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
