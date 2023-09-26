This repository holds my Cloudflare Worker that's hooked into an e-mail target to perform the following:

* Upload the flight to SportsTrackLive
* Upload the flight to my [Logbook](https://github.com/scottyob/paragliding-logbook)
* Trigger a publish of my [Website](https://github.com/scottyob/nextjs-website)

## Testing

You can populate the SportsTrackLive config in 
./src/test/env.mjs

note to scott:  Look in your bitwarden

Then you can test using:
```
npm run start
```

## Updating

```
npx wrangler deploy
```
