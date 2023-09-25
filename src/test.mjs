import { uploadTrack } from "./sportsTrackLive.mjs";
import {UploadLogEntry } from "./lib.mjs";

import fs from "fs/promises";

import dotenv from "dotenv";

dotenv.config();
const github_token = process.env.GITHUB_TOKEN;

// Replace 'file_path' with the actual path to your IGC file.
const filePath = 'test/2023-09-17-XFH-000-01.IGC';

const daFile = await fs.readFile(filePath);
const flight = Buffer.from(daFile).toString("base64");

// const flightUrl = await uploadTrack(flight);

await UploadLogEntry(
  "2023-09-17-XFH-000-01.IGC",
  flight,
  "Unexpectedly good flight for Ed",
  github_token,
  "https://www.sportstracklive.com/live/Scottyob/paragliding/827345?mode=3D",
);




console.log(flightUrl);


// const octokit = new Octokit({
//   auth: github_token 
// });

// const flightsTree = (await octokit.request("GET /repos/{owner}/{repo}/git/trees/origin", {
//   owner: "scottyob",
//   repo: "paragliding-logbook",
// })).data.tree;

// // Extract the sha from our "flights" directory
// const flightsSha = flightsTree.find(f => f.path == "flights").sha;

// console.log(flightsSha);
