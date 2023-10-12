const express = require("express");
const { startBot } = require("./bot");
const { job } = require("./cron");

const app = express();

job.start();

app.get("/wake-up", (req, res) => {
  res.send("Bot is awake!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

startBot();
