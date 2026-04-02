import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import { cn } from '../../lib/utils';

interface UserAvatarProps {
  name?: string;
  src?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const UserAvatar = ({ name = 'User', src, className, size = 'md' }: UserAvatarProps) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn(sizes[size], className)}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
