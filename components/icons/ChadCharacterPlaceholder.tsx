import React from 'react';

const ChadCharacterPlaceholder: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="chadGradient" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a8ff00"/>
                <stop offset="1" stopColor="#5d8f00"/>
            </linearGradient>
        </defs>
        <path 
            d="M50 0 C65 0, 75 10, 80 25 C85 40, 95 45, 95 60 C95 75, 85 80, 80 85 L70 95 L30 95 L20 85 C15 80, 5 75, 5 60 C5 45, 15 40, 20 25 C25 10, 35 0, 50 0 Z" 
            fill="url(#chadGradient)"
        />
        <path 
            d="M35 40 H65 V45 H35 Z" 
            fill="#131313" 
        />
    </svg>
);

export default ChadCharacterPlaceholder;