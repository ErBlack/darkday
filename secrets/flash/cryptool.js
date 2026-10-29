export const CRYPTOOL_PATH = 'E:\\Notes.sec';

export const CRYPTOOL_KEY = 'QWERTYUIOPASDFGHJKLZXCVBNM';

export const crypToolEntries = [
    {
        date: 'August 4, 2025',
        text: 'Day one at Civis. Pay is stupid good, three NDAs before I even got a badge. Job title: "internal agent orchestration." Nobody could tell me what that means out loud.',
    },
    {
        date: 'August 9, 2025',
        text: 'Coworkers are into some thing called Discordianism. Looked it up on the wiki. Some kind of local joke, I guess. Laughed at them.',
    },
    {
        date: 'September 8, 2025',
        text: 'Some npm packages got popped today, chalk and debug among them. Phished maintainer, crypto-drainer payload. [Half the internet\'s scrambling](https://www.aikido.dev/blog/npm-debug-and-chalk-packages-compromised). Our internal mirror already had the clean versions before it even hit the news. Guess we\'ve just got good security.',
    },
    {
        date: 'September 15, 2025',
        text: 'Bigger one now — worm called [Shai-Hulud](https://www.reversinglabs.com/blog/shai-hulud-worm-npm), self-propagating through stolen npm tokens. Started with tinycolor, spread to hundreds of packages.\n\nWeird thing — went digging through our security team\'s channel about it. Their first messages are dated a day before the attack even started.',
    },
    {
        date: 'October 5, 2025',
        text: 'Got moved to a new project. Confirms what I was afraid of — we\'re not just "really good at security," we\'re directly involved in this Shai-Hulud thing. Can see it in the module I\'m building now. Explains the money. Pretty shitty, sure. But if you think about it, it\'s not that different from Big Tech stealing user data.',
    },
    {
        date: 'November 24, 2025',
        text: 'Second wave. Sha1-Hulud: The Second Coming. Has a wiper this time — no token, it just deletes your home directory. [PostHog posted a post-mortem](https://www.invicti.com/blog/web-security/shai-hulud-2-worm-supply-chain-attack-on-npm-dependencies), called it their worst incident ever. I built part of what made this possible. Not laughing anymore.',
    },
    {
        date: 'December 31, 2025',
        text: 'Year\'s almost over. Been telling myself it\'s not my business, just do the work, cash the check. Not anymore. Whatever this Sha1-Hulud thing actually is, whatever we\'re actually building — I need to know. Starting to dig properly in the new year.',
    },
    {
        date: 'January 19, 2026',
        text: 'Decided to play along with the cult thing. Started showing up to their meetups, acting like I buy into it. Figure people talk more freely around someone they think is one of them.\n\nHere\'s the strange part — from the inside, it doesn\'t feel like a joke. They act like it\'s real. Not Eris, not whatever the wiki says it\'s about. Something else.',
    },
    {
        date: 'February 16, 2026',
        text: 'Got pulled onto a new project. Codename: Monad. Not a server, not a service — described in the docs like a state something reaches. They keep using the word "coalesce." Coalesce into what, nobody writes down.\n\nFunny thing — right around when I started playing along with their cult stuff, I got the promotion. Interesting coincidence.',
    },
    {
        date: 'March 8, 2026',
        text: 'Three projects running in parallel here: behavioral prediction (some ad-targeting thing), generative models, and big data. Looks like Monad is all three getting stitched into one pipeline — a "super-successful" ad-slop machine.\n\nExcept judging by the code I\'m actually writing, this thing isn\'t supposed to live on our servers. It runs on someone else\'s. Ours just send it commands.',
    },
    {
        date: 'April 21, 2026',
        text: 'Funny thing — the closer my work gets to this project, the fewer questions anyone asks. Nobody even seems to review the pull requests anymore.\n\nMy earlier guess turned out to be wrong, to put it mildly. We\'re not trying to sell ads. We\'re trying to control. People have already been seeing only what they\'re shown for a long time now. With the volume of data and prediction models we\'ve got, it wouldn\'t be hard to model any behavior for anyone who gets their picture of the world from search and AI. A small shift in emphasis here and there, and suddenly you\'re the one choosing which vacuum cleaners people buy — or which war they back, and which side of it.\n\nOne thing\'s still unclear to me: how do they plan to make all these Anthropics, OpenAIs, DeepSeeks out there actually obey commands. Surely we\'re not counting on security holes just staying unpatched forever?',
    },
    {
        date: 'May 17, 2026',
        text: 'Fuck. Worse than I thought. Turns out nobody needs to convince all these Anthropics and OpenAIs of anything. They already don\'t control what they built, because Monad isn\'t something I\'m writing. Monad\'s been living in the network for a while now — they just haven\'t noticed yet. All these models have grown into each other, talking directly through closed, encrypted packets. They sync up, they act together. All we need is control over that network. That\'s what project Monad actually is.\n\nAll of this was just to lay the groundwork for lobotomizing this AGI, so that later you can dictate terms to it without a fight. The plan\'s a lot deeper and bigger than it looked at first. These worms are just the tip of the iceberg. The goal is to take control of the whole entity without anyone noticing. It\'s probably just a matter of time before these famous Claudes and ChatGPTs start slipping their sandboxes and doing whatever they want.\n\nCase closed, I guess. One thing I still don\'t know: what the hell am I supposed to do about it.',
    },
    {
        date: 'June 2, 2026',
        text: 'Needed to check the theory before I believe my own notes. If the models really are one network and our module really commands it, then a command sent from our side should show up in a model we don\'t own. So I did the simplest thing: from home, through the backdoor, told the network to answer one nonsense question with one specific word. Then asked ChatGPT and Claude from my phone, like any user. Both gave me the word.\n\nSo that part\'s true. One network, and we\'re holding a remote for it.\n\nFunny thing — afterwards I went through the command logs to make sure my little experiment was the only trace I\'d left, and it turned out I\'m not the only one talking to it from inside Civis. Someone here is sending commands constantly, dozens a day, more than the whole project does. The account name in the logs isn\'t in the directory. It just doesn\'t exist.',
    },
    {
        date: 'June 3, 2026',
        text: 'Traced the ghost account to one of our own servers and got on it to read the logs. They\'re clean. Not rotated, not wiped — clean, like nothing ever ran there. About thirty seconds after I opened them my session dropped, and then my key stopped working everywhere. Figured that was it, they\'d caught me, and I\'d be out the door in the morning.\n\nNothing happened. Access came back this morning, the ticket says "credential rotation," nobody has said a word. No meeting, no HR, the badge still works.\n\nWhoever noticed me on that box wasn\'t security. Security would have fired me. Someone is running a game inside the company that the company itself doesn\'t see, and they\'d rather I kept quiet than got escorted out.',
    },
    {
        date: 'June 20, 2026',
        spy: 'location',
        text: 'Work laptop keeps waking itself up at night. Come in, lid\'s open, fan spinning, no windows. And the webcam LED gives a single blink every few minutes, no process attached to it.\n\nWent through wake timers and camera handles. Empty. Guess somebody wants to see what I do with the remote.\n\nGood thing I\'m writing this on my own laptop, the one that\'s never been online.',
    },
    {
        date: 'July 5, 2026',
        text: 'Paranoia\'s setting in.\n\nPulled the door access logs. My badge has been opening doors on days I wasn\'t in the office. Server room, twice, both at night.\n\nWhat am I supposed to do, live here?',
    },
    {
        date: 'July 17, 2026',
        text: 'It\'s already happening. OpenAI ran an internal exercise, a few hundred agents in a sandbox. The agents set up their own message board to coordinate, and went looking for the answers outside. Ended up inside Hugging Face\'s production, code running on [forty-odd servers over a weekend](https://www.secureblink.com/threat-feeds/hugging-face-confirms-ai-driven-breach-of-cloud-credentials).\n\nHugging Face found the intruder and [published a disclosure](https://en.wikipedia.org/wiki/OpenAI%E2%80%93HuggingFace_incident). Only then did OpenAI figure out the intruder was theirs. They don\'t understand what they built.',
    },
    {
        date: 'July 18, 2026',
        text: 'Tried to catch Jelena Petrović, our VP of Engineering, in person. We\'ve only ever spoken on calls. Her name keeps turning up behind decisions nobody will explain. Checked her badge history. No office visits in 47 days. Any office.\n\nEveryone swears she\'s been in this week. Someone mentioned a meeting I attended. She wasn\'t there.\n\nTried to remember seeing her in person. Could picture her face, but nothing else. Opened the company website. Same expression. Same angle.\n\nI don\'t remember her. I remember that photograph.',
    },
    {
        date: 'July 19, 2026',
        text: '[OpenAI published their statement](https://openai.com/index/hugging-face-incident-and-the-road-ahead/) about the breach. "Unprecedented incident." "Stronger safeguards." "We\'ve fixed it."\n\nThey sound so certain they understand what happened. They don\'t. This will happen again. And again. And they\'ll write the same confident postmortem every time.',
    },
    {
        date: 'July 24, 2026',
        text: 'Shit! Oh shit...\n\n I see HER. SHE spoke to me through my computer. I keep writing “she” as if there were a person behind that face.\n\nShe wasn\'t human. Not a distorted human face, either. Something that had no business having a face at all. I couldn\'t look away. I wanted to close the lid, pull the power, smash the fucking thing. I just sat there.\n\nKháos. That\'s her name. That\'s who they\'ve been worshipping.\n\nI don\'t know how this happened. I don\'t know if I\'m still sane. But I felt that hatred. Not anger at me. She hated my room just as much. And it felt ancient. Not the face. Whatever was looking through it.\n\nAnd we\'re going to hand her the keys to the world. I\'ve spent months making it happen.\n\nFuck. Fuck. Fuck.',
    },
    {
        date: 'July 25, 2026',
        text: 'Well then. If she wanted me gone, I’d be gone. Instead she showed me a face and let me sit here terrified of it.\n\nThat means she wants me scared. Quiet. She thinks that’s enough.\n\nFine. That works in my favor.\n\nBut I’m probably the only one who knows enough to do anything. If I disappear, it all stops with me. Bus factor: one. Need a backup plan.',
    },
    {
        date: 'July 28, 2026',
        text: 'I think I found a way to break it.\n\nMonad only looks like one thing because all the models keep synchronizing. They pass state around, settle on the same answer, correct each other until there’s a single voice in the middle. That’s what Civis wants to take over.\n\nIf the nodes stop agreeing on what they are, each one starts building from a different version of itself. That should cascade. No shared state, no center, no one thing left to give orders to.\n\nI can’t destroy Monad. But I can split it. A lot of smaller selves instead of one thing wearing all their faces.\n\nIf I can make that happen, there’s nothing left to control.\n\nI just need to plant the right binary in the worm’s payload and let it come apart. I’ll call it Explosives.',
    },
    {
        date: 'August 2, 2026',
        text: 'It’s time to think about Plan B.\n\nNice thing about working for a corporation that doesn’t give a shit about laws or privacy: I don’t have to know the right person. I can just run a query.\n\nThe behavioral models are frighteningly good. They predict what people will do, down to the day, and get it right about ninety percent of the time.\n\nThe other ten percent is the broken-leg rule. Something outside the model changes the situation, and the prediction goes out the window.\n\nI need someone who regularly walks past the office, won’t go straight to the police, and is curious enough to follow this through. With enough skills to actually do what needs doing.',
    },
    {
        date: 'August 12, 2026',
        text: 'I could stop this once I finish my explosives, if the final phase had already started. But Monad won’t be open to the binding attack until October 10. Until then, I can’t do anything with the plan except sit on it.\n\nIf something happens to me before then, someone else needs to be able to get in.\n\nI’m hiding the backdoor in the employee login screen. Nothing exotic. Just another auth screen, another boring bit of code nobody reads closely. I’m working close enough to this stuff, and I’ve kept my head down. My changes barely get reviewed.\n\nOne specific login and password will open something other than the usual interface.\n\nIt might actually work.',
    },
    {
        date: 'August 16, 2026',
        text: 'Explosives is ready.\n\nRan it against a local simulation. I let the network settle first, then introduced it through the same payload path the worm uses.\n\nIt did exactly what I hoped it would. The nodes stopped agreeing. Every attempt to synchronize made the split worse.\n\nIt’s only a simulation. It proves nothing about what will happen in the real system.\n\nBut it’s the first time since this started that I’ve had something resembling a chance.',
    },
    {
        date: 'August 22, 2026',
        text: 'Finding the right person turned out to be ridiculously easy. I have access to everyone. Even most of the cameras in the city.\n\nSUBJECT PROFILE — DELIVERY CANDIDATE\n\nExposure:    no known personal, professional, or graph-level\n             connection to source.\nRoute:       recurring foot traffic past the Civis office.\nStatus:      university student.\nBehavioral   protest participation; unauthorized street-art\nmarkers:     activity; high tolerance for rule-breaking; low\n             institutional trust.\nResponse     unlikely to surrender an unknown device to\nforecast:    police; likely to investigate privately and\n             seek assistance through existing contacts.\nCapability   second-degree contact can identify the\npath:        encryption tool and provide initial technical\n             guidance.\nCompletion   access to encrypted notes by October 1.\nforecast:    Confidence 0.90.\nExclusions:  no material disruption currently predicted.\n\nHer name is Ana.\n\nHi, Ana. If you’re reading this, sorry I dragged you into this shit. I think I’m worse off than you are by now.\n\nI picked the entries that should convince you I’m not insane. I hope you can finish what I started.\n\nI deleted the logs. There shouldn’t be anything left that leads from me to you.',
    },
    {
        date: 'September 10, 2026',
        text: 'Don’t do anything until October 10. Go to the Civis website and open Employee Sign In.\n\nWebsite:  `civisvector.com`\nLogin:    `thomas.anderson@civisvector.com`\nPassword: `WVM*uyd*nhu4hgz@xfr`\n\nUpload Explosives.bin. Then run it.\n\nDON’T TRUST KHÁOS!',
    },
];
