require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const instagramUrlDirect = require('instagram-url-direct');
const sharp = require('sharp');
const express = require('express');

const app = express();
const port = 3000;

// Set up Express server
app.get('/', (req, res) => {
    res.send('Hello, Bot is running!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Replace with your Telegram Bot API token
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true }); // Set polling to true

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (!messageText) {
        console.log('Received empty message');
        return;
    }

    if (messageText.toLowerCase() === '/start') {
        bot.sendPhoto(
            chatId,
            'https://i.ibb.co/5Fss4dy/d069091c66ac.jpg',
            {
                caption: '🌼 Welcome to Instagram Photo Downloader \nSend me an Instagram username to download all their photos.\n🦋 Join the update channel:',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Join Update Channel',
                                url: 'https://t.me/NOOBPrivate',
                            },
                        ],
                    ],
                },
            }
        );
        return;
    }

    // Check if message is a username (should start with '@')
    if (messageText.startsWith('@')) {
        const username = messageText.slice(1); // Remove '@' from username
        try {
            console.log('Received Instagram username:', username);

            // Extract the user's posts' direct URLs using their username
            const directUrls = await instagramUrlDirect(`https://instagram.com/${username}`);
            console.log('Direct URLs:', directUrls);

            if (!directUrls || !directUrls.url_list || directUrls.url_list.length === 0) {
                throw new Error('No direct URLs found');
            }

            // Iterate through each URL and handle only images
            for (const url of directUrls.url_list) {
                if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
                    // Handle image download
                    const response = await axios({
                        url: url,
                        method: 'GET',
                        responseType: 'arraybuffer',
                    });

                    // Convert image to JPG if needed
                    const imageBuffer = await sharp(response.data)
                        .jpeg()
                        .toBuffer();

                    console.log('Image converted to JPG successfully:', url);

                    // Send the image file with a caption
                    await bot.sendPhoto(chatId, imageBuffer, {
                        caption: `Photo from @${username}:`,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Join Update Channel',
                                        url: 'https://t.me/NOOBPrivate',
                                    },
                                ],
                            ],
                        },
                    });

                    console.log('Image sent successfully:', url);
                }
            }

            // Notify user when done
            await bot.sendMessage(chatId, "All photos have been sent.");
        } catch (error) {
            console.error('Error processing media:', error);
            await bot.sendMessage(
                chatId,
                "We're currently experiencing technical issues. Please check the username and try again!"
            );
        }
        return;
    }

    // No response for other messages
});
