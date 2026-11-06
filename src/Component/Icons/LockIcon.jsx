import React from "react";

const LockIcon = ({ className = "w-4 h-4", ...props }) => {
    return (
        <svg
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            {/* Shackle */}
            <path
                d="M127 219V128C127 57.3075 184.708 0 256 0C327.292 0 385 57.3075 385 128V219H336V128C336 83.8172 300.183 48 256 48C211.817 48 176 83.8172 176 128V219H127Z"
                fill="#D8DBE2"
            />
            {/* Lock Body */}
            <rect
                x="79"
                y="219"
                width="354"
                height="293"
                rx="32"
                fill="#A7AFBA"
            />
            {/* Keyhole */}
            <path
                d="M256 300C236.118 300 220 316.118 220 336C220 348.653 226.541 359.78 236.438 366.195L227 431H285L275.562 366.195C285.459 359.78 292 348.653 292 336C292 316.118 275.882 300 256 300Z"
                fill="#D8DBE2"
            />
            {/* Decorative rivets/dots */}
            <circle cx="340" cy="461" r="8.5" fill="#D8DBE2" opacity="0.5" />
            <circle cx="374" cy="427" r="8.5" fill="#D8DBE2" opacity="0.5" />
        </svg>
    );
};

export default LockIcon;
