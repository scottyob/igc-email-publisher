import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import { UploadTrack } from './sportsTrackLive.mjs';
import { UploadLogEntry } from "./lib.mjs";

const PostalMime = require("postal-mime");

async function streamToArrayBuffer(stream, streamSize) {
  let result = new Uint8Array(streamSize);
  let bytesRead = 0;
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result.set(value, bytesRead);
    bytesRead += value.length;
  }
  return result;
}

async function sendEmail(event, parsedEmail, data) {
  const msg = createMimeMessage();
  msg.setSender({ name: "Auto-replier", addr: event.to });
  msg.setRecipient(event.from);
  msg.setSubject(`Re: ${parsedEmail.subject}`);
  msg.setHeader("In-Reply-To", parsedEmail.messageId);
  msg.addMessage({
    contentType: "text/plain",
    data: data,
  });

  var message = new EmailMessage(event.to, event.from, msg.asRaw());
  await event.reply(message);
}


async function processEmail(event, token, stlKey, stlPassword, stlEmail) {
  const rawEmail = await streamToArrayBuffer(event.raw, event.rawSize);
  const parser = new PostalMime.default();
  const parsedEmail = await parser.parse(rawEmail);
  console.log("Mail subject: ", parsedEmail.subject);
  console.log("Mail message ID", parsedEmail.messageId);
  console.log("HTML version of Email: ", parsedEmail.html);
  console.log("Text version of Email: ", parsedEmail.text);
  if (parsedEmail.attachments.length != 1) {
    await sendEmail(event, parsedEmail, "Could not parse e-mail.  Not 1 attachment");
    return;
  }
  const attachment = parsedEmail.attachments[0];
  const attachmentContent = attachment.content; // Assuming attachment.content is an ArrayBuffer
  const uint8Array = new Uint8Array(attachmentContent);
  const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
  const base64String = btoa(binaryString);

  // console.log("Attachment base64: ", base64String);

  // Upload to sports track live
  const trackUrl = await UploadTrack(base64String, stlKey, stlPassword, stlEmail);

  // Then to Github
  await UploadLogEntry(attachment.filename, base64String, parsedEmail.text ?? "", token, trackUrl);

  // Reply to e-mail with confirmation
  await sendEmail(event, parsedEmail, "Uploaded to github!");
  console.log("Done uploading");
}


export default {
  async email(message, env, ctx) {
    const from = message.headers.get("from");
    const allowList = ["scott@scottyob.com", "king.scott.2@gmail.com"];
    const substrMatch = allowList.map(m => from.indexOf(m) != -1);

    if (!substrMatch.some(m => m)) {
      message.setReject(`Address ${message.headers.get('from')} not allowed`);
    } else {
      await processEmail(
        message, 
        env.TOKEN,
        env.STLKEY,
        env.STLPASS,
        env.STLEMAIL,
      );
    }
  }
}

