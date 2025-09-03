
import React from 'react';

export const GaugeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0 -20 0" />
        <path d="M12 12l0 6" />
        <path d="M16 16l-4 -4" />
    </svg>
);
