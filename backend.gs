/**
 * ExamFlow Google Apps Script Backend (SECURED JWT VERSION)
 */

const FIREBASE_WEB_API_KEY = "AIzaSyBu1CD5Kv55e0avayUUyAbDFC_ek4lEgJM"; 
const FOLDER_NAME = "ExamFlow_Heavy_Data";

// SECURITY WHITELIST: Array of authorized Firebase UIDs
const ALLOWED_ADMIN_UIDS = [
  "YOUR_FIREBASE_UID_HERE" // <-- Replace this with your exact UID
];

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const providedToken = request.token;
    
    // 1. Verify Cryptographic Token via Google Identity Servers
    const apiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`;
    const tokenCheckResponse = UrlFetchApp.fetch(apiUrl, {
       method: 'post',
       contentType: 'application/json',
       payload: JSON.stringify({ idToken: providedToken }),
       muteHttpExceptions: true
    });
    
    const verificationData = JSON.parse(tokenCheckResponse.getContentText());
    
    // 2. Reject if token is expired, fake, or malformed
    if (verificationData.error) {
       return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Cryptographic handhshake failed. Token invalid." }))
         .setMimeType(ContentService.MimeType.JSON).setHeaders(getCorsHeaders());
    }
    
    // 3. Extract the mathematically verified UID
    const verifiedUID = verificationData.users[0].localId;
    
    // 4. Reject if UID is not in the Admin Whitelist
    if (!ALLOWED_ADMIN_UIDS.includes(verifiedUID)) {
       return ContentService.createTextOutput(JSON.stringify({ status: "error", message: `UID ${verifiedUID} is not an authorized administrator.` }))
         .setMimeType(ContentService.MimeType.JSON).setHeaders(getCorsHeaders());
    }

    // --- AUTHENTICATED: PROCEED WITH FILE OPERATIONS ---
    const folder = getOrCreateFolder(FOLDER_NAME);
    
    if (action === "saveHeavyData") {
       saveJsonToFolder(folder, request.filename, request.payload);
       return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "File securely saved to Drive." }))
         .setMimeType(ContentService.MimeType.JSON).setHeaders(getCorsHeaders());
    }
    
    if (action === "patchSettings") {
       saveJsonToFolder(folder, "system_settings.json", JSON.stringify(request.payload));
       return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Settings securely backed up." }))
         .setMimeType(ContentService.MimeType.JSON).setHeaders(getCorsHeaders());
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON).setHeaders(getCorsHeaders());

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON).setHeaders(getCorsHeaders());
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT).setHeaders(getCorsHeaders());
}

function getCorsHeaders() {
  return { 
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function saveJsonToFolder(folder, filename, content) {
  const files = folder.getFilesByName(filename);
  while (files.hasNext()) files.next().setTrashed(true);
  folder.createFile(filename, content, MimeType.PLAIN_TEXT);
}
