# Tracking pixel setup

The instructional draft is implemented at `/x-ads/tracking`. The lesson copy is stored in `app/x-ads/course-data.ts`.

It appears after Set up your analytics and before Launch your first campaign.

## Lesson sequence

1. Explain the base pixel, conversion events, and why X needs them.
2. Choose Web Pixel, Conversion API, or both.
3. Install the base pixel on every page.
4. Map the customer journey to X event types.
5. Create an event in Events Manager.
6. Install the event at the successful action.
7. Test the event with Pixel Helper and recent activity.
8. Complete the pre-launch tracking checks.

## Media

The screenshots and short GIF use the current X Events Manager interface. They were captured on September 16, 2026.

The public versions remove the ads-account identifier, the pixel identifier, product-specific event names, and exact activity timestamps. The base-code example uses `YOUR_PIXEL_ID`.

- `public/images/tracking-methods.png`
- `public/images/tracking-base-code.png`
- `public/images/tracking-create-event.gif`
- `public/images/tracking-event-status.png`

## Official references

Reviewed September 16, 2026:

- [Website conversion tracking](https://business.x.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites)
- [X Pixel Helper](https://business.x.com/en/help/campaign-measurement-and-analytics/pixel-helper)
- [Website-conversions campaign setup](https://business.x.com/en/help/campaign-setup/create-website-conversions-campaign)

## Safety and privacy

The lesson tells the learner to connect X tracking to the website's consent controls and privacy notice. It also warns against sending passwords, access tokens, or sensitive form text. Customer information must follow X requirements and the learner's consent rules.

No event was created and no setting was changed in the live X Ads account while the screenshots were captured.
