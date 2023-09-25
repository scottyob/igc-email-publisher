import fetch, { File } from 'node-fetch';
import FormData from "form-data";

// Documentation @ https://api.sportstracklive.com/v1/documentation

const apiUrl = 'https://api.sportstracklive.com/v1/auth';

/*
 * Builds a request to get a token used to upload the flight from
 * SportsTrackLive
 */
async function getToken(email, key, password) {

  const headers = {
    'Content-Type': 'application/json',
    'X-STL-Secret-Key': key,
  };

  const requestBody = {
    email,
    password,
    origin: 'external'
  };

  // Gets a token from SportsTrackLive
  const req = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });
  const reqJson = await req.json();
  return reqJson.token;
}

async function UploadTrack(trackContent, email, key, pass) {
  const fileBuffer = Buffer.from(trackContent, "base64")

  // Build the upload request
  const form = FormData();
  form.append('track[category_name]', 'paragliding');
  form.append('track[track_type]', 'classic_track');

  // Add the file
  form.append('track[imported_file]', fileBuffer, 'tracklog.igc');

  const url = 'https://api.sportstracklive.com/v1/track';

  const header = {
    "X-STL-Token": await getToken(email, key, pass),
    ...form.getHeaders(),
  };

  const reqData = {
    method: 'POST',
    body: form,
    headers: header
  };

  const req = await fetch(url, reqData);

  const reqJson = await req.json();
  return reqJson.track.permalink_3d_url;

}

export { getToken, UploadTrack }
