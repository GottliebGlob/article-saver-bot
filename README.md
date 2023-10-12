
# 🤖 Telegram PDF Bot

  

This bot listens to incoming messages for valid URLs. When a URL is provided, the bot fetches the website content and returns it as a PDF file.

https://t.me/article_saver_bot
  

## 🚀 Getting Started

  

1.  **Clone the Repository**:

```bash

git clone https://github.com/GottliebGlob/article-saver-bot.git

cd telegram-pdf-bot

```

  

2.  **Setup Environment Variables**

  

Rename the `.env.sample` to `.env` and update the `BOT_TOKEN` variable with your bot's token.

  

```plaintext

BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE

```

3. **Install Dependencies**:
```bash
    
    `npm install` 
    
```
    
4.  **Run the Bot**:
    
```bash
    
    `npm run start` 
    
   ```

### 🛠️ Built With

-   [Telegraf](https://telegraf.js.org/) - Modern Telegram bot framework for Node.js
-   [Puppeteer](https://pptr.dev/) - Headless Chrome Node.js API

### 📝 License

This project is open-source and available under the MIT License.