import React from 'react';

const FlameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75a2.25 2.25 0 00-2.25 2.25c0 1.09.8 2.25 2.25 2.25s2.25-1.16 2.25-2.25A2.25 2.25 0 0012 9.75z" />
    </svg>
);

export default FlameIcon;
