// Dirt Bot (discord.js v14)

const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const jokes = require('./jokes');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // must also be enabled in the Developer Portal
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin')
    .addStringOption((o) =>
      o
        .setName('call')
        .setDescription('Call it before the flip (optional)')
        .addChoices({ name: 'Heads', value: 'Heads' }, { name: 'Tails', value: 'Tails' })
    ),
  new SlashCommandBuilder()
    .setName('jokeoftheday')
    .setDescription('Get today\'s joke (the same for everyone, changes daily)'),
].map((c) => c.toJSON());

const handlers = {
  async coinflip(i) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const call = i.options.getString('call');
    let msg = `🪙 The coin landed on **${result}**!`;
    if (call) msg += call === result ? ' You called it! 🎉' : ' Better luck next time.';
    await i.reply(msg);
  },

  async jokeoftheday(i) {
    // Same joke all day (UTC), cycles through all 150 jokes
    const day = Math.floor(Date.now() / 86400000);
    const [setup, punchline] = jokes[day % jokes.length];
    const embed = new EmbedBuilder()
      .setTitle('😄 Joke of the Day')
      .setDescription(`${setup}\n\n||${punchline}||`)
      .setFooter({ text: 'Click the black bar to reveal the punchline' })
      .setColor(0xf1c40f);
    await i.reply({ embeds: [embed] });
  },
};

client.once('ready', async () => {
  await client.application.commands.set(commands);
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    await handlers[interaction.commandName]?.(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: 'Something went wrong.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

// Say "bark" whenever someone types just "yes" (any capitalization)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.trim().toLowerCase() === 'yes') {
    try {
      await message.channel.send('bark');
    } catch (err) {
      console.error(err);
    }
  }
});

// Tiny web server so free "web service" hosts (like Render) have something to ping
const http = require('http');
http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end('Dirt Bot is running');
  })
  .listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_TOKEN);
