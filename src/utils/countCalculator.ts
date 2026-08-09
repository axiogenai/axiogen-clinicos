/**
 * Smart Total Count Auto-Calculator Engine for ClinicOS
 * Calculates total medicine quantity/count from frequency and duration.
 * Example: Once daily for 14 days -> Count = 14
 * Example: Tapering 7d for Tablets -> Count = 21 (14 + 7)
 * Example: Tapering 5d for Tablets -> Count = 15 (10 + 5)
 */
export function calculateMedicineCount(med: {
  frequency?: string;
  duration?: string;
  name?: string;
  count?: string | number;
  isManualCount?: boolean;
}): string {
  // Respect manual override ONLY if the doctor explicitly typed a custom count
  if (med.isManualCount && med.count !== undefined && med.count !== null && String(med.count).trim() !== '') {
    return String(med.count);
  }

  const freq = (med.frequency || '').toLowerCase().trim();
  const durStr = (med.duration || '').toLowerCase().trim();
  const name = (med.name || '').toLowerCase().trim();

  // Non-tablet topical/liquid forms -> Default 1
  if (
    name.includes('cream') ||
    name.includes('क्रीम') ||
    name.includes('मलम') ||
    name.includes('gel') ||
    name.includes('ऑइंटमेंट') ||
    name.includes('ointment') ||
    name.includes('soap') ||
    name.includes('साबण') ||
    name.includes('shampoo') ||
    name.includes('शैम्पू') ||
    name.includes('lotion') ||
    name.includes('लोशन') ||
    name.includes('syrup') ||
    name.includes('सिरप') ||
    name.includes('drops') ||
    name.includes('spray')
  ) {
    return '1';
  }

  // Parse Days from Duration string (e.g. "5 Days", "14 Days", "1 Month", "2 Weeks", "७ दिवस", "१ महिना")
  let days = 0;
  // Convert Devanagari numerals to ASCII digits if present
  const devToAscii = durStr.replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d).toString());
  const numMatch = devToAscii.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 0;

  if (durStr.includes('week') || durStr.includes('आठवड')) {
    days = num * 7;
  } else if (durStr.includes('month') || durStr.includes('महिना')) {
    days = num * 30;
  } else if (num > 0) {
    days = num;
  } else {
    days = 14; // Default 14 days
  }

  // Tapering Protocol Calculations
  if (freq.includes('taper') || freq.includes('tapper') || freq.includes('टेपरिंग') || freq.includes('तपेरिंग')) {
    if (freq.includes('5d') || freq.includes('5 day') || freq.includes('५ दिवस') || freq.includes('५')) {
      return '15'; // 5 days BD (10) + 5 days OD (5) = 15
    }
    if (freq.includes('tds') || freq.includes('तीनदा') || freq.includes('३ वेळा')) {
      return '42'; // 7 days TDS (21) + 7 days BD (14) + 7 days OD (7) = 42
    }
    // Default 7d BD -> 7d OD tapering protocol = 21 tablets
    return '21'; 
  }

  // Standard Daily Frequency Doses
  let dailyDoses = 1;

  if (
    freq.includes('twice') ||
    freq.includes('2 times') ||
    freq.includes('२ वेळा') ||
    freq.includes('दोनदा') ||
    freq.includes('सकाळी १ व रात्री १') ||
    freq.includes('सकाळी-रात्री') ||
    freq.includes('१ गोळी सकाळी १ गोळी रात्री') ||
    freq.includes('1 -- 0 -- 1') ||
    freq.includes('1-0-1') ||
    freq.includes('bd')
  ) {
    dailyDoses = 2;
  } else if (
    freq.includes('thrice') ||
    freq.includes('3 times') ||
    freq.includes('३ वेळा') ||
    freq.includes('तीनदा') ||
    freq.includes('सकाळी १, दुपारी १ व रात्री १') ||
    freq.includes('1 -- 1 -- 1') ||
    freq.includes('1-1-1') ||
    freq.includes('tds') ||
    freq.includes('tid')
  ) {
    dailyDoses = 3;
  } else if (
    freq.includes('four') ||
    freq.includes('4 times') ||
    freq.includes('४ वेळा') ||
    freq.includes('चारदा') ||
    freq.includes('1 -- 1 -- 1 -- 1') ||
    freq.includes('1-1-1-1') ||
    freq.includes('qid')
  ) {
    dailyDoses = 4;
  } else if (
    freq.includes('once daily') ||
    freq.includes('1 time') ||
    freq.includes('एकदा') ||
    freq.includes('सकाळी १') ||
    freq.includes('रात्री १') ||
    freq.includes('दुपारी १') ||
    freq.includes('1 -- 0 -- 0') ||
    freq.includes('0 -- 0 -- 1') ||
    freq.includes('bedtime') ||
    freq.includes('breakfast') ||
    freq.includes('daily') ||
    freq.includes('od') ||
    freq.includes('hs')
  ) {
    dailyDoses = 1;
  } else if (freq.includes('weekly') || freq.includes('once weekly') || freq.includes('आठवड्यातून')) {
    const weeks = Math.ceil(days / 7) || 1;
    return String(weeks);
  } else if (freq.includes('sos') || freq.includes('needed') || freq.includes('त्रास')) {
    return '5';
  } else {
    dailyDoses = 1;
  }

  const total = Math.ceil(dailyDoses * days);
  return String(total);
}
