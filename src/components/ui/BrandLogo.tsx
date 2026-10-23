import React from 'react';

interface BrandLogoProps {
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 36 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Warm chocolate backdrop rounded rect */}
      <rect width="48" height="48" rx="12" fill="#382116" />
      {/* Graceful bridge arch connecting two points */}
      <path
        d="M 10 34 C 14 16, 34 16, 38 34"
        fill="none"
        stroke="#C96332"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Stylized communicating hands in terracotta & cream */}
      <circle cx="15" cy="30" r="4.5" fill="#B94E2F" />
      <circle cx="33" cy="30" r="4.5" fill="#FFF9F1" />
      <circle cx="24" cy="18" r="3" fill="#EEDCC5" />
    </svg>
  );
};
