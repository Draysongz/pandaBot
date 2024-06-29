const {Telegraf, Scenes, session, Markup} = require('telegraf')
const dotenv = require('dotenv').config();
const {connectDB} = require('./db/connect')
const {UserDetails} = require('./models/userModel')




connectDB()
const botToken = process.env.botToken || '';

const bot = new Telegraf(botToken);

const ReferralScene = new Scenes.BaseScene('ReferralScene');
const stage = new Scenes.Stage([ReferralScene]);
bot.use(session());
bot.use(stage.middleware());

bot.use(async (ctx, next) => {
    const userId = ctx.from.id;

    // Check if user details are already in the database
    const existingUser = await UserDetails.findOne({ userId });

    if (!existingUser) {
        // Save user details to the database
        const newUser = new UserDetails({
            userId,
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
        });

        await newUser.save();
    }

    // Continue to the next middleware
    next();
});


function handleReferralId(text) {
  if (!text) {
    console.log("No text provided.");
    return undefined;
  }
  const parts = text.split(" ");
  const parameter = parts.length > 1 ? parts[1] : undefined;
  console.log(`Received start command with parameter: ${parameter}`);

  // Perform actions based on the extracted parameter
  if (!parameter) return undefined;
  const [refId, uniqueId] = parameter.split("-");

  if (refId === "refId") {
    return { uniqueId };
  }
  return undefined;
}


bot.start(async (ctx) => {
  console.log("Received /start command with message:", ctx.message.text);
  
  const referralData = handleReferralId(ctx.message.text);
  if (referralData !== undefined) {
    const { uniqueId } = referralData;
    console.log(`Referral data found: , userId=${uniqueId}`);

    const referrer = await UserDetails.findOne({ userId: uniqueId });
    
    if (referrer && !referrer.downlines.some(downline => downline.username === ctx.from.username)) {
      // Add the referral to the downlines of the referring user and increment the referral count
      await UserDetails.findOneAndUpdate(
        { userId: uniqueId },
        { $inc: { referralCount: 1 }, $push: { downlines: ctx.from } },
        { new: true }
      );
    }

    await ctx.reply(
      `Received referral and userId: ${uniqueId}`,
      Markup.inlineKeyboard([
        Markup.button.webApp(
          "Launch",
          `https://mini-livid-zeta.vercel.app?userId=${ctx.from.id}&name=${ctx.from.username}&referralId=${uniqueId}`
        ),
      ])
    );
  } else {
    console.log("No referral data found.");
    await ctx.reply(
      "Welcome to the bot! No referral data found.", {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.webApp("Launch", `https://mini-livid-zeta.vercel.app?userId=${ctx.from.id}&name=${ctx.from.username}&referralId=${ctx.from.id}`)],
            [{ text: "Referral", callback_data: 'referral' }]
          ]
        }
      }
    );
  }
});



ReferralScene.enter(async (ctx) => {
  const userId = ctx.from.id;

  const existingUser = await UserDetails.findOne({ userId });
  if (existingUser && existingUser.referralLink !== "null") {
    const referralMessage = `
    🎉 Welcome back, ${ctx.from.username}!

    🌐 Your Referral Link: ${existingUser.referralLink}

    👥 Total Referrals: ${existingUser.referralCount || 0}

    Share your link with friends and earn rewards!

    Thank you for being a valued member of our community!
    `;

    await ctx.reply(referralMessage);
    ctx.scene.leave();
  } else {
    await ctx.reply("It seems you don't have a referral link yet. Please generate one to start referring your friends!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Generate Link', callback_data: 'generate_referral' }]
        ]
      }
    });
  }
});


bot.action('generate_referral', async(ctx)=>{
    uniqueId = ctx.from.id;

    const referralLink = `t.me/mini_pandabot?start=refId-${uniqueId}`

    await UserDetails.findOneAndUpdate(
    {userId :  uniqueId },
    { referralLink },
    { new: true, upsert: true }
  );



  await ctx.reply(`
  🎉 Your referral link has been generated!

  🌐 Your Referral Link: ${referralLink}

  Share your link with friends and earn rewards!

  Thank you for being a valued member of our community!
  `);

  ctx.scene.leave();
})


bot.action('referral', async (ctx) => {
  ctx.scene.enter('ReferralScene');
});



bot.launch()