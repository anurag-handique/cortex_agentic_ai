import React from 'react';

const Card = ({ children, className = '', title, action, noPadding = false }) => {
    return (
        <div className={`bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-sm ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
                    {title && <h3 className="font-display font-medium text-gray-200 tracking-wide">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={noPadding ? '' : 'p-5'}>
                {children}
            </div>
        </div>
    );
};

export default Card;
