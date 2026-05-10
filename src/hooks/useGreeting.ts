export function useGreeting(firstName: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${firstName}`
  if (h < 17) return `Good afternoon, ${firstName}`
  return `Good evening, ${firstName}`
}
