import testIgc from "./test/igc.mjs";
import env from "./test/env.mjs";
import { UploadTrack } from "./sportsTrackLive.mjs"
import { UploadLogEntry } from "./lib.mjs"

async function main(event) {
  // Upload to SportsTrackLive

  const igcContents = testIgc;

  const stlUrl = await UploadTrack(
    igcContents,
    env.STLEMAIL,
    env.STLKEY,
    env.STLPASS,
  );

  console.log("STL URL", stlUrl);
  await UploadLogEntry(
    "2023-09-17-XFH-000-01.IGC",
    igcContents,
    "Not a bad flight for ed!",
    env.GITHUB_TOKEN,
    stlUrl,
  );

  return new Response("Done!");

}

addEventListener("fetch", (event) => {
  return event.respondWith(main(event));
});

