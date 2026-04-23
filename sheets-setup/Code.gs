// Google Apps Script for the invite RSVP web app.
// Receives POST requests from the landing page and appends a row to the sheet.

const SHEET_NAME = 'RSVPs';
// Optional shared secret. If you set this, also set the same value in app.js as RSVP_SECRET.
// Leave empty to skip the check (less spam protection but easier to set up).
const SHARED_SECRET = '';

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (_) { data = {}; }
    }
    if ((!data || Object.keys(data).length === 0) && e && e.parameter) {
      data = e.parameter;
    }

    if (SHARED_SECRET && data.secret !== SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    // Honeypot — real users don't fill this hidden field. Bots often do.
    if (data.website) {
      return jsonResponse({ ok: true });
    }

    const name = String(data.name || '').trim().slice(0, 80);
    const plus = clampInt(data.plus, 0, 2);
    const dinner = !!data.dinner;
    const hang = !!data.hang;

    if (!name) return jsonResponse({ ok: false, error: 'name required' });
    if (!dinner && !hang) return jsonResponse({ ok: false, error: 'pick at least one' });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
      || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    const now = new Date();
    const tz = Session.getScriptTimeZone();
    const dateStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
    const timeStr = Utilities.formatDate(now, tz, 'HH:mm');

    sheet.appendRow([
      dateStr,
      timeStr,
      name,
      plus,
      dinner ? 'Yes' : '',
      hang ? 'Yes' : '',
      1 + plus,
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  // Quick health check you can hit in a browser to confirm deployment works.
  return jsonResponse({ ok: true, hint: 'POST JSON to submit an RSVP' });
}

function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
