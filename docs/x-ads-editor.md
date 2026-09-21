# Course page editor

Open **Admin → Course CMS → Create and edit**, or open an existing lesson while signed in as the course administrator.

Each lesson has a title, an outcome card, an optional main video, and one block editor. Type `/` to insert blocks. Paste formatted text, drop media into the editor, or use **Page settings → Markdown import** to append Markdown. Tables, lists, headings, images, videos, audio, files, code, quotes, and nested content are supported.

**Save draft** keeps changes private. **Customer preview** displays unsaved edits with the same layout and comment controls as the customer page. Comments cannot be sent in preview. Use **Edit page** to return without losing edits. The editing controls use icon-and-text links in a sticky bar across the main content area, and **Page settings** contains the video controls and Markdown import. **Publish changes** saves and publishes the page. New pages stay out of customer navigation until publication. Concurrent edits from another window produce an error instead of overwriting the newer draft. Page slugs remain fixed after creation, so routes and media folders stay consistent.

Comments remain private between each customer and Tom. Existing paragraph comment identifiers remain unchanged when content becomes blocks. New blocks have permanent identifiers. Moving a block keeps its threads. Removed blocks retain their conversations under **Comments on removed content** and in Messages. Existing note conversations remain available. A table is one comment target; individual cells do not have separate threads.

## Groups and pages

In **Admin → Course CMS**, select **Page** or **Group** when creating an entry. A group has the same title, outcome card, video, content editor, and comments as a page. It can contain child pages. Groups cannot contain other groups. Overview stays first and outside all groups.

Use the drag handle to reorder entries. Drop a page in the middle of a group row to put it inside the group. Drop near a row's top or bottom edge to place it before or after that row. Moving a group moves all its children. The selector beside each entry can move a page to a group, take it out of a group, or convert it to a group. Move all children out before converting a group to a page. With the drag handle focused, Up/Down reorder siblings, Right moves a top-level page into the preceding group, and Left moves a child out of its group.

Structure changes save immediately. Group content uses the usual draft and publish controls. Published child pages remain accessible at the top level until their group is published. Customer navigation shows collapsible groups and indented child links. Previous/next links follow this same order. Existing URLs, content, comments, and Spaces objects remain unchanged when a page moves.

The complete structure is stored as one document in `x_ads_course_structure`. Concurrent changes are checked before saving. Older page records need no migration.

## Spaces configuration

Server-only settings in `.env` and the hosting environment:

```dotenv
DO_SPACES_ACCESS_KEY=<existing key>
DO_SPACES_SECRET_KEY=<existing secret>
DO_SPACES_BUCKET=main003
DO_SPACES_REGION=tor1
DO_SPACES_ENDPOINT=https://tor1.digitaloceanspaces.com
DO_SPACES_ORIGIN=https://main003.tor1.digitaloceanspaces.com
```

The production site origin is `https://www.tomzaragoza.com`. Set `BETTER_AUTH_URL=https://www.tomzaragoza.com` in the production hosting environment. Keep `BETTER_AUTH_URL=http://localhost:3000` for local development.

The bucket needs a CORS rule for `http://localhost:3000` and `https://www.tomzaragoza.com`. Enter origins without a trailing slash. Allow `GET`, `HEAD`, and `PUT`; allow request headers `*`; expose `ETag`. Add a different localhost port or preview deployment origin when testing there. The supplied object-storage key can upload files but cannot inspect or change bucket CORS.

Uploaded objects are private. The video player hides its download control and blocks its context menu. These controls discourage downloads; they do not prevent screen recording or saving video data through browser tools. Uploads use signed multipart requests, 16 MB parts, progress, cancellation, and up to three attempts per part. Videos support MP4 and WebM up to 2 GB. Images, audio, PDFs, text, and CSV files support up to 50 MB. MOV files need conversion to MP4 or WebM before upload. This implementation does not transcode video or generate adaptive streaming formats.

Files are stored under `x-ads/<page_slug>/main-video`, `images`, `videos`, or `files`, with unique file identifiers. MongoDB stores the page document and permanent media references. Media requests check course access and published-page references before issuing a 12-hour viewing link. The link can be reused until it expires. The current presale access policy remains in force; publishing a lesson does not open presale access early.

Replacing a file uploads a new object. The published page continues to reference the previous file until publication succeeds. Existing local images and external media links remain usable; new uploads use Spaces. Existing database records are converted to blocks on read and stored as blocks when a draft is saved. No bulk rewrite of live lessons is needed.

## Video player and watch progress

Published lesson videos use a custom player with playback, seeking, volume, speed, captions when provided, and fullscreen controls. A returning viewer's video opens at the saved playback position and stays paused until they press Play. Completed videos open at the beginning for replay. A late progress response does not move an uploaded video if the viewer has already started it or used its seek control. YouTube and Vimeo use their supported start-time parameters, rounded down to a whole second. Main videos and nested video blocks each have a separate record for each signed-in viewer and course page. The current lesson-access policy also applies to progress requests. Editing and customer preview do not write watch records.

The player counts unique watched intervals at one-second resolution. The final partial second counts when playback reaches the end. Seeking over content does not count that content. Replaying an interval does not increase its percentage again. The record uses the page slug, permanent video block identifier, viewer identifier, and a hash of the normalized video URL. Uploading a replacement creates a new URL and starts separate progress. Changing an external file without changing its URL does not create a new record.

Progress saves every ten seconds, on pause or completion, and when the page is hidden or closed. Requests can be retried safely. Concurrent tabs merge watched intervals. Playback timestamps prevent a delayed request from replacing a newer resume position, including a deliberate rewind. A pause during an existing save queues another save immediately after it completes. Network failures show a sync message and retry while the page remains open. A browser shutdown or a network outage at departure can prevent the last update from saving. Watched intervals are client telemetry, not proof of attendance. Videos up to six hours are supported.

Once the selected video scrolls past the top boundary, the same player moves to the left of the lesson on screens at least 1100 pixels wide. The content occupies the right column. Smaller screens keep the player above the scrolling content. Scrolling back restores its original position without loading the video again. Playing another video selects it for this behavior. The player stays below mobile navigation and the preview editing toolbar.

Uploaded MP4/WebM videos use browser playback ranges. YouTube and Vimeo embeds retain their provider controls and report playback through their official player APIs. YouTube uses sampled playback time; Vimeo uses played ranges. Loom embeds remain playable, but do not supply per-viewer watch progress here. Upload an MP4 or WebM copy to enable tracking for a Loom recording.

Open **Course CMS → Watch stats** to inspect a published page. Each video shows its viewer count, average watched percentage, and individual viewer progress. Page progress is the average percentage across the page's trackable videos; unwatched videos count as zero. Removed videos and replaced source URLs are excluded from the current report. Historical records remain in `x_ads_course_watch`.

Verify database persistence without changing course data:

```sh
node --env-file=.env --conditions=react-server scripts/check-course-watch.mjs
```

This check uses an isolated temporary collection and removes it afterward.

## Maintenance and checks

Old media is retained for recovery. Review unused files older than seven days with:

```sh
node --env-file=.env scripts/cleanup-course-media.mjs
```

Add `--apply` to remove the listed unused files and abandoned uploads. Files referenced by the published page or current draft are excluded. This command is manual; no background schedule is installed.

Run the regression suite and build:

```sh
npm run test:auth
npm run lint
npm run build
```

Run database-backed publishing checks against temporary collections. The script removes its own test collections afterward:

```sh
node --env-file=.env --conditions=react-server scripts/check-course-publishing.mjs
```
