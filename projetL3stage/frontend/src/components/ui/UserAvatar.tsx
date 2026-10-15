type Size = 'sm' | 'md' | 'lg';

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  size?: Size;
  className?: string;
}

const SIZES: Record<Size, string> = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

function getInitials(firstName?: string, lastName?: string): string {
  const a = (firstName || '').trim().charAt(0).toUpperCase();
  const b = (lastName || '').trim().charAt(0).toUpperCase();
  return (a + b) || '?';
}

export default function UserAvatar({
  firstName,
  lastName,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  return (
    <div
      className={`
        rounded-full bg-primary-soft text-primary font-semibold
        flex items-center justify-center shrink-0
        ${SIZES[size]} ${className}
      `}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}