const AVATAR_COLORS = [
  'bg-blue-dark',
  'bg-red-dark',
  'bg-green-dark',
  'bg-orange-dark',
  'bg-teal-dark',
  'bg-magenta-dark',
  'bg-brown-dark',
  'bg-gray-dark',
] as const;

export function getPlayerAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] ?? 'bg-highlight';
}
