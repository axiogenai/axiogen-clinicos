const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = 'C:\\Users\\aditya\\.gemini\\antigravity\\brain\\359ef16c-a8a1-4b94-b471-1fbae3af20b2\\ClinicOS_Commercial_Quotation_35999.html';
const pdfPath = 'C:\\Users\\aditya\\.gemini\\antigravity\\brain\\359ef16c-a8a1-4b94-b471-1fbae3af20b2\\ClinicOS_Commercial_Quotation_35999.pdf';
const downloadsPdf = 'C:\\Users\\aditya\\Downloads\\ClinicOS_Commercial_Quotation_35999.pdf';
const downloadsHtml = 'C:\\Users\\aditya\\Downloads\\ClinicOS_Commercial_Quotation_35999.html';

const possiblePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const browserPath = possiblePaths.find(p => fs.existsSync(p));

if (browserPath) {
  console.log('Found browser:', browserPath);
  const cmd = `"${browserPath}" --headless --no-sandbox --disable-gpu --no-pdf-header-footer "--print-to-pdf=${pdfPath}" "${htmlPath}"`;
  execSync(cmd);
  console.log('Successfully generated PDF at:', pdfPath);

  // Sync to Downloads
  fs.copyFileSync(pdfPath, downloadsPdf);
  fs.copyFileSync(htmlPath, downloadsHtml);
  console.log('Successfully synced PDF and HTML to Downloads folder');
} else {
  console.log('No browser executable found');
}
