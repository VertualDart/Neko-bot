const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UserInventory = require('../models/UserInventory.js');

const CARDS_PER_PAGE = 5;

module.exports = {
  name: 'inventory',
  description: 'View your card collection',
  execute: async function (message, args) {
    try {
      // Get target user (allows viewing other users' inventories)
      const targetUser = message.mentions.users.first() || message.author;

      // Fetch user's inventory
      const inventory = await UserInventory.findOne({ userId: targetUser.id })
        .populate('cards.cardId')
        .exec();

      if (!inventory || inventory.cards.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setAuthor({ name: `${targetUser.username}'s Collection`, iconURL: targetUser.displayAvatarURL() })
          .setDescription(
            targetUser.id === message.author.id
              ? "You don't have any cards yet! Use `!drop` to get started."
              : "This user doesn't have any cards yet."
          )
          .setFooter({ text: 'Start collecting cards by participating in drops!' });

        await message.reply({ embeds: [emptyEmbed] });
        return;
      }

      // Sort cards by rarity and obtainedAt
      inventory.cards.sort((a, b) => {
        const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
        const rarityDiff = rarityOrder.indexOf(a.cardId.rarity) - rarityOrder.indexOf(b.cardId.rarity);
        return rarityDiff === 0 ? b.obtainedAt - a.obtainedAt : rarityDiff;
      });

      // Calculate total pages
      const totalPages = Math.ceil(inventory.cards.length / CARDS_PER_PAGE);
      let currentPage = 1;

      // Function to generate inventory embed
      const generateInventoryEmbed = (page) => {
        const startIdx = (page - 1) * CARDS_PER_PAGE;
        const endIdx = startIdx + CARDS_PER_PAGE;
        const displayedCards = inventory.cards.slice(startIdx, endIdx);

        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setAuthor({ name: `${targetUser.username}'s Collection`, iconURL: targetUser.displayAvatarURL() })
          .setDescription(`Total Cards: ${inventory.cards.length}`)
          .setFooter({ text: `Page ${page}/${totalPages} • Use the buttons below to navigate` });

        // Add card fields
        displayedCards.forEach((card) => {
          const cardEmoji = {
            Legendary: '🌟',
            Epic: '💫',
            Rare: '✨',
            Uncommon: '⭐',
            Common: '⚪',
          }[card.cardId.rarity];

          embed.addFields({
            name: `${cardEmoji} ${card.cardId.name}${card.favorite ? ' ❤️' : ''}`,
            value: [
              `Version: v${card.version} • Serial: ${card.serialNumber}`,
              `Type: ${card.cardId.type} • Rarity: ${card.cardId.rarity}`,
              `⚔️ ${card.cardId.stats.attack} | 🛡️ ${card.cardId.stats.defense} | 💎 ${card.cardId.stats.cost}`,
              `Obtained: ${card.obtainedAt.toLocaleDateString()}`,
            ].join('\n'),
            inline: false,
          });
        });

        return embed;
      };

      // Create navigation buttons
      const getNavigationRow = (currentPage) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('first')
            .setLabel('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1),
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 1),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages),
          new ButtonBuilder()
            .setCustomId('last')
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages)
        );
      };

      // Send initial inventory message
      const inventoryMessage = await message.reply({
        embeds: [generateInventoryEmbed(currentPage)],
        components: totalPages > 1 ? [getNavigationRow(currentPage)] : [],
      });

      // Set up button collector for navigation
      if (totalPages > 1) {
        const collector = inventoryMessage.createMessageComponentCollector({
          filter: (i) => ['first', 'prev', 'next', 'last'].includes(i.customId) && i.user.id === message.author.id,
          time: 300000, // 5 minutes
        });

        collector.on('collect', async (interaction) => {
          switch (interaction.customId) {
            case 'first':
              currentPage = 1;
              break;
            case 'prev':
              currentPage = Math.max(1, currentPage - 1);
              break;
            case 'next':
              currentPage = Math.min(totalPages, currentPage + 1);
              break;
            case 'last':
              currentPage = totalPages;
              break;
          }

          await interaction.update({
            embeds: [generateInventoryEmbed(currentPage)],
            components: [getNavigationRow(currentPage)],
          });
        });

        collector.on('end', () => {
          inventoryMessage.edit({ components: [] });
        });
      }
    } catch (error) {
      console.error('Error in inventory command:', error);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Error')
            .setDescription('An error occurred while fetching your inventory. Please try again later.'),
        ],
      });
    }
  },
};
