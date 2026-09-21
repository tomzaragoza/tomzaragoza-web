# X Ads product direction

Agreed direction, September 20, 2026.

The X Ads course will become an account-based product. The public `/x-ads` page introduces the course. Google sign-in opens the course area. Future work will add useful tools, such as an ad library, within the same account.

## First step: landing page

- Give signed-out visitors a dedicated landing page with a header, course text on the left, and the existing app promo video on the right.
- Use the existing Google sign-in flow. Signed-in visitors see their workspace at `/x-ads`.
- Show the course outline and reuse current presale checkout, prices, and payment handling.
- Keep current lesson access rules. Sign-in does not grant paid lesson access. Customers retain their recorded presale purchases; the existing access policy controls lesson availability.
- Keep each lesson on its current route.

## Workspace shell

- Use a full-height sidebar with the profile photo and brand, Messages with its unread count, a collapsible X Ads Course list, and Ads Library.
- Show the course overview, lesson links, and current purchase state on the workspace home.
- Keep purchase links near the bottom of the sidebar. They open the existing Course and Pro plans.
- Use the same navigation on lesson, library, and message pages, with a drawer on mobile.
- Keep `/x-ads/library` signed-in only. It currently shows an empty state; ad storage and search are not implemented.
- Use the video background's blue for the visual theme, compact bordered buttons, and SF Mono headings.

## Next product steps

- Add course progress to the account home.
- Define and build the ad library: examples, search, filters, and saved ads are candidates, not confirmed features.
- Define which lessons and tools each plan includes before changing access rules.
- Keep future features out of public promises until they exist.

The workspace shell is implemented. Ad library data and course progress remain future work.
