import { useEffect, useMemo, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { User, Camera, Loader2 } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square' | 'rounded';
  variant?: 'solid' | 'outline' | 'soft';
  color?: string;
  status?: 'online' | 'offline' | 'away' | 'busy' | 'none';
  className?: string;
  imageClassName?: string;
  fallback?: React.ReactNode;
  onClick?: () => void;
  onImageError?: () => void;
  onImageLoad?: () => void;
  isLoading?: boolean;
  showEditBadge?: boolean;
  onEditClick?: () => void;
  editable?: boolean;
  badgeContent?: React.ReactNode;
  tooltip?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

const statusSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
};

const statusPositionClasses = {
  circle: 'bottom-0 right-0',
  square: 'bottom-0 right-0',
  rounded: 'bottom-0 right-0',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  none: '',
};

const shapeClasses = {
  circle: 'rounded-full',
  square: 'rounded-none',
  rounded: 'rounded-lg',
};

const variantClasses = {
  solid: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  outline: 'bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400',
  soft: 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400',
};

export default function UserAvatar({
  src,
  name = '',
  email,
  size = 'md',
  shape = 'circle',
  variant = 'solid',
  color,
  status = 'none',
  className,
  imageClassName,
  fallback,
  onClick,
  onImageError,
  onImageLoad,
  isLoading = false,
  showEditBadge = false,
  onEditClick,
  editable = false,
  badgeContent,
  tooltip,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setIsImageLoading(false);
  }, [src]);

  const handleImageError = useCallback(() => {
    setImageFailed(true);
    setIsImageLoading(false);
    onImageError?.();
  }, [onImageError]);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
    onImageLoad?.();
  }, [onImageLoad]);

  const getInitials = useMemo(() => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
      return initials || '';
    }
    
    if (email && email.trim()) {
      const firstLetter = email[0]?.toUpperCase();
      return firstLetter || '';
    }
    
    return '';
  }, [name, email]);

  const getColorFromName = useMemo(() => {
    if (color) return color;
    
    const colors = [
      'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
      'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
      'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
      'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',
      'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
      'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300',
      'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300',
      'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300',
      'bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300',
      'bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300',
    ];
    
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  }, [color, name]);

  const canUseImage = Boolean(src && !imageFailed && !isLoading);
  const showInitials = !canUseImage && !isLoading && (getInitials || fallback);
  const showIcon = !canUseImage && !isLoading && !showInitials;

  const avatarContent = (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center overflow-hidden select-none transition-all duration-200',
        shapeClasses[shape],
        variant === 'solid' ? getColorFromName : variantClasses[variant],
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={tooltip}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <Loader2 className="w-1/2 h-1/2 animate-spin text-gray-500" />
        </div>
      )}

      {/* Image */}
      {canUseImage && (
        <>
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-1/3 h-1/3 animate-spin" />
            </div>
          )}
          <img
            src={src || undefined}
            alt={`${name || email || 'User'}'s avatar`}
            className={clsx(
              'w-full h-full object-cover',
              shapeClasses[shape],
              isImageLoading && 'opacity-0',
              imageClassName
            )}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </>
      )}

      {/* Initials */}
      {showInitials && !isLoading && (
        <span className="font-medium leading-none">
          {fallback || getInitials}
        </span>
      )}

      {/* Icon */}
      {showIcon && !isLoading && (
        <User className="w-1/2 h-1/2" aria-hidden="true" />
      )}

      {/* Edit Badge */}
      {(showEditBadge || editable) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick?.();
          }}
          className={clsx(
            'absolute bottom-0 right-0 rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110',
            size === 'xs' ? 'p-0.5' : size === 'sm' ? 'p-0.5' : size === 'md' ? 'p-1' : size === 'lg' ? 'p-1' : 'p-1.5'
          )}
          aria-label="Edit avatar"
        >
          {badgeContent || <Camera className={clsx(
            size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-3.5 h-3.5'
          )} />}
        </button>
      )}

      {/* Custom Badge */}
      {badgeContent && !showEditBadge && !editable && (
        <div className="absolute -top-1 -right-1">
          {badgeContent}
        </div>
      )}
    </div>
  );

  // Add status indicator
  if (status !== 'none') {
    return (
      <div className="relative inline-block">
        {avatarContent}
        <span
          className={clsx(
            'absolute block rounded-full ring-2 ring-white dark:ring-gray-900',
            statusSizeClasses[size],
            statusPositionClasses[shape],
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      </div>
    );
  }

  return avatarContent;
}

// Group Avatar for multiple users
interface GroupAvatarProps {
  users: Array<{ src?: string | null; name?: string }>;
  max?: number;
  size?: UserAvatarProps['size'];
  shape?: UserAvatarProps['shape'];
  className?: string;
}

export const GroupAvatar: React.FC<GroupAvatarProps> = ({
  users,
  max = 4,
  size = 'md',
  shape = 'circle',
  className,
}) => {
  const displayedUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={clsx('flex -space-x-2', className)}>
      {displayedUsers.map((user, index) => (
        <div
          key={index}
          className="ring-2 ring-white dark:ring-gray-900 rounded-full"
          style={{ zIndex: displayedUsers.length - index }}
        >
          <UserAvatar
            src={user.src}
            name={user.name}
            size={size}
            shape={shape}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={clsx(
            'ring-2 ring-white dark:ring-gray-900 bg-gray-200 dark:bg-gray-700',
            shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-lg' : 'rounded-none',
            'flex items-center justify-center font-medium text-gray-600 dark:text-gray-300',
            sizeClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};