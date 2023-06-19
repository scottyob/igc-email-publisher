import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import { Octokit } from "octokit";

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

async function UploadLogEntry(filename, igc, comment, token) {
  const content = igc;
  const path = filename.slice(0, filename.lastIndexOf('.'));

  console.log("TODO:  Upload markdown for ", comment);

  const octokit = new Octokit({
    auth: token
  });

  await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    owner: 'scottyob',
    repo: 'paragliding-logbook',
    path: `flights/${path}/${filename}`,
    message: `Added flight ${path}`,
    content: content,
    committer: {
      name: "Email IGC Uploader",
      email: "logbook@scottyob.com",
    },
    author: {
      name: "Email IGC Uploader",
      email: "logbook@scottyob.com",
    },
  });
  console.log("Done committing");
}

async function processEmail(event, token) {
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

  console.log("Attachment base64: ", base64String);

  await UploadLogEntry(attachment.filename, base64String, parsedEmail.text ?? "", token);

  // Upload the attachment to github
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
      await processEmail(message, env.TOKEN);
    }
  }
}

