
import { Octokit } from "@octokit/rest";
import dedent from "dedent";


export async function UploadLogEntry(filename, igc, comment, token, sportsTrackLiveUrl) {
  const content = igc;
  const path = filename.slice(0, filename.lastIndexOf('.'));

  const octokit = new Octokit({
    auth: token
  });

  const commentsText = dedent`
    ---
    sportsTrackLiveUrl: ${sportsTrackLiveUrl}
    ---
    ${comment}
  `;

  // See: https://docs.github.com/en/free-pro-team@latest/rest/reference/git#get-a-reference
  const lastCommit = (await octokit.request("/repos/{owner}/{repo}/git/refs/heads/origin", {
    owner: "scottyob",
    repo: "paragliding-logbook",
  }));
  const lastCommitSha = lastCommit.data.object.sha;

  // We can publish multiple files in "blobs"
  // Create a blob for our Flight 
  const flightBlob = (await octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
    content: content,
    encoding: "base64",
    owner: "scottyob",
    repo: "paragliding-logbook"
  })).data.sha;

  const commentsMdxBlob = (await octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
    owner: "scottyob",
    repo: "paragliding-logbook",
    encoding: "utf-8",
    content: commentsText,
  })).data.sha;

  // Upload the comments and flights file to GitHub
  const addPathTree = (await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
    owner: "scottyob",
    repo: "paragliding-logbook",
    tree: [{
      "path": `flights/${path}/${filename}`,
      "mode": "100644",
      "type": "blob",
      "sha": flightBlob,
    },
    {
      "path": `flights/${path}/comments.mdx`,
      "mode": "100644",
      "type": "blob",
      "sha": commentsMdxBlob,
    }
    ],
    "base_tree": lastCommitSha,
  })).data.sha;

  // Get the previous commit
  const parentBranch = (await octokit.request("GET /repos/{owner}/{repo}/git/refs/heads/{branch}", {
    owner: "scottyob",
    repo: "paragliding-logbook",
    branch: "origin"
  }));
  console.log("Parent Branch: ", parentBranch);
  const parentBranchSha = parentBranch.data.object.sha;

  // Add a commit
  const newCommit = (await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
    owner: "scottyob",
    repo: "paragliding-logbook",
    tree: addPathTree,
    message: `Added flight ${path}`,
    parents: [parentBranchSha],
  }));
  console.log("New Commit: ", newCommit);
  const newCommitSha = newCommit.data.sha;

  // Update the origin branch
  await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}", {
    owner: "scottyob",
    repo: "paragliding-logbook",
    branch: "origin",
    sha: newCommitSha,
  });

  console.log("Done committing");
}

