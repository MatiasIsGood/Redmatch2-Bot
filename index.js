const { Client, Events, GatewayIntentBits } = require('discord.js');
//const { token, website, channelid } = require('./config.json');
const axios = require('axios');
token = process.env.token
website = process.env.website
channelid = process.env.channelid

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);

  // Start monitoring the website
  monitorWebsite();
});

client.login(token);

let previousStrings = null;
let firstRun = true;

async function monitorWebsite() {
  while (true) {
    try {
      console.log('Checking website...', website);

      // Send a GET request to the website to retrieve the data
      const response = await axios.get(website);
      const websiteData = response.data;

      // Extract the list of strings from the website data
      const currentStrings = extractStrings(websiteData);

      if (previousStrings === null) {
        // First run, save the current strings
        previousStrings = currentStrings;
      } else {
        // Compare the current strings with the previous strings
        const addedStrings = currentStrings.filter(str => !previousStrings.includes(str));
        const removedStrings = previousStrings.filter(str => !currentStrings.includes(str));

        if (addedStrings.length > 0 || removedStrings.length > 0) {
          console.log('Changes detected! Sending message to Discord channel...');

          const channel = client.channels.cache.get(channelid);
          const message = generateMessage(addedStrings, removedStrings);

          channel.send(message);

          // Update the previous strings with the current strings
          previousStrings = currentStrings;
        } else {
          console.log('No changes detected.');
        }
      }

      if (firstRun) {
        // Save the initial strings
        previousStrings = currentStrings;
        firstRun = false;
      }
    } catch (error) {
      console.error('Error checking website:', error.message);
    }

    // Adjust the interval as needed (e.g., check every minute)
    await delay(60000);
  }
}

function extractStrings(websiteData) {
  // Extract the list of strings from the website data
  // Modify this function based on the structure of your website data

  // Here, we assume the website data is an object with a "bans" property that contains an array of strings
  // You may need to adjust this based on the actual structure of your website data

  if (websiteData && Array.isArray(websiteData.bans)) {
    return [...websiteData.bans];
  } else {
    throw new Error('No "bans" array found in website data');
  }
}

function generateMessage(addedStrings, removedStrings) {
  let message = 'Added / removed ban in Redmatch 2:\n\n';

  if (addedStrings.length > 0) {
    message += `Added bans:\n${addedStrings.join('\n')}\n\n`;
  }

  if (removedStrings.length > 0) {
    message += `Removed bans:\n${removedStrings.join('\n')}\n\n`;
  }

  return message;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
