interface MockNftSvgProps {
  className?: string
  tokenId?: string
}

export const MockNftSvg = ({ 
  className = "w-full h-full", 
  tokenId = "0" 
}: MockNftSvgProps) => {
  // Generate colors based on tokenId for variety
  const colors = [
    { primary: '#00ff88', secondary: '#4ecdc4', accent: '#ff6b35' },
    { primary: '#ff6b35', secondary: '#00ff88', accent: '#4ecdc4' },
    { primary: '#4ecdc4', secondary: '#ff6b35', accent: '#00ff88' },
    { primary: '#9d4edd', secondary: '#f72585', accent: '#4cc9f0' },
    { primary: '#f72585', secondary: '#4cc9f0', accent: '#9d4edd' }
  ]
  
  const colorScheme = colors[parseInt(tokenId) % colors.length]
  
  return (
    <svg 
      viewBox="0 0 300 300" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background with gradient */}
      <defs>
        <linearGradient id={`bg-gradient-${tokenId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0a0f" />
          <stop offset="50%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16213e" />
        </linearGradient>
        
        <linearGradient id={`primary-gradient-${tokenId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorScheme.primary} />
          <stop offset="100%" stopColor={colorScheme.secondary} />
        </linearGradient>
        
        <filter id={`glow-${tokenId}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background */}
      <rect width="300" height="300" fill={`url(#bg-gradient-${tokenId})`} />
      
      {/* Grid pattern */}
      <defs>
        <pattern id={`grid-${tokenId}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={colorScheme.primary} strokeWidth="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="300" height="300" fill={`url(#grid-${tokenId})`} />
      
      {/* Central geometric shape */}
      <g transform="translate(150,150)" filter={`url(#glow-${tokenId})`}>
        {/* Outer ring */}
        <circle 
          cx="0" 
          cy="0" 
          r="80" 
          fill="none" 
          stroke={colorScheme.primary} 
          strokeWidth="2" 
          opacity="0.8"
        />
        
        {/* Inner hexagon */}
        <polygon 
          points="-40,0 -20,-34.6 20,-34.6 40,0 20,34.6 -20,34.6" 
          fill={`url(#primary-gradient-${tokenId})`} 
          opacity="0.7"
        />
        
        {/* Center diamond */}
        <polygon 
          points="0,-20 15,0 0,20 -15,0" 
          fill={colorScheme.accent} 
          opacity="0.9"
        />
        
        {/* Rotating elements */}
        <g>
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0"
            to="360"
            dur="10s"
            repeatCount="indefinite"
          />
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <g key={i} transform={`rotate(${angle})`}>
              <rect 
                x="60" 
                y="-2" 
                width="15" 
                height="4" 
                fill={colorScheme.secondary} 
                opacity="0.8"
              />
            </g>
          ))}
        </g>
      </g>
      
      {/* Corner accents */}
      <g opacity="0.6">
        <polygon points="0,0 30,0 0,30" fill={colorScheme.accent} />
        <polygon points="300,0 270,0 300,30" fill={colorScheme.accent} />
        <polygon points="0,300 30,300 0,270" fill={colorScheme.accent} />
        <polygon points="300,300 270,300 300,270" fill={colorScheme.accent} />
      </g>
      
      {/* Token ID display */}
      <text 
        x="150" 
        y="280" 
        textAnchor="middle" 
        fill={colorScheme.primary} 
        fontSize="16" 
        fontFamily="monospace" 
        fontWeight="bold"
        opacity="0.8"
      >
        #{tokenId}
      </text>
      
      {/* Floating particles */}
      <g opacity="0.4">
        {[...Array(8)].map((_, i) => (
          <circle 
            key={i}
            cx={50 + (i * 25)} 
            cy={50 + (i % 3) * 20} 
            r="2" 
            fill={colorScheme.primary}
          >
            <animate
              attributeName="opacity"
              values="0.4;0.8;0.4"
              dur={`${2 + (i * 0.3)}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>
    </svg>
  )
}