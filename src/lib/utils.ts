import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cleanObject(obj: any) {
  const newObj: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
