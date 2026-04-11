/**
 * ExamFlow Google Apps Script Backend
 * Used for storing heavy Historical Data off Firebase to save quotas.
 * 
 * Instructions:
 * 1. Go to script.google.com and create a new project.
 * 2. Paste this code.
 * 3. Click Deploy -> New Deployment -> "Web App".
 * 4. Execute as "Me", Who has access: "Anyone".
 * 5. Update GAS_URL in app.js with the given endpoint.
 */

const SECRET_KEY = "EXAMFLOW_PRO_SECURE_KEY_2026";
const FOLDER_NAME = "ExamFlow_Heavy_Data";

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    
    // Auth Check
    if (request.secretKey !== SECRET_KEY) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(getCorsHeaders());
    }
    
    const action = request.action;
    const folder = getOrCreateFolder(FOLDER_NAME);
    
    if (action === "saveHeavyData") {
       saveJsonToFolder(folder, request.filename, request.payload);
       return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "File saved to Drive." }))
         .setMimeType(ContentService.MimeType.JSON)
         .setHeaders(getCorsHeaders());
    }
    
    if (action === "patchSettings") {
       saveJsonToFolder(folder, "system_settings.json", JSON.stringify(request.payload));
       return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Settings backed up." }))
         .setMimeType(ContentService.MimeType.JSON)
         .setHeaders(getCorsHeaders());
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(getCorsHeaders());

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(getCorsHeaders());
  }
}

// Ensure CORS allows browsers to ping this API directly
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(getCorsHeaders());
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
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

function saveJsonToFolder(folder, filename, content) {
  const files = folder.getFilesByName(filename);
  while (files.hasNext()) {
    files.next().setTrashed(true);
  }
  folder.createFile(filename, content, MimeType.PLAIN_TEXT);
}
