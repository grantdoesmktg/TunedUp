// NATIVE APP - Article Content Data
export interface Article {
  id: string;
  title: string;
  preview: string;
  content: string;
}

export const ARTICLES: Article[] = [
  {
    id: 'whats-coming',
    title: 'What\'s Coming - Roadmap',
    preview: 'Upcoming features we\'re building for you.',
    content: `We're just getting started. Here's what's coming to TunedUp in the next few months.

**Within 3 Months:**

• **Integrated Partnership Links** - Shop for parts directly related to your build plan recommendations, often for cheaper than list price

• **Forum Pages** - Dedicated discussion spaces for popular platforms where you can share knowledge and connect with other enthusiasts

• **Enhanced Image Generation** - More customization options to fine-tune your generated images exactly how you want them

• **Video Generation** - Create videos using your generated images as reference material to bring your builds to life

• **Direct Messaging** - Connect with other users to discuss builds, share tips, and plan meetups (not races 😉)

• **Advanced Profile Customization** - More robust options to personalize your profile and make it truly yours


**Within 3-6 Months:**

• **Tuner Area** - Dedicated section with dyno results and graphics showing realistic performance expectations added to the calculator

• **Event Organization** - Discover car meets, popular hotspots, and event times displayed on an intuitive map

• **Gamification & Rewards** - Earn rewards for app participation and engagement (Yes, usage will be backdated to your account creation date, so start being active now!)


These features aren't set in stone—they're based on what I think you'll find most valuable. If you have ideas or want to see something specific, reach out at support@tunedup.com.

This is just the beginning.

— The Dev`,
  },
  {
    id: 'why-i-built-this',
    title: 'Why I Built This - From Dev',
    preview: 'The journey from frustration to creation.',
    content: `Hey there! So, you're probably wondering why another car app exists in the world. Fair question.

Here's the honest truth: I built TunedUp because I was trying to do this exact thing with free AI tools and nothing really captured the feeling or functionality that I wanted.

The three tools—Performance Calculator, Build Planner, and Image Generator—weren't just random features I threw together. They represent what I think is the perfect flow: idea, plan, create, visualize. That's how I think about building cars, and honestly, how I think about building anything worth doing.

I wanted a tool that could leverage AI in a meaningful way. Not AI for AI's sake, but AI that actually helps you make better decisions about your build. Something that feels intuitive and gets out of your way while you work.

But here's the thing—this isn't perfect, and it never will be unless people like you tell me what's broken or what could be better.

If you think the tools could be changed or improved, please PLEASE send a message to support@tunedup.com. Seriously. Feedback isn't just encouraged, it's vital. I'm just one person trying to make something useful, and I can't improve what I don't know about.

So yeah, that's why this exists. I needed it, I built it, and I hope it helps you as much as it's helped me.

— The Dev`,
  },
  {
    id: 'pricing-explained',
    title: 'Let\'s Talk About Pricing - From Dev',
    preview: 'Why it costs what it costs, and why I think it\'s fair.',
    content: `Okay, let's be real for a second. Nobody likes talking about money, but transparency matters, so here we go.

TunedUp uses Gemini as its AI engine. Why Gemini? Because it's a top-tier LLM that gives you accurate results. And when you're making decisions about performance gains or planning a $10,000 build, accuracy isn't negotiable. You need a model that actually knows what it's talking about, not one that confidently tells you to install a turbo on a naturally aspirated engine that can't handle it.

But here's the catch: Gemini isn't cheap. Neither is running a database, marketing this thing so people actually know it exists, or the endless hours of development to make sure it all works smoothly.

After you factor in customer acquisition costs, development, database storage, and AI token usage, the profit margin on this project sits around 10-15%. That's it. I'm not getting rich off this—I'm trying to build the best tool I can with the resources available.

Could I use a cheaper model? Sure. Would it suck? Absolutely. And I'd rather charge fairly for something that works than offer something cheap that wastes your time.

That said, I'm open to feedback. If you'd rather have more performance calculations and fewer AI images, or any other combination of features, email me at support@tunedup.com. I'm serious. This pricing isn't set in stone—it's based on what I think is fair right now, with the current models and costs.

At the end of the day, I'm just trying to make this sustainable so I can keep improving it for you.

— The Dev`,
  },
];
