import type { CoursePageDefinition } from "@/lib/course-content-shared";

export type { CourseContentSection, CoursePageDefinition } from "@/lib/course-content-shared";

export const courseNavigation = [
  { title: "Introduction", path: "/x-ads" },
  { title: "Core principles", path: "/x-ads/principles" },
  { title: "Set up your X Ads account", path: "/x-ads/account" },
  { title: "Set up your analytics", path: "/x-ads/analytics" },
  { title: "Tracking pixel setup", path: "/x-ads/tracking" },
  { title: "Launch your first campaign", path: "/x-ads/launch" },
  { title: "Improve your campaign", path: "/x-ads/improve" },
  { title: "Beyond X Ads", path: "/x-ads/beyond" }
] as const;

export const coursePages: readonly CoursePageDefinition[] = [
  {
    path: "/x-ads",
    title: "Get your first customers from X Ads",
    description:
      "Go from complete beginner to getting impressions, clicks, and conversions for your product in less than 1 hour.",
    content: []
  },
  {
    path: "/x-ads/principles",
    title: "Core principles",
    description: "Before you spend any money on ads, these are the five things I want you to understand.",
    outcome: "You will know the five principles to follow before you plan, track, or launch an X Ads campaign.",
    content: [
      {
        heading: "Ad platforms are basically AI marketing engines",
        paragraphs: [
          "Think of X Ads as an AI marketing engine. You tell it what you want, then give it the data it needs to find more of it. In our case, that's customers.",
          "The platform needs to know what a useful result looks like. Who signed up? Who paid? Those actions give it something to learn from. Choosing the right goal and sending back useful data is a big part of making this work."
        ]
      },
      {
        heading: "Pixel tracking is non-negotiable",
        paragraphs: [
          "The pixel is the tracking code that sends actions from your product back to X. When someone signs up or buys, it sends an event. That event tells the platform what happened after someone clicked your ad.",
          "If you aren't tracking the important steps in your customer journey, you're burning your money. You can't properly see what's working, and you're not giving the AI marketing engine the feedback it needs to learn who your customers are.",
          "Set up your events. Check that they actually fire. Do this before you spend money on ads. The Tracking pixel setup chapter shows the full process."
        ]
      },
      {
        heading: "Ads should not look like ads",
        paragraphs: [
          "You don't need an overproduced ad with a dramatic intro and a logo flying across the screen. People are used to skipping that stuff. You don't want to spend your budget finding out how quickly they can scroll past yours.",
          "Make something that feels at home on X. A straightforward post. A screen recording. A real example of your product doing something useful. Keep it natural and give people a reason to stop."
        ]
      },
      {
        heading: "Show, don't just tell",
        paragraphs: [
          "You built the product, right? It has features your customers want, right? Show them.",
          "Record yourself using it. Show the problem, what your product does, and the result. If it saves someone ten steps, let them see that happen.",
          "Tell people why it matters, but don't make them imagine the whole thing. Put the product in front of them and show them what it can do."
        ]
      },
      {
        heading: "The campaign is your new feed",
        paragraphs: [
          "You're already paying for their attention. Treat the tweets within your campaign as the actual feed your potential customers will read. Write like you're posting to your own organic feed. Show what you're building, share what it can do, and answer the questions your customers have. Every tweet is another chance to help them understand your product."
        ]
      }
    ]
  },
  {
    path: "/x-ads/account",
    title: "Set up your X Ads account",
    description: "Get your blue checkmark, open Ads Manager, and add your payment method. Follow these steps in order.",
    outcome: "You will have an ad-ready X profile, access to Ads Manager, and an active payment method.",
    content: [
      {
        heading: "1. Get your account ready",
        paragraphs: [
          "Use the X account you want people to see on your ads. If you're advertising from your own profile, this guide follows the blue-checkmark route through X Premium. Business accounts should check X's organization requirements."
        ],
        steps: [
          "Log in to that account on X. Check the handle before you go any further.",
          "Add your display name, profile photo, header image, and a bio that explains what you do. Use static images, not GIFs.",
          "Add your product's live website to your profile. It should open without requiring a login.",
          "Make your posts public. Check that your account is active and your phone number is confirmed."
        ],
        links: [
          { label: "Open X", href: "https://x.com" },
          { label: "Check X Ads eligibility and supported countries", href: "https://business.x.com/en/help/ads-policies/campaign-considerations/about-eligibility-for-x-ads" }
        ]
      },
      {
        heading: "2. Subscribe to Premium and wait for the checkmark",
        paragraphs: ["Get this out of the way first. Paying for Premium does not make the blue checkmark appear immediately."],
        steps: [
          "On the X website, select Premium in the side navigation.",
          "Choose Premium or Premium+. Basic does not include the blue checkmark. You don't need Premium+ just to get the checkmark.",
          "Confirm your phone number if asked. Check the current price and billing period, then complete the subscription.",
          "Wait for X to review your account. Continue when the blue checkmark appears on your profile."
        ],
        note: "Your account must have been active within the past 30 days. Recent changes to your name, photo, or handle can delay eligibility or trigger another review. Finish those edits before subscribing. X does not promise an instant approval.",
        links: [
          { label: "Premium plans and signup instructions", href: "https://help.x.com/en/using-x/x-premium" },
          { label: "Blue checkmark requirements", href: "https://help.x.com/en/managing-your-account/about-x-bluecheck" }
        ]
      },
      {
        heading: "3. Create your ads account",
        paragraphs: ["Now open Ads Manager with the same X account. This is where you'll build and manage your campaigns."],
        steps: [
          "Open ads.x.com and confirm you're signed in with the correct handle.",
          "Select your country and time zone. Check the billing currency associated with your country before confirming.",
          "Complete the account setup prompts. If X takes you straight into campaign creation, leave the campaign unpublished for now."
        ],
        note: "Double-check the country, currency, and time zone. X says these cannot be changed after account creation. Correcting them requires asking support for a new ads account.",
        links: [
          { label: "Open Ads Manager", href: "https://ads.x.com" },
          { label: "X's account creation guide", href: "https://business.x.com/en/help/account-setup/ads-account-creation" }
        ]
      },
      {
        heading: "4. Add your payment method",
        paragraphs: ["Your Premium subscription and your ad spend are separate. Add a payment method inside Ads Manager too."],
        steps: [
          "Open Billing in Ads Manager. Look in the left navigation or the account menu at the bottom left.",
          "Select Add card. Enter your card details, billing address, and email.",
          "Select Add payment method and wait for the card check to finish.",
          "Confirm the card appears as Active. If you have multiple cards, use the star to choose the default."
        ],
        note: "X may place a temporary $5 hold, or the local equivalent, to check the card. Its billing guide says the hold is removed within seven days.",
        image: {
          src: "https://business.x.com/content/dam/business-twitter/help-center/conversion/default-billing-ui.png.twimg.1920.png",
          alt: "X Ads payment methods example showing Add card and the star used to set a default card.",
          width: 1312,
          height: 1300,
          caption: "X's billing example: add a card, then use the star to make it the default. Your layout may differ.",
          source: "https://business.x.com/en/help/account-setup/billing-basics"
        },
        links: [{ label: "X's billing instructions", href: "https://business.x.com/en/help/account-setup/billing-basics" }]
      },
      {
        heading: "5. Check you're ready for the next step",
        paragraphs: ["You should now have the account side sorted. Check these before moving on."],
        items: [
          "Your blue checkmark is visible and your profile is public.",
          "Ads Manager opens under the correct handle.",
          "Your billing country, currency, and time zone are correct.",
          "Your payment method is active and there are no unresolved account restrictions."
        ],
        note: "Account setup is done. Before spending on a campaign, we still need to install and verify your pixel events and analytics. Don't launch without tracking.",
        links: [
          { label: "Next: Set up your analytics →", href: "/x-ads/analytics" },
          { label: "Account blocked or under review? Contact X Ads support", href: "https://ads.x.com/help" }
        ]
      }
    ]
  },
  {
    path: "/x-ads/analytics",
    title: "Set up your analytics",
    description: "Know where your visitors came from, watch what they do, and make sure you can measure the results before you spend on ads.",
    outcome: "You will be able to trace an ad click through your site and measure the actions that follow.",
    content: [
      {
        heading: "1. Set up session replays",
        paragraphs: [
          "You're paying to get people onto your site. You should know what happens when they get there. Session replays let you watch a recording of someone's visit: where they scroll, what they click, and where they stop.",
          {
            content: [
              "Start with ",
              { label: "PostHog", href: "https://posthog.com/", external: true },
              " or ",
              { label: "Microsoft Clarity", href: "https://clarity.microsoft.com/", external: true },
              ". You don't need both for this lesson. If one is already installed, use it."
            ]
          }
        ],
        steps: [
          "For PostHog: create a project, open the Session Replay installation guide below, and follow the instructions for your framework. If PostHog is already installed, check your recording settings instead of installing it again.",
          "For Clarity: create a project for your website. Open Settings → Setup, choose your installation method, and add the project's tracking code through your framework, site builder, or tag manager.",
          "Publish the change to the website your ads will send people to.",
          "Check the recording privacy settings. Mask private text and inputs, and connect recording to your site's consent choices where required.",
          "Visit the site yourself, scroll, and click a few things. Open Session Replay in PostHog or Recordings in Clarity and confirm your visit appears. Allow time for processing."
        ],
        note: "Use test information when checking recordings. Confirm private content stays hidden. If no replay appears, check the project, installation, consent state, and recording rules before continuing.",
        links: [
          { label: "Install PostHog Session Replay", href: "https://posthog.com/docs/session-replay/installation" },
          { label: "Install Microsoft Clarity", href: "https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup" },
          { label: "PostHog recording privacy settings", href: "https://posthog.com/docs/session-replay/privacy" }
        ]
      },
      {
        heading: "2. Follow one test visit from click to replay",
        paragraphs: ["Don't assume the setup works because the code is installed. Test the same path a customer will take."],
        steps: [
          "Open your landing page in a fresh browser session and note the time.",
          "Follow your normal consent flow and confirm the page loads correctly.",
          "Scroll the page, click your main button, and complete a test signup if available. Note the time and landing URL.",
          "In PostHog, find your landing page-view event using the visit time and URL, then open the associated replay. In Clarity, find the recording using the visit time and entry URL, then inspect its details.",
          "Play the recording. Confirm that your page, clicks, and navigation are visible, while private information is masked."
        ],
        note: "A replay shows behavior, not someone's thoughts. Use it to find questions to investigate. Your website analytics also does not replace the X pixel: X conversion events still need their own setup and verification.",
        links: [{ label: "Find and filter PostHog replays", href: "https://posthog.com/docs/session-replay/surfaces/web-app" }]
      },
      {
        heading: "3. Set up your X Ads metrics view",
        paragraphs: ["Get the numbers you care about into one view so you're not hunting through menus later."],
        steps: [
          "Open Ads Manager and select Customize metrics.",
          "Include spend and impressions. Impressions count how many times the ads were shown.",
          "Include link clicks and the relevant click-through rate (CTR). Check the metric description: link clicks and all engagements are different measures.",
          "Include CPM, the cost per 1,000 impressions, and the cost-per-click metric relevant to your goal.",
          "Add the website conversion metrics for your chosen event, such as signup or purchase, and the corresponding cost per result where available. These need working event tracking.",
          "Save the selection as a custom metric set, such as Campaign review. Use the same date range when comparing campaigns."
        ],
        note: "An empty report before launch is normal. This step prepares the view. We'll cover how to interpret the numbers in Improve your campaign.",
        links: [
          { label: "Open Ads Manager", href: "https://ads.x.com" },
          { label: "X's custom metrics instructions", href: "https://business.x.com/en/help/campaign-setup/x-ads-manager" }
        ]
      },
      {
        heading: "4. Set up Google Search Console",
        paragraphs: ["Some people will see your ad and search for your product later. Set up Search Console so you can watch searches for your brand too."],
        steps: [
          "Open Google Search Console and add your website as a property. A property is the website you want to measure.",
          "Choose Domain if you can edit your domain's DNS records. Follow Google's instructions to add the verification record, then select Verify. Otherwise, use a URL-prefix property and one of its supported verification methods.",
          "Once search data is available, open Performance → Search results.",
          "Add a query filter using Queries containing and enter your brand name. Check spelling variations separately if needed.",
          "Record the date range, impressions, and clicks before launching. Compare an equivalent period later using the same filter."
        ],
        note: "New properties may need a few days to show data, and some queries are omitted. More brand searches do not prove the ads caused them. This is supporting context we'll return to in Beyond X Ads.",
        links: [
          { label: "Open Google Search Console", href: "https://search.google.com/search-console" },
          { label: "Add and verify your website", href: "https://support.google.com/webmasters/answer/34592?hl=en" },
          { label: "Filter and compare search queries", href: "https://support.google.com/webmasters/answer/17011165?hl=en" }
        ]
      },
      {
        heading: "Before you move on",
        paragraphs: ["You should now be able to find a visit in your analytics and watch what happened on your site."],
        items: [
          "Your chosen analytics tool receives visits from the live website.",
          "You found and watched your test session, with private information hidden.",
          "Your X Ads metrics view is saved.",
          "Search Console is verified, with starting brand-search data recorded or still pending."
        ],
        note: "Your website analytics is ready. Next, connect the customer actions on your website to X. Do not launch until your primary conversion event is active.",
        links: [{ label: "Next: Tracking pixel setup →", href: "/x-ads/tracking" }]
      }
    ]
  },
  {
    path: "/x-ads/tracking",
    title: "Tracking pixel setup",
    description: "Install the X Pixel, create the conversion events that match your customer journey, and verify the data before you launch.",
    outcome: "You will have verified pixel events for the customer actions you want X Ads to optimize.",
    content: [
      {
        heading: "1. Understand what the X Pixel sends",
        paragraphs: [
          "The X Pixel is tracking code for your website. The base code records visits. Event code records important actions, such as a completed signup or purchase.",
          "These events connect an ad click or view to a result on your website. X uses this data for conversion reporting, campaign optimization, and audience creation. Your session-replay tool does not replace this connection."
        ],
        steps: [
          "Write the main steps in your customer journey, from the landing page to the paid result.",
          "Choose one primary conversion that represents the result you want from the campaign.",
          "Choose any earlier event that can help when the primary conversion does not have enough volume.",
          "Confirm that your privacy notice and consent controls cover the tracking data that you plan to send."
        ],
        note: "Start with useful events, not every possible click. A small event set is easier to test and gives X a clear signal."
      },
      {
        heading: "2. Choose an installation method",
        paragraphs: [
          "Open Events Manager in X Ads. Select Add data source, then Install Pixel. X offers browser tracking with the Web Pixel and server tracking with the Conversion API."
        ],
        steps: [
          "Choose Web Pixel for the simplest first setup. It sends events from the visitor's browser.",
          "Choose Web Pixel + Conversion API when you can send the same events from your server. This combination can improve event coverage.",
          "Choose Conversion API only when your implementation must send events from a server without browser code.",
          "Use a partner or tag manager when your website already uses a supported integration. Otherwise, use the manual setup."
        ],
        note: "This lesson starts with the Web Pixel. The Conversion API needs server work and event deduplication. Add it after the browser setup works.",
        image: {
          src: "/images/tracking-methods.png",
          alt: "X Events Manager installation choices for Web Pixel with Conversion API, Web Pixel, and Conversion API.",
          width: 720,
          height: 444,
          caption: "Choose the tracking method that matches your website setup. Web Pixel is the simplest starting point.",
          source: "https://ads.x.com",
          wide: true
        },
        links: [
          { label: "Open X Ads Manager", href: "https://ads.x.com" },
          { label: "X conversion tracking guide", href: "https://business.x.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites" }
        ]
      },
      {
        heading: "3. Install the base pixel on every page",
        paragraphs: [
          "The base pixel identifies your website and sends page activity to X. Install it once in the shared part of your website so it loads on every page."
        ],
        steps: [
          "In the Web Pixel setup, choose Manual setup and copy the base code.",
          "Add the code before the closing </head> tag in your global website layout. You can also add it through your tag manager.",
          "Make sure the base code loads only once on each page and follows the visitor's consent choice.",
          "Publish the website change. X automatically creates Site visits and Landing page views events after it receives base-pixel activity."
        ],
        note: "Keep your real pixel identifier private when you share code or screenshots. The example below uses YOUR_PIXEL_ID.",
        image: {
          src: "/images/tracking-base-code.png",
          alt: "X Events Manager manual Web Pixel setup with a redacted example base code and Pixel Helper prompt.",
          width: 720,
          height: 694,
          caption: "Copy the base code from your own account. Install it in the global head of your website.",
          source: "https://ads.x.com",
          wide: true
        }
      },
      {
        heading: "4. Choose the events that match your customer journey",
        paragraphs: [
          "Use the event type that best describes the completed action. X supports Page view, Add to cart, Lead, Added payment info, Purchase, and Custom events."
        ],
        items: [
          "Page view: a useful page load, such as a pricing page or another high-intent page.",
          "Lead: a completed signup, demo request, or qualified lead form.",
          "Add to cart: a product was added to a cart or a checkout process started.",
          "Added payment info: valid payment information was saved successfully.",
          "Purchase: a paid order or subscription was confirmed successfully.",
          "Custom: an important action that does not fit the standard event types."
        ],
        note: "Do not fire Purchase when a person only selects a buy button. Fire it after the payment succeeds. Use one Purchase event when possible so you do not divide the optimization signal between several events."
      },
      {
        heading: "5. Create a conversion event",
        paragraphs: [
          "Create each event in Events Manager before you add its event code to the website. Use a name that describes the completed action."
        ],
        steps: [
          "Select Add event and enter a clear name, such as Purchase completed.",
          "Select the event type that matches the action.",
          "Choose Define with code for button actions, form results, parameters, or Conversion API events.",
          "Use URL rules only for a simple page-load event. URL rules do not support event parameters or the Conversion API.",
          "Keep the default 30-day post-engagement window and 1-day post-view window for your first setup unless your buying cycle needs a different period.",
          "Create the event and copy its installation code."
        ],
        note: "An attribution window is the period in which X can connect an ad interaction to a conversion. Keep the default settings until you have a clear reason to change them.",
        image: {
          src: "/images/tracking-create-event.gif",
          alt: "Short animation of the X Events Manager form, event-type list, and URL-rule option.",
          width: 616,
          height: 628,
          caption: "Name the event, select its type, then choose code or a URL rule. Code gives you the most control.",
          source: "https://ads.x.com",
          wide: true
        }
      },
      {
        heading: "6. Install the event at the success point",
        paragraphs: [
          "The event must run only after the action succeeds. Put the event code in the success logic for that action, not on the button that starts it."
        ],
        steps: [
          "Send Lead after the account, form, or qualified request is created successfully.",
          "Send Added payment info after the payment method is saved successfully.",
          "Send Purchase after your payment system confirms the paid order or subscription.",
          "For Purchase, send the value and currency when they are available.",
          "Send a unique conversion_id when both the Web Pixel and Conversion API report the same action. X uses it to remove the duplicate event.",
          "Publish the change after you check that the event name and parameters match the event in Events Manager."
        ],
        note: "Do not send passwords, access tokens, or sensitive form text. Send customer information only when X permits it, your consent flow permits it, and the required values are hashed."
      },
      {
        heading: "7. Test every event before launch",
        paragraphs: [
          "A created event is not a verified event. Test the live website and confirm that X receives the correct action."
        ],
        steps: [
          "Install the X Pixel Helper browser extension and open your live website in a fresh browser session.",
          "Confirm the helper detects one base pixel and does not show an implementation warning.",
          "Complete one test conversion. Use test payment information when you test a Purchase event.",
          "In Events Manager, open the event and select View recent activity. Check the website host and the parameters that X received.",
          "Repeat the action and reload the success page. Confirm that one completed action does not create several conversions.",
          "Check that redirects keep the twclid parameter in the landing URL. X uses this click identifier for measurement."
        ],
        note: "Active means X detected the event within the last 24 hours. Inactive means X has never detected it. No recent activity means X did not detect it during the last 24 hours.",
        image: {
          src: "/images/tracking-event-status.png",
          alt: "Sanitized X Events Manager rows showing active automatic website events and their attribution windows.",
          width: 960,
          height: 109,
          caption: "Check the event status and recent activity. Active automatic events confirm that the base pixel is sending data.",
          source: "https://ads.x.com",
          wide: true
        },
        links: [
          { label: "Install and use X Pixel Helper", href: "https://business.x.com/en/help/campaign-measurement-and-analytics/pixel-helper" }
        ]
      },
      {
        heading: "Before you move on",
        paragraphs: [
          "Your campaign needs a tested result to optimize for. Complete these checks before you build the campaign."
        ],
        items: [
          "The base pixel loads once on every public page after the required consent.",
          "Site visits and Landing page views show recent activity.",
          "Your primary conversion event is active and its recent activity shows the correct website host.",
          "Purchase runs only after a successful payment.",
          "Purchase sends the correct value and currency.",
          "A shared conversion_id removes duplicates when Web Pixel and Conversion API are both in use.",
          "Your privacy notice and consent controls describe the tracking data you send."
        ],
        note: "If your primary conversion event is missing, inactive, or duplicated, do not launch. Correct the setup and complete another test first.",
        links: [
          { label: "Next: Launch your first campaign →", href: "/x-ads/launch" },
          { label: "X website-conversions campaign guide", href: "https://business.x.com/en/help/campaign-setup/create-website-conversions-campaign" }
        ]
      }
    ]
  },
  {
    path: "/x-ads/launch",
    title: "Launch your first campaign",
    description: "Create a Sales campaign, organize your targeting into ad groups, and build ads that show people what your product can do.",
    outcome: "You will have a complete Sales campaign with focused audiences, verified tracking, and product-led ads.",
    content: [
      {
        heading: "1. Start a Sales campaign",
        paragraphs: ["Open Ads Manager. We're going to build a campaign that looks for customers."],
        steps: [
          "Open the campaign area from the left navigation, then open the campaign creation form. If your layout shows Create campaign instead, use that.",
          "Select Sales as the campaign objective and continue.",
          "Give the campaign a name you will recognize. You'll configure its ad groups and the ads inside them in the setup flow."
        ],
        note: "The campaign sets the overall goal. Ad groups hold the targeting and budget settings for each audience you want to test. The ads are the posts those people will see.",
        image: {
          src: "/images/launch-1.png",
          alt: "X Ads campaign creation screen with Sales selected as the campaign objective.",
          width: 1224,
          height: 618,
          caption: "Select Sales as the campaign objective.",
          source: "https://ads.x.com",
          wide: true
        },
        links: [
          { label: "Open Ads Manager", href: "https://ads.x.com" },
          { label: "X's Sales campaign guide", href: "https://business.x.com/en/help/campaign-setup/create-website-conversions-campaign" }
        ]
      },
      {
        heading: "2. Build your first ad group",
        paragraphs: ["Let's use Europe as the first example. Keep one geography and one targeting approach together so you can understand what you're testing."],
        steps: [
          "Create an ad group and name it Europe — English — Follower look-alikes.",
          "Set the budget and schedule for this group. Check whether the amount is a daily budget or a total budget before continuing.",
          "Under locations, add the European countries in the list below. Review the selected country list before you continue.",
          "Select English as the language for this example. Your ad and landing page should both be in English."
        ],
        items: [
          "France",
          "Germany",
          "Netherlands",
          "Austria",
          "Portugal",
          "Ireland",
          "Denmark",
          "Switzerland",
          "Sweden",
          "Norway",
          "Belgium",
          "Finland",
          "United Kingdom",
          "Spain",
          "Italy",
          "Poland"
        ],
        note: "An ad group is where we separate the settings we want to compare. If you put Europe, North America, and several targeting methods into one group, the combined result is harder to interpret. Start with geography plus a targeting approach.",
        image: {
          src: "/images/launch-locations.png",
          alt: "X Ads demographics settings with European countries included and English selected as the language.",
          width: 710,
          height: 344,
          caption: "Add the countries first, then confirm English appears under Languages.",
          source: "https://ads.x.com",
          wide: true
        }
      },
      {
        heading: "3. Add follower look-alikes",
        paragraphs: ["Give X a starting point: accounts whose followers are interested in the problem your product solves."],
        steps: [
          "Open Advanced targeting and keep Optimized Targeting on.",
          "Choose Follower look-alikes. In some layouts, expand the targeting options first.",
          "Search for a relevant account by its @handle, select it, and add it to the group. Repeat for the other accounts you want to use.",
          "Review the selected accounts. Keep this group's audience based on follower look-alikes; use a separate group to test a different targeting approach."
        ],
        note: "Follower look-alikes finds people with interests similar to an account's followers. It is not a direct list of those followers. With Optimized Targeting on, X can expand beyond that audience selection. Your location and language settings still apply. This gives the system room to find more potential customers, so treat the results as a test of this setup rather than an exact follower audience.",
        image: {
          src: "/images/launch-advanced-targeting.gif",
          alt: "Animated X Ads example that expands Advanced targeting to show Optimize targeting, Interests, Keywords, and Follower look-alikes.",
          width: 720,
          height: 341,
          caption: "Expand Advanced targeting. Keep Optimize targeting on, then use Follower look-alikes for this ad group.",
          source: "https://ads.x.com",
          wide: true
        },
        links: [
          { label: "How follower look-alikes work", href: "https://business.x.com/en/help/campaign-setup/campaign-targeting/interest-and-follower-targeting" },
          { label: "How Optimized Targeting works", href: "https://business.x.com/en/help/campaign-setup/campaign-targeting/optimized-targeting" }
        ]
      },
      {
        heading: "4. Select your purchase conversion",
        paragraphs: ["This is the important part. Tell the campaign which result you're asking it to find."],
        steps: [
          "In the conversion settings, select the Purchase event for your product.",
          "Confirm it is the event that fires after a successful purchase, not just a click on the buy button.",
          "If the event is missing or has not been verified, stop here and finish the pixel setup before launching."
        ],
        note: "We're using Purchase because customers are the goal. The pixel sends the result back to X so the platform can learn from it. Selecting Purchase in this form does not install or verify the event on your website.",
        image: {
          src: "/images/launch-conversion.png",
          alt: "X Ads Delivery and Placements settings showing Website Conversions, Purchase as the conversion event, and automatic placements.",
          width: 720,
          height: 333,
          caption: "In Delivery & Placements, verify Website Conversions and select your Purchase event.",
          source: "https://ads.x.com",
          wide: true
        },
        links: [
          { label: "Revisit Tracking pixel setup", href: "/x-ads/tracking" },
          { label: "X's conversion tracking instructions", href: "https://business.x.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites" }
        ]
      },
      {
        heading: "5. Add your other ad groups",
        paragraphs: ["Once the first group is set up, repeat the process for the other markets or targeting approaches you want to test."],
        steps: [
          "Create another group for North America, Asia, or another geography you want to test. Select the actual countries for each group.",
          "Give each group a name that includes its geography, language, and targeting approach.",
          "When comparing geography, keep the ads and audience approach consistent. When comparing targeting approaches, keep the geography and ads consistent.",
          "Check each group's budget, schedule, language, locations, and Purchase event. Add up the budgets so you know the total spending you are allowing."
        ],
        note: "You don't have to test every region at once. Every extra group needs budget. Add the groups you have a reason to test and can afford to run."
      },
      {
        heading: "6. Write ads that feel natural on X",
        paragraphs: ["Go back to the core principles: the campaign is your new feed. Write like you're talking to someone who could actually use your product."],
        steps: [
          "Start with a problem your customer recognizes. Call it out directly.",
          "Explain what makes that problem frustrating: the time it wastes, the repeated work, or the result they can't get.",
          "Show how your product helps. Name the specific thing it does instead of making a vague promise.",
          "End with a clear next action that matches the landing page, such as trying the product or signing up."
        ],
        note: "Make the problem feel familiar without exaggerating it. The reader should understand why this matters and what your product can do. Keep the language natural. You don't need to sound like an advertising agency.",
        links: [{ label: "Revisit Core principles", href: "/x-ads/principles" }]
      },
      {
        heading: "7. Show the product in a video",
        paragraphs: ["You built the product. Show it working. A straightforward screen recording can make the value much easier to understand."],
        steps: [
          "Record the product solving the problem from your ad copy. Make the important action and result easy to see.",
          "Add the video to your ad and configure its website destination or website button.",
          "Preview the ad. Test the website link and confirm it opens the correct landing page. A click on playback controls is not the same as a website click.",
          "After delivery starts, check the available video viewing and completion metrics alongside clicks and purchases."
        ],
        note: "Video gives you another signal: how much of the demonstration people watch. That can help you assess the creative and audience together, but watching a video does not automatically mean someone wants to buy.",
        links: [{ label: "X's video website format", href: "https://blog.x.com/en_us/topics/product/2017/Make-your-videos-work-harder-with-the-Video-Website-Card" }]
      },
      {
        heading: "8. Give each ad a trackable link",
        paragraphs: ["UTM parameters are labels on your destination URL. They let your analytics identify the campaign and ad that brought someone to your site."],
        steps: [
          "Start with your landing page URL and add utm_source=x and utm_medium=paid_social.",
          "Set utm_campaign to your campaign name, such as first_launch.",
          "Set utm_content to a unique ad label, such as europe_demo_video_01. Keep the naming consistent in your notes.",
          "Use the finished URL as the ad's website destination. Test it and confirm analytics receives the UTM values after any redirects."
        ],
        note: "Example: https://example.com/?utm_source=x&utm_medium=paid_social&utm_campaign=first_launch&utm_content=europe_demo_video_01 — use your own domain. If the URL already has a ?, append parameters with &. Keep customer information out of these labels.",
        links: [{ label: "UTM tracking in PostHog", href: "https://posthog.com/docs/data/utm-segmentation" }]
      },
      {
        heading: "9. Check what happens after the click",
        paragraphs: ["Getting someone to your site is only part of it. Now give them an easy next step."],
        steps: [
          "Open the landing page from your ad preview and confirm it delivers on the ad's promise.",
          "Make the main action easy to find. For a product that starts with an account, test the signup or login flow from start to finish.",
          "If your product offers Google sign-in, test that path too. Confirm the customer lands in the right place after signing in.",
          "Before publishing, review all ad groups, budgets, destinations, and conversion events one more time."
        ],
        note: "An easy signup can help turn the visit into a product user. It is still a step toward the purchase we're optimizing for. We'll develop this further in Post-click experience."
      }
    ]
  },
  {
    path: "/x-ads/improve",
    title: "Improve your campaign",
    description: "Use campaign results to decide what to do next.",
    outcome: "You will be able to read campaign results and decide when to wait, change, stop, or increase spending.",
    content: [
      {
        paragraphs: [
          "Ads are running, now what? This section covers what to check and when to wait, change the campaign, stop it, or increase spending. Use the measurement you set up before launch to guide those decisions."
        ]
      }
    ]
  },
  {
    path: "/x-ads/beyond",
    title: "Beyond X Ads",
    description: "Connect your campaigns to the rest of your business.",
    outcome: "You will know how to connect paid acquisition to onboarding, retention, and organic growth.",
    content: [
      {
        paragraphs: [
          "X Ads get your users in the door. This section covers onboarding, follow-up, retention, and organic growth. It also connects your marketing data and explores how the course principles apply to other ad platforms."
        ]
      }
    ]
  },
  {
    path: "/x-ads/plan",
    title: "Plan your campaign",
    description: "Decide what you will test before you spend money.",
    outcome: "You will have a clear campaign goal, offer, and test structure before you enter Ads Manager.",
    content: [
      {
        paragraphs: [
          "A useful campaign starts with a clear offer and a structure that isolates the decisions you want to test. Complete the two pages in this section before you build the campaign in Ads Manager."
        ]
      }
    ]
  },
  {
    path: "/x-ads/plan/offer",
    title: "Start with the offer",
    description: "Define one clear reason for the right person to click your ad.",
    outcome: "You will have one clear offer for one audience and one measurable conversion.",
    content: [
      {
        paragraphs: [
          "An ad cannot fix an unclear offer. Decide who the product is for, what problem it solves, and what you want the person to do after the click."
        ],
        heading: "Before you spend",
        items: [
          "Choose one product and one audience.",
          "Write the result your customer wants.",
          "Choose one conversion that you can measure.",
          "Check that the landing page supports the same promise as the ad."
        ]
      }
    ]
  },
  {
    path: "/x-ads/plan/structure",
    title: "Structure the campaign",
    description: "Build a simple test that gives you a useful answer.",
    outcome: "You will have a campaign structure that isolates each audience idea and produces a useful result.",
    content: [
      {
        paragraphs: [
          "Give each campaign one job. Separate major audience ideas so you can see which one produced the result. Keep the first test small enough to read and large enough to collect useful data."
        ]
      }
    ]
  },
  {
    path: "/x-ads/build",
    title: "Build the campaign",
    description: "Turn the plan into an audience and a set of ads.",
    outcome: "You will turn your campaign plan into a focused audience and a clear set of ads.",
    content: [
      {
        paragraphs: [
          "This section covers the two parts people see: who receives the ad and what the ad says. Keep both parts focused so the results remain useful."
        ]
      }
    ]
  },
  {
    path: "/x-ads/build/audience",
    title: "Find the audience",
    description: "Reach people who already care about the problem you solve.",
    outcome: "You will have focused audience groups based on relevant accounts, interests, keywords, and locations.",
    content: [
      {
        paragraphs: [
          "Start with the people who already discuss the problem your product solves. Build focused groups from relevant accounts, keywords, interests, and locations. Test one audience idea at a time."
        ]
      }
    ]
  },
  {
    path: "/x-ads/build/creative",
    title: "Make the ads",
    description: "Turn one customer problem into ads people understand quickly.",
    outcome: "You will have clear ads that show one customer problem, the product result, and the next action.",
    content: [
      {
        paragraphs: [
          "Each ad needs one clear idea. Lead with the customer problem or desired result. Show proof when you have it. Make the next action easy to understand."
        ]
      }
    ]
  },
  {
    path: "/x-ads/measure",
    title: "Measure the campaign",
    description: "Connect campaign activity to customer actions.",
    outcome: "You will have a measurement plan that connects ad activity to customer actions.",
    content: [
      {
        paragraphs: [
          "Measurement tells you where the campaign works and where it loses people. Verify the data before launch, then use it to make one clear decision at a time."
        ]
      }
    ]
  },
  {
    path: "/x-ads/measure/tracking",
    title: "Track the result",
    description: "Measure what happens between the first impression and the sale.",
    outcome: "You will be able to verify the path from impression and click to signup and sale.",
    content: [
      {
        paragraphs: [
          "Follow the full path from impression to sale. Verify the click, landing page, signup, and purchase events before the campaign starts. A missing event can make a good campaign look bad."
        ]
      }
    ]
  },
  {
    path: "/x-ads/measure/results",
    title: "Read the data",
    description: "Use campaign data to decide what you will do next.",
    outcome: "You will be able to use campaign data to choose whether to stop, change, or continue the test.",
    content: [
      {
        paragraphs: [
          "Use the result to make one decision: stop, change, or continue. Do not judge an ad from impressions alone. Read the cost and conversion quality at each step of the path."
        ]
      }
    ]
  },
  {
    path: "/x-ads/resources",
    title: "Resources",
    description: "Use the same templates and checks throughout the course.",
    outcome: "You will know which template or checklist to use at each stage of the campaign.",
    content: [
      {
        paragraphs: [
          "The working files support the decisions in each part of the course. Download a clean copy before you start a new campaign."
        ]
      }
    ]
  },
  {
    path: "/x-ads/resources/working-files",
    title: "Working files",
    description: "Keep the course templates beside your campaign.",
    outcome: "You will have the planning, creative, and tracking files ready beside your campaign.",
    content: [
      {
        items: [
          "Campaign planning template",
          "Offer and audience worksheet",
          "Creative testing checklist",
          "Tracking verification checklist"
        ]
      }
    ]
  }
];

export function getCoursePage(path: string) {
  return coursePages.find((page) => page.path === path);
}
