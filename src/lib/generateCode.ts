export function generateNNNCode(): string { 
  const part1 = Math.floor(100 + Math.random() * 900) 
  const part2 = Math.floor(100 + Math.random() * 900) 
  return `NNN ${part1} ${part2}` 
} 
 
export function getCodeExpiry(): Date { 
  const expiry = new Date() 
  expiry.setMinutes(expiry.getMinutes() + 10) 
  return expiry 
}