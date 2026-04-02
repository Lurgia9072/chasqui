import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Heading } from './Heading';
import { Text } from './Text';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const PageHeader = ({ title, description, action, className }: PageHeaderProps) => {
  return (
    <div className={cn('mb-8 flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-0', className)}>
      <div className="space-y-1">
        <Heading level={2}>{title}</Heading>
        {description && <Text variant="muted">{description}</Text>}
      </div>
      {action && <div className="flex shrink-0 items-center space-x-3">{action}</div>}
    </div>
  );
};
