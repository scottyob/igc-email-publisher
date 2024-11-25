// import FormData from "form-data";

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
  // console.log("Track Content: ", trackContent);
  // console.log("Email: ", email);
  // console.log("Key: ", key);
  // console.log("Pass: ", pass);


  // const fileBuffer = Buffer.from(trackContent, "base64");
  const fileBuffer = new Blob([atob(trackContent)], { type: 'application/octet-stream' });

  // Build the upload request
  const form = new FormData();
  form.append('track[category_name]', 'paragliding');
  form.append('track[track_type]', 'classic_track');

  // Add the file
  form.append('track[imported_file]', fileBuffer, 'tracklog.igc');

  const url = 'https://api.sportstracklive.com/v1/track';

  const token =  await getToken(email, key, pass);
  // console.log("Got token: ", token);

  const header = {
    "X-STL-Token": token,
  };

  const reqData = {
    method: 'POST',
    body: form,
    headers: header
  };

  // console.log("Request to sports track live: ", reqData);
  // Display the key/value pairs
  for (var pair of form.entries()) {
    console.log(pair[0]+ ', ' + pair[1]); 
  }

  // Make the call to sports track live
  const req = await fetch(url, reqData);
  console.log("Sports track live upload returned: ", req.statusText);
  if(!req.ok) {
    console.log("Error text: ", await req.text());
  }
  
  const reqJson = await req.json();
  console.log("Sports track live upload returned JSON: ", JSON.stringify(req, null, 2));

  return reqJson.track.permalink_3d_url;

}

export { getToken, UploadTrack }
