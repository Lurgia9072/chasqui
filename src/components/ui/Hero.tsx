import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Container } from './Container';
import { Heading } from './Heading';
import { Text } from './Text';

interface HeroProps {
  title: string;
  description: string;
  actions?: ReactNode;
  image?: string;
  className?: string;
  variant?: 'default' | 'centered' | 'split';
}

export const Hero = ({ title, description, actions, image, className, variant = 'default' }: HeroProps) => {
  const variants = {
    default: 'py-20 md:py-32 lg:py-40 bg-white',
    centered: 'py-20 md:py-32 lg:py-40 bg-white text-center',
    split: 'py-20 md:py-32 lg:py-40 bg-white overflow-hidden',
  };

  if (variant === 'centered') {
    return (
      <section className={cn(variants[variant], className)}>
        <Container size="md">
          <div className="space-y-8">
            <div className="space-y-4">
              <Heading level={1}>{title}</Heading>
              <Text variant="lead" className="max-w-2xl mx-auto">{description}</Text>
            </div>
            {actions && <div className="flex items-center justify-center space-x-4">{actions}</div>}
          </div>
        </Container>
      </section>
    );
  }

  if (variant === 'split') {
    return (
      <section className={cn(variants[variant], className)}>
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Heading level={1}>{title}</Heading>
                <Text variant="lead">{description}</Text>
              </div>
              {actions && <div className="flex items-center space-x-4">{actions}</div>}
            </div>
            {image && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl ring-1 ring-gray-200">
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className={cn(variants[variant], className)}>
      <Container size="lg">
        <div className="space-y-8">
          <div className="space-y-4">
            <Heading level={1}>{title}</Heading>
            <Text variant="lead" className="max-w-3xl">{description}</Text>
          </div>
          {actions && <div className="flex items-center space-x-4">{actions}</div>}
        </div>
      </Container>
    </section>
  );
};
