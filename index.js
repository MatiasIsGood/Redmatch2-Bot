const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token, website, banfeed, status, timeout } = require('./config.json');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let banStatusMessage = null;
let currentBanCount = 0;
let isFirstTime = true;

client.once(Events.ClientReady, () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);

  // Start monitoring the website
  monitorWebsite();
});

client.login(token);

async function monitorWebsite() {
  try {
    console.log('Checking website...', website);

    // Send a GET request to the website to retrieve the data
    const response = await axios.get(website);
    const websiteData = response.data;

    // Extract the list of strings from the website data
    const currentStrings = extractStrings(websiteData);

    const addedCount = isFirstTime ? 0 : currentStrings.length - currentBanCount;
    currentBanCount = currentStrings.length;

    const statusChannel = client.channels.cache.get(status);

    // Update the ban status embed every timeout
    updateBanStatus(statusChannel, currentBanCount);

    // Send the differences in the ban feed to the banfeed channel when they change
    if (!isFirstTime && addedCount > 0) {
      const banFeedChannel = client.channels.cache.get(banfeed);
      sendBanFeed(banFeedChannel, currentStrings.slice(-addedCount));
    }

    isFirstTime = false;
  } catch (error) {
    console.error('Error checking website:', error.message);
  }

  // Adjust the interval as needed (e.g., check every minute)
  setTimeout(monitorWebsite, timeout);
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

function sendBanFeed(channel, addedBans) {
  let banFeedMessage = '';

  if (addedBans.length > 0) {
    banFeedMessage += `Added bans:\nhttp://steamcommunity.com/profiles/${addedBans.join('\n')}\n\n`;
  }

  if (banFeedMessage !== '') {
    channel.send(banFeedMessage.trim());
  }
}

function updateBanStatus(channel, banCount) {
  // Check if banStatusMessage already exists
  if (banStatusMessage) {
    // Edit the existing banStatusMessage with the updated ban count
    const embed = generateEmbed(banCount);
    banStatusMessage.edit({ embeds: [embed] })
      .catch((error) => {
        console.error('Error editing ban status message:', error.message);
      });
  } else {
    // Delete all existing messages in the channel
    channel.messages.fetch()
      .then((messages) => {
        // Delete all existing messages in the channel
        const promises = messages.map((message) => message.delete());
        return Promise.all(promises);
      })
      .then(() => {
        // Send the ban status embed
        const embed = generateEmbed(banCount);
        return channel.send({ embeds: [embed] });
      })
      .then((message) => {
        banStatusMessage = message;
      })
      .catch((error) => {
        console.error('Error updating ban status:', error.message);
      });
  }
}


function generateEmbed(banCount) {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('Ban Status')
    .setDescription('The current status of bans in Redmatch 2')
    .setURL('https://github.com/MatiasIsGood')
    .setAuthor({ name: 'Matias', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://github.com/MatiasIsGood' })
    .setThumbnail('https://i.imgur.com/AfFp7pu.png')
    .addFields(
      { name : 'Total Bans', value: banCount.toString()},
    )
    .setTimestamp()
    .setFooter({ text: 'Made by Matias', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

  return embed;
}
