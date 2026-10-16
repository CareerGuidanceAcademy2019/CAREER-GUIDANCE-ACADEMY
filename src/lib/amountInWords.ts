/**
 * Converts a numeric amount to Indian Currency Words
 * Example: 4500 -> "Rupees Four Thousand Five Hundred Only"
 */
export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return `${b[Math.floor(n / 10)]}${digit ? ` ${a[digit]}` : ''}`;
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const rem = num % 100;

  const parts: string[] = [];
  if (crore) parts.push(`${inWords(crore)} Crore`);
  if (lakh) parts.push(`${inWords(lakh)} Lakh`);
  if (thousand) parts.push(`${inWords(thousand)} Thousand`);
  if (hundred) parts.push(`${inWords(hundred)} Hundred`);
  if (rem) parts.push(inWords(rem));

  return `Rupees ${parts.join(' ')} Only`;
}
