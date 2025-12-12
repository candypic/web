import React from 'react';

const Logo = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 500 150" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      role="img" 
      aria-label="Candy Pic Logo"
    >
      <text 
        x="50%" 
        y="80" 
        textAnchor="middle" 
        fontFamily="'Century Gothic', 'Montserrat', sans-serif" 
        fontWeight="bold" 
        fontSize="80"
      >
        {/* Red C */}
        <tspan fill="#FF0000">C</tspan>
        
        {/* White andy - pulled closer with dx="-10" */}
        <tspan fill="#FFFFFF" dx="-10">andy</tspan>
        
        {/* Red P - pushed away to create word gap with dx="30" */}
        <tspan fill="#FF0000" dx="30">P</tspan>
        
        {/* White ic - pulled closer with dx="-10" */}
        <tspan fill="#FFFFFF" dx="-10">ic</tspan>
      </text>

      <text 
        x="50%" 
        y="120" 
        textAnchor="middle" 
        fontFamily="'Century Gothic', 'Montserrat', sans-serif" 
        fontWeight="400" 
        fontSize="24" 
        fill="#CCCCCC" 
        letterSpacing="1"
      >
        We Capture Your Memories
      </text>
    </svg>
  );
};

export default Logo;