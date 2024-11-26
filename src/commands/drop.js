// At the top of drop.js
const dbConnection = require('../config/database.js'); // Import the database connection

// File: src/commands/drop.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Card = require('../models/card');
const UserCard = require('../models/UserCard');
const ActiveDrop = require('../models/ActiveDrop');
const { addWatermark } = require('../utils/imageProcessor');
const { randomBytes } = require('crypto');

const CLAIM_EMOJI = '🎴';
const CLAIM_TIMEOUT = 60000; // 60 seconds cooldown
const RARITY_COLORS = {
  Common: 0x95a5a6,
  Uncommon: 0x2ecc71,
  Rare: 0x3498db,
  Epic: 0x9b59b6,
  Legendary: 0xf1c40f,
};

module.exports = {
  name: 'drop',
  description: 'Drop a random card for users to claim',
  cooldown: 300, // 5 minutes cooldown

  async execute(message) {
    try {
      // Check if the database is connected
      if (!dbConnection.isConnected()) {
        await message.reply({
          embeds: [
            {
              color: 0xff0000,
              title: '❌ Database Error',
              description: 'Database connection is not available. Please try again in a moment.',
            },
          ],
        });
        return;
      }

      // Check for active drops in the channel
      const activeDrop = await ActiveDrop.findOne({
        channelId: message.channel.id,
        claimed: false,
        expiresAt: { $gt: new Date() },
      });

      if (activeDrop) {
        const timeLeft = Math.ceil((activeDrop.expiresAt - new Date()) / 1000);
        await message.reply({
          embeds: [
            {
              color: 0xff0000,
              title: '⚠️ Active Drop in Progress',
              description: `There's already an active drop in this channel!\nTime remaining: ${timeLeft} seconds`,
            },
          ],
        });
        return;
      }

      // Get random card
      const cardCount = await Card.countDocuments();
      if (cardCount === 0) {
        await message.reply({
          embeds: [
            {
              color: 0xff0000,
              title: '❌ No Cards Available',
              description: 'There are no cards in the database yet!',
            },
          ],
        });
        return;
      }

      const randomCard = await Card.aggregate([{ $sample: { size: 1 } }]);
      const card = randomCard[0];

      // Generate version and serial number
      const existingVersions = await UserCard.find({ cardId: card._id })
        .sort({ version: -1 })
        .limit(1);

      const currentVersion = existingVersions.length > 0 ? existingVersions[0].version : 0;
      const newVersion = currentVersion + 1;

      // Generate unique serial number
      const serialNumber = `${card.name.substring(0, 3).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;

      // Process image with watermark
      const processedImage = await addWatermark(card.imageUrl, newVersion, serialNumber);

      // Create embed
      const dropEmbed = new EmbedBuilder()
        .setColor(RARITY_COLORS[card.rarity])
        .setTitle(`🎴 ${card.name} (v${newVersion})`)
        .setDescription(card.description)
        .addFields(
          { name: 'Type', value: card.type, inline: true },
          { name: 'Rarity', value: card.rarity, inline: true },
          { name: 'Serial', value: serialNumber, inline: true },
          { name: 'Stats', value: `⚔️ ${card.stats.attack} | 🛡️ ${card.stats.defense} | 💎 ${card.stats.cost}` }
        )
        .setImage('attachment://card.png')
        .setFooter({ text: `Click the button below to claim! • Expires in ${CLAIM_TIMEOUT / 1000} seconds` })
        .setTimestamp();

      // Create claim button
      const claimButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('claim_card')
          .setLabel('🎴 Claim Card')
          .setStyle(ButtonStyle.Primary)
      );

      // Send drop message
      const dropMessage = await message.channel.send({
        embeds: [dropEmbed],
        components: [claimButton],
        files: [
          {
            attachment: processedImage,
            name: 'card.png',
          },
        ],
      });

      // Create active drop record
      const newDrop = new ActiveDrop({
        cardId: card._id,
        messageId: dropMessage.id,
        channelId: message.channel.id,
        version: newVersion,
        expiresAt: new Date(Date.now() + CLAIM_TIMEOUT),
      });
      await newDrop.save();

      // Set up collector for claim button
      const collector = dropMessage.createMessageComponentCollector({
        filter: (i) => i.customId === 'claim_card',
        time: CLAIM_TIMEOUT,
      });

      collector.on('collect', async (interaction) => {
        try {
          // Claiming logic (omitted for brevity)
        } catch (error) {
          console.error('Error claiming card:', error);
          await interaction.reply({
            content: 'There was an error claiming the card. Please try again.',
            ephemeral: true,
          });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          const drop = await ActiveDrop.findOne({
            messageId: dropMessage.id,
            claimed: false,
          });

          if (drop) {
            const expiredEmbed = EmbedBuilder.from(dropEmbed)
              .setTitle(`🎴 ${card.name} (v${newVersion}) - EXPIRED`)
              .setFooter({ text: 'This drop has expired' });

            await dropMessage.edit({
              embeds: [expiredEmbed],
              components: [],
            });

            await drop.deleteOne();
          }
        }
      });
    } catch (error) {
      console.error('Error in drop command:', error);
      await message.reply({
        embeds: [
          {
            color: 0xff0000,
            title: '❌ Error',
            description: 'An error occurred while dropping the card. Please try again later.',
          },
        ],
      });
    }
  },
};
