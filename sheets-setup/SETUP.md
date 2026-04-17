# Google Sheets RSVP setup

You'll do these steps once. ~5 minutes.

## 1. Create the sheet
1. Go to https://sheets.new (creates a new Google Sheet)
2. Rename the file: **Invite RSVPs**
3. Rename the bottom tab from `Sheet1` → **RSVPs** (double-click the tab name)
4. In row 1 paste this header row across cells A1–F1:
   ```
   Timestamp	Name	Plus	Dinner	Hang	Total guests
   ```
   (or import `rsvps-template.csv` from this folder via File → Import → Upload)
5. Bold row 1 and freeze it: **View → Freeze → 1 row**

### Optional: live totals
In a free row at the top or in a second tab, you can add:
- `=COUNTA(B2:B)` → total RSVPs
- `=SUM(F2:F)` → total guests coming
- `=COUNTIF(D2:D, "Yes")` → dinner count
- `=COUNTIF(E2:E, "Yes")` → hang count

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**
2. Delete whatever's in the editor
3. Paste the entire contents of `Code.gs` (in this folder)
4. Click the **Save** icon (or Cmd+S) and name the project **Invite RSVP**

## 3. Deploy as Web App
1. Top-right → **Deploy → New deployment**
2. Click the gear ⚙ next to "Select type" → choose **Web app**
3. Settings:
   - **Description**: `RSVP endpoint v1`
   - **Execute as**: **Me (your@email.com)**
   - **Who has access**: **Anyone** ← required so guests can submit without logging in
4. Click **Deploy**
5. First time only: Google asks for permissions. Click **Authorize access** → pick your account → "Advanced" → "Go to Invite RSVP (unsafe)" → **Allow**. (It calls it "unsafe" because it's your own unverified script. Safe.)
6. Copy the **Web app URL** that appears. It looks like:
   ```
   https://script.google.com/macros/s/AKfy...long.../exec
   ```

## 4. Test it
Open that URL in your browser. You should see:
```json
{"ok":true,"hint":"POST JSON to submit an RSVP"}
```
If you see that, the deployment works.

## 5. Send me the URL
Paste it in our chat and I'll wire up app.js to submit to it.

---

## Future updates to the script
If you change `Code.gs` later: **Deploy → Manage deployments** → pencil icon → **Version: New version** → Deploy. The URL stays the same.
