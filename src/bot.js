const { Telegraf } = require("telegraf");
const puppeteer = require("puppeteer");
const { createPDF, isValidURL } = require("./pdf");
require("dotenv").config();

const botToken = process.env.BOT_TOKEN;
const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply("Send me a link and I will return it as a PDF! If you want to copy the text from the page, use /text <URL>, otherwise use /view <URL>"));

bot.command("view", async (ctx) => {

  const splitMessage = ctx.message.text.split(" ");

  if (splitMessage.length > 1) {
    const url = splitMessage[1];

    if (isValidURL(url)) {
      try {
        ctx.reply("Processing your request...");
        const result = await createPDF(url, isImage = true);
        ctx.replyWithDocument({
          source: result.buffer,
          filename: result.title,
        });
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          ctx.reply(
            "There was a timeout error while processing the URL. This could be due to the page being too large or the server being slow. Please try again later."
          );
        } else {
          ctx.reply(
            "An error occurred while processing the URL. " +
              JSON.stringify(error)
          );
        }
      }
    } else {
      ctx.reply("Please send a valid URL after the /view command.");
    }
  } else {
    ctx.reply("Usage: /view <URL>");
  }
});

bot.command("text", async (ctx) => {
  const input = ctx.message.text.split(" ");
  if (input.length < 2) {
    ctx.reply("Usage: /text <URL>");
    return;
  }

  const url = input[1];

  if (isValidURL(url)) {
    try {
      ctx.reply("Processing your request...");
      const result = await createPDF(url, isImage = false);
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
    ctx.reply("Please send a valid URL after the /text command.");
  }
});

bot.command("help", (ctx) => {
  const helpMessage = `
🤖 PDF Bot Help:

1. Convert Web Page to PDF with Accessible Text:
- Send a message in the format: /text <URL>
  e.g., /text https://example.com
  This will convert the web page into a PDF where the text can be selected and copied.

2. Create a Visual Copy of a Web Page (non-selectable text):
- Use the command: /view <URL>
  e.g., /view https://example.com
  This creates an exact visual copy of the web page in PDF format, but the text won't be selectable.

Note:
- Ensure the URL starts with "http://" or "https://".
- Only publicly accessible URLs are supported.
- If you face any errors, please check the URL and try again.

3. For any other inquiries or support, please contact the admin.
`;

  ctx.reply(helpMessage);
});

function startBot() {
  bot.launch();
}

module.exports = {
  startBot,
};
