export type CourseContentSection = {
  heading?: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
};

export type CoursePageDefinition = {
  path: string;
  title: string;
  description: string;
  content: readonly CourseContentSection[];
};

export const courseNavigation = [
  { title: "Introduction", path: "/x-ads" },
  { title: "Core principles", path: "/x-ads/principles" },
  { title: "Set up your X Ads account", path: "/x-ads/account" },
  { title: "Set up your analytics", path: "/x-ads/analytics" },
  { title: "Launch your first campaign", path: "/x-ads/launch" },
  { title: "Improve your campaign", path: "/x-ads/improve" },
  { title: "Beyond X Ads", path: "/x-ads/beyond" }
] as const;

export const coursePages: readonly CoursePageDefinition[] = [
  {
    path: "/x-ads",
    title: "Get your first customers from X Ads",
    description:
      "Learn a repeatable process for turning your offer into a measured X Ads campaign.",
    content: []
  },
  {
    path: "/x-ads/principles",
    title: "Core principles",
    description: "Understand the decisions that guide the course.",
    content: [
      {
        paragraphs: [
          "This section covers conversion campaigns, the customer action you want to measure, and the role of tracking. It also introduces earlier actions, such as signups, and how to assess their quality."
        ]
      }
    ]
  },
  {
    path: "/x-ads/account",
    title: "Set up your X Ads account",
    description: "Prepare your account and the data you send to X.",
    content: [
      {
        paragraphs: [
          "This section covers account requirements, your blue checkmark, pixel tracking, and conversion events. Complete the tracking setup before you launch your campaign."
        ]
      }
    ]
  },
  {
    path: "/x-ads/analytics",
    title: "Set up your analytics",
    description: "Prepare to examine user behavior and business results.",
    content: [
      {
        paragraphs: [
          "This section covers Microsoft Clarity, PostHog Session Replays, and Google Search Console. Set up measurement before launch so you can follow what people do after they reach your site. The Beyond X Ads section will connect this data to your wider marketing activity."
        ]
      }
    ]
  },
  {
    path: "/x-ads/launch",
    title: "Launch your first campaign",
    description: "Prepare your offer, landing page, and ads for launch.",
    content: [
      {
        paragraphs: [
          "This section brings together your offer, landing page, and ad creative. It then covers optimization choices, budget, targeting, and campaign structure."
        ]
      }
    ]
  },
  {
    path: "/x-ads/improve",
    title: "Improve your campaign",
    description: "Use campaign results to decide what to do next.",
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
