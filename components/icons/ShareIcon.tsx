import React from 'react';

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.19.023.374.05.556.082a2.25 2.25 0 012.879 2.082M7.217 10.907a2.25 2.25 0 012.879-2.082m0 0a2.25 2.25 0 012.228 1.956M12 6a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm0 0v.01M12 12a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zm0 0v.01M16.783 5.093a2.25 2.25 0 100 2.186m0-2.186c-.19.023-.374.05-.556.082a2.25 2.25 0 00-2.879 2.082M16.783 5.093a2.25 2.25 0 00-2.879-2.082m0 0a2.25 2.25 0 00-2.228 1.956" />
  </svg>
);

export default ShareIcon;
