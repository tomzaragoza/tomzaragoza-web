# Give every ad a trackable link

Moved from analytics and now included in the creating-ads portion of Launch your first campaign at `/x-ads/launch`. The notes below preserve the original draft.

UTM parameters are labels you add to a URL. They tell your analytics where a visit came from. Use a consistent naming format so you can tell which campaign and ad brought someone in.

1. Start with your landing page URL. Add `utm_source=x` and `utm_medium=paid_social`.
2. Set `utm_campaign` to a short campaign name, such as `first_launch`.
3. Set `utm_content` to a name for that particular ad, such as `demo_video_01`. Give each ad its own value.
4. Use lowercase names and underscores consistently. Save each finished URL beside its ad in your campaign notes.
5. Use the tagged URL as the ad's destination when you build the campaign.

Example: `https://example.com/?utm_source=x&utm_medium=paid_social&utm_campaign=first_launch&utm_content=demo_video_01`

Replace example.com with your landing page. Use `&` to append parameters if the URL already contains `?`. Don't put customer information in these labels.

Before launch, test that redirects preserve these parameters until analytics captures the visit. Confirm the UTM properties on the landing event and find its replay.

[How PostHog captures UTM parameters](https://posthog.com/docs/data/utm-segmentation)
