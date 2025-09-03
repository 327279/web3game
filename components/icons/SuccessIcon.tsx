import React from 'react';

const SuccessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 90 90" {...props}>
    <g className="animate-subtle-bounce">
      <circle cx="45" cy="45" r="45" fill="#a8ff00" />
      <path
        stroke="#131313"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M28 45l12 12 22-22"
      />
    </g>
  </svg>
);

export default SuccessIcon;
