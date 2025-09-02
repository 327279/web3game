import React from 'react';

const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.056-4.335A9.75 9.75 0 015.25 6.75a9.75 9.75 0 0113.5 0 9.75 9.75 0 01-2.31 7.665A9.75 9.75 0 0116.5 18.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25v5.25m-4.5-5.25v5.25m9-5.25v5.25M9 6.75h6M9 6.75a2.25 2.25 0 01-2.25-2.25V3.75a2.25 2.25 0 012.25-2.25h6a2.25 2.25 0 012.25 2.25v.75a2.25 2.25 0 01-2.25 2.25" />
    </svg>
);

export default TrophyIcon;
