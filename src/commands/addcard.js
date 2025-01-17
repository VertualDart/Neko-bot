const Card = require('../models/card');
const mongoose = require('mongoose');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'addcard',
  description: 'Add a new card to the database',
  usage: '!addcard <name> | <type> | <rarity> | <imageUrl> | <description> | <cost> | [attack] | [defense]',
  example: '!addcard Dragon Warrior | Character | Rare | https://example.com/image.png | A mighty dragon warrior | 5 | 7 | 4',
  async execute(message, args) {
    try {
      const params = args.join(' ').split('|').map(param => param.trim());
      
      if (params.length < 6) {
        return message.reply('Missing required parameters! Usage: ' + this.usage);
      }

      const [name, type, rarity, imageUrl, description, cost, attack = '0', defense = '0'] = params;

      // Validate type
      const validTypes = ['Character', 'Spell', 'Item', 'Environment'];
      if (!validTypes.includes(type)) {
        return message.reply(`Invalid card type! Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate rarity
      const validRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
      if (!validRarities.includes(rarity)) {
        return message.reply(`Invalid rarity! Must be one of: ${validRarities.join(', ')}`);
      }

      // Validate URL
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/;
      if (!urlRegex.test(imageUrl)) {
        return message.reply('Please provide a valid image URL!');
      }

      // Validate numbers
      const costNum = parseInt(cost);
      const attackNum = parseInt(attack);
      const defenseNum = parseInt(defense);

      if (isNaN(costNum) || costNum < 0) {
        return message.reply('Cost must be a positive number!');
      }

      if (isNaN(attackNum) || attackNum < 0 || isNaN(defenseNum) || defenseNum < 0) {
        return message.reply('Attack and defense must be positive numbers!');
      }

      // Check database connection
      if (mongoose.connection.readyState !== 1) {
        return message.reply('Database is not connected. Please try again later.');
      }

      // Create card data
      const cardData = {
        name,
        type,
        rarity,
        imageUrl,
        description,
        stats: {
          attack: attackNum,
          defense: defenseNum,
          cost: costNum
        },
        createdBy: message.author.id
      };

      // Add loading reaction
      await message.react('⏳');

      // Save card with timeout handling
      const card = new Card(cardData);
      await Promise.race([
        card.save(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timed out')), 5000)
        )
      ]);

      // Create embed response
      const embed = new EmbedBuilder()
        .setColor(getRarityColor(rarity))
        .setTitle(`Card Added: ${card.name}`)
        .setThumbnail(card.imageUrl)
        .addFields(
          { name: 'Type', value: card.type, inline: true },
          { name: 'Rarity', value: card.rarity, inline: true },
          { name: 'Cost', value: card.stats.cost.toString(), inline: true },
          { name: 'Attack', value: card.stats.attack.toString(), inline: true },
          { name: 'Defense', value: card.stats.defense.toString(), inline: true },
          { name: 'Description', value: card.description }
        )
        .setTimestamp()
        .setFooter({ text: `Created by ${message.author.tag}` });

      // Remove loading reaction and send success message
      await message.reactions.removeAll();
      await message.react('✅');
      await message.reply({ embeds: [embed] });

    } catch (error) {
      // Remove loading reaction if exists
      await message.reactions.removeAll();
      await message.react('❌');

      if (error.code === 11000) {
        return message.reply('A card with this name already exists!');
      }

      console.error('Error in addcard command:', error);
      message.reply('An error occurred while adding the card. Please try again.');
    }
  }
};

//get color based on rarity
function getRarityColor(rarity) {
  const colors = {
    Common: 0x808080,
    Uncommon: 0x00FF00,
    Rare: 0x0000FF,
    Epic: 0x800080,
    Legendary: 0xFFD700
  };
  return colors[rarity] || 0x808080;
}
