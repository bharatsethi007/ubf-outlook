/* UBF Portal — Outlook add-in task pane (Step 1: read + display only) */
const CONFIG = {
  // Filled in Step 2 — the deployed Edge Function URL:
  endpoint: ""
};

let currentEmail = null;

Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    document.getElementById("sendBtn").addEventListener("click", sendToPortal);
    loadEmail();
  }
});

function setStatus(msg, kind) {
  const el = document.getElementById("status");
  el.textContent = msg || "";
  el.className = "status" + (kind ? " status--" + kind : "");
}

function loadEmail() {
  const item = Office.context.mailbox.item;
  const from = item.from || {};
  currentEmail = {
    subject: item.subject || "",
    fromName: from.displayName || "",
    fromEmail: from.emailAddress || "",
    receivedIso: item.dateTimeCreated ? new Date(item.dateTimeCreated).toISOString() : null,
    internetMessageId: item.internetMessageId || null,
    staffEmail: (Office.context.mailbox.userProfile && Office.context.mailbox.userProfile.emailAddress) || "",
    body: ""
  };

  document.getElementById("subject").textContent = currentEmail.subject || "(no subject)";
  document.getElementById("sender").textContent =
    (currentEmail.fromName ? currentEmail.fromName + " " : "") +
    (currentEmail.fromEmail ? "<" + currentEmail.fromEmail + ">" : "—");

  item.body.getAsync(Office.CoercionType.Text, (res) => {
    if (res.status === Office.AsyncResultStatus.Succeeded) {
      currentEmail.body = res.value || "";
      const b = currentEmail.body;
      document.getElementById("preview").textContent = b.slice(0, 1500) + (b.length > 1500 ? " …" : "");
      setStatus("Email loaded — ready to send.", "ok");
    } else {
      document.getElementById("preview").textContent = "";
      setStatus("Couldn't read the email body: " + res.error.message, "err");
    }
  });
}

async function sendToPortal() {
  if (!currentEmail) return;
  if (!CONFIG.endpoint) {
    setStatus("Backend not connected yet — that's Step 2.", "warn");
    return;
  }
  // POST wiring added in Step 2.
}
