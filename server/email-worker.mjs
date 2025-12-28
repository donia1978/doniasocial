import "dotenv/config";
import nodemailer from "nodemailer";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || "DONIA <no-reply@localhost>";
const POLL_SECONDS = Number(process.env.POLL_SECONDS || 20);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error("Missing SMTP config (SMTP_HOST/SMTP_USER/SMTP_PASS)");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

async function sbFetch(path, method = "GET", body = null) {
  const res = await fetch(SUPABASE_URL + path, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : null,
  });

  const txt = await res.text();
  if (!res.ok) throw new Error("Supabase error " + res.status + ": " + txt);
  return txt ? JSON.parse(txt) : null;
}

function mailText(n) {
  const created = n.created_at ? String(n.created_at) : "";
  const msg = n.message ? String(n.message) : "";
  return ${msg}\n\nDate: \n\nDONIA;
}

async function runOnce() {
  // pending notifications with email_to
  const path =
    "/rest/v1/notifications" +
    "?select=id,email_to,title,message,created_at" +
    "&email_status=eq.pending" +
    "&email_to=not.is.null" +
    "&order=created_at.asc" +
    "&limit=25";

  const pending = await sbFetch(path);
  if (!pending || pending.length === 0) return 0;

  for (const n of pending) {
    const to = (n.email_to || "").trim();
    if (!to) {
      await sbFetch(/rest/v1/notifications?id=eq., "PATCH", { email_status: "skipped" });
      continue;
    }

    try {
      await transporter.sendMail({
        from: MAIL_FROM,
        to,
        subject: [DONIA] ,
        text: mailText(n),
      });

      await sbFetch(/rest/v1/notifications?id=eq., "PATCH", {
        email_status: "sent",
        email_sent_at: new Date().toISOString(),
        email_last_error: null,
      });

      console.log("SENT", n.id, "->", to);
    } catch (e) {
      await sbFetch(/rest/v1/notifications?id=eq., "PATCH", {
        email_status: "failed",
        email_last_error: String(e?.message || e),
      });
      console.log("FAILED", n.id, String(e?.message || e));
    }
  }
  return pending.length;
}

console.log("DONIA email-worker started. Poll:", POLL_SECONDS, "sec");
setInterval(async () => {
  try {
    await runOnce();
  } catch (e) {
    console.error("Loop error:", e?.message || e);
  }
}, POLL_SECONDS * 1000);

runOnce().catch((e) => console.error("Start error:", e?.message || e));
