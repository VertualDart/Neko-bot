module.exports = {
    name: 'ping',
    description: 'Ping command to test bot responsiveness',
    async execute(message) {
      try {
        const sent = await message.reply({ content: 'Pinging...' });
        const latency = sent.createdTimestamp - message.createdTimestamp;
        await sent.edit({
          content: `🏓 Pong!\nBot Latency: ${latency}ms\nAPI Latency: ${Math.round(message.client.ws.ping)}ms`,
        });
      } catch (error) {
        console.error('Error executing ping command:', error);
        await message.reply('Something went wrong while executing the ping command.');
      }
    },
  };
  
