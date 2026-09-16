# X Ads course outline

This file records the current thinking for the left sidebar and course content. Keep the wording close to the original notes. Build the sidebar, pages, and content from this file and its later revisions.

Use [COURSE_STRUCTURE.md](../../COURSE_STRUCTURE.md) to develop the detailed lessons from [KNOWLEDGE.md](../../KNOWLEDGE.md). It maps the source notes to the course sections and defines learner decisions, practical instructions, completion checks, and related free-video ideas. This file remains the implementation checklist.

The eight top-level sections below are approved for the sidebar. Each section has its own route and a short overview. Detailed lessons and subpage structure will be developed from these notes in later revisions.

Use the checkboxes to track implementation. Leave an item unchecked until its page or content is implemented and checked. Indentation records the current grouping; it does not require a separate page for every item.

## Sidebar implementation

- [x] Introduction — `/x-ads`
- [x] Core principles — `/x-ads/principles`
- [x] Set up your X Ads account — `/x-ads/account`
- [x] Set up your analytics — `/x-ads/analytics`
- [x] Tracking pixel setup — `/x-ads/tracking`
- [x] Launch your first campaign — `/x-ads/launch`
- [x] Improve your campaign — `/x-ads/improve`
- [x] Beyond X Ads — `/x-ads/beyond`

These checkboxes cover the sidebar links and section overview pages only. The content checklist below remains separate.

## Introduction

- [ ] Who this is for
- [ ] What the learner will achieve
- [ ] Why run X Ads
  - [ ] Ive been experimenting with X Ads since 2019. back then it was really bad. now its all better. Just look at all the moves that xAI is doing. They are starting to get feature parity to other platforms and making it look like other platforms as well. They are moving in the right direction. Look at Grok as well. Speculation, but having Grok behind it all is pretty important.

## Core principles

Current lesson copy: [Core principles](x-ads-core-principles.md). This replaces the earlier outline below and is stored in the page content for `/x-ads/principles`. The introduction page is public. Lesson content requires Google sign-in. The configured complimentary account can open every lesson without checkout. Other signed-in accounts see the upgrade prompt.

- [x] Ad platforms are basically AI marketing engines
- [x] Pixel tracking is non-negotiable
- [x] Ads should not look like ads
- [x] Show, don't just tell
- [x] The campaign is your new feed

Earlier planning notes, retained for later lessons:

- [ ] Always Conversion campaigns, as close to your target event as possible
- [ ] Move up the funnel if less volume
- [ ] Must ALWAYS have pixel tracking, otherwise you're burning your money
- [ ] Have proxy events, such as signups, but enrich them further to train pixel to find high quality users

## Set up your X Ads account

Account setup instructions are implemented. See [sources and lesson notes](x-ads-account-setup.md).

Cover account requirements. Complete tracking setup in the dedicated tracking chapter before launch.

- [x] Your blue checkmark
- [x] Ads account creation and billing setup

## Tracking pixel setup

The instructional draft is implemented. See [lesson sequence, sources, and privacy controls](x-ads-tracking.md).

- [x] Choose Web Pixel, Conversion API, or both
- [x] Install the base pixel on every page
- [x] Choose the events that match the customer journey
- [x] Create conversion events in Events Manager
- [x] Install event code at the successful action
- [x] Send purchase parameters and deduplicate browser and server events
- [x] Test events with Pixel Helper and recent activity
- [x] Complete the pre-launch tracking checks

## Set up your analytics

The instructional draft is implemented. See [lesson sequence and sources](x-ads-analytics.md).

Cover how to examine user behavior and business results. Set up measurement here before launch. Teach ongoing campaign decisions under Improve your campaign.

- [x] User Behavior Analytics
  - [x] Microsoft Clarity setup instructions
  - [x] PostHog Session Replay setup instructions
- [x] Test visit and replay verification
- [x] X Ads metrics view setup
- [x] Google Search Console setup and brand-search starting point

## Launch your first campaign

The first instructional draft is implemented. See [lesson sequence, sources, and remaining content](x-ads-launch.md).

- [ ] Choosing your offer
- [ ] Preparing your landing page
- [x] Making your ads — natural copy and product video instructions
  - [x] Trackable links and UTM verification — [notes](x-ads-trackable-links.md)
- [ ] Choosing your optimizations
  - [x] Sales objective and Purchase event selection
- [ ] Budget and Targetting
  - [x] Geography, language, follower look-alikes, and Optimized Targeting
  - [ ] Budget amounts and bidding guidance
- [x] Structuring your campaigns

## Improve your campaign

Use “Ads are running, now what?” as a possible page title inside this section.

- [ ] What to check while ads are running
- [ ] When to wait for more data
- [ ] When to change the campaign
- [ ] When to stop the campaign
- [ ] When to increase spending

## Beyond X Ads

Keep this section focused on how the rest of the business supports the campaign.

- [ ] X Ads get your users in the door
  - [ ] You need to setup all other things to push them down the funnel
  - [ ] Onboarding
  - [ ] Follow-up
  - [ ] Retention
- [ ] Should aim for building your organic
- [ ] Monitor analytics on other parts of your marketing stack
- [ ] Exploring other ad platforms
  - [ ] Always point back to how things in this should apply to these other ad platforms as well
