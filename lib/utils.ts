import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function rgbToHex(input: string = "") {
  if (!input) return "#000000";   
  if (input.startsWith("#")) return input;
  const match = input.match(/\d+/g);
  if (!match || match.length < 3) {
    return "#000000"; 
  }

  const [r, g, b] = match.map(Number);
  if (
    [r, g, b].some((v) => Number.isNaN(v) || v < 0 || v > 255)
  ) {
    return "#000000";
  }

  return (
    "#" +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}
