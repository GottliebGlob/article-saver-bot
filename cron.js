const cron = require('cron')
const https = require('https')

const backendUrl = "https://save-article.onrender.com/wake-up";

const job = new cron.CronJob('*/10 * * * *', function () {
    console.log('Restarting server')

    https.get(backendUrl, (res) => {
        if (res.statusCode !== 200) {
            console.error('Did not get an OK from the server. Code: ' + res.statusCode)
        }
        else {
        console.log("Restarted server");
        }

    }).on('error', (e) => {
        console.error("Error during restart" + e.message)
    })
})

module.exports = {
    job
}