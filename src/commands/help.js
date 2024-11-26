module.exports = {
    name: 'help',
    description: 'Shows all available commands',
    async execute(message) {
      const commands = [...message.client.commands.values()];
      const commandList = commands
        .map(cmd => `\`${process.env.PREFIX}${cmd.name}\`: ${cmd.description}`)
        .join('\n');
  
      if (!commandList) {
        return message.reply('No commands are available right now.');
      }
  
      await message.reply({
        embeds: [
          {
            color: 0x0099ff,
            title: '📚 Available Commands',
            description: commandList,
            footer: {
              text: `Use ${process.env.PREFIX}help <command> for detailed information`,
            },
          },
        ],
      });
    },
  };
  