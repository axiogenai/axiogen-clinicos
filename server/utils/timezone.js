/**
 * Timezone Utility for ClinicOS
 * Forces strict Indian Standard Time (Asia/Kolkata, UTC+05:30)
 */

function getISTDateStr() {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // Returns YYYY-MM-DD
  return formatter.format(now);
}

function getISTTimeString() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }); // e.g. "09:23 PM"
}

function getISTTimeInfo() {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(now);

  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);

  return {
    dateStr: `${year}-${month}-${day}`,
    hour,
    minute
  };
}

module.exports = {
  getISTDateStr,
  getISTTimeString,
  getISTTimeInfo
};
