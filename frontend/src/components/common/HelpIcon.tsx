interface HelpIconProps {
  topic: string;
  onHelpClick: (topic: string) => void;
  size?: number;
}

const HelpIcon = ({ topic, onHelpClick, size = 26 }: HelpIconProps) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onHelpClick(topic);
    }}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0 2px',
      lineHeight: 1,
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
    }}
    aria-label={`Help: ${topic}`}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12c0 2.08.64 4.01 1.73 5.61L2 22l4.39-1.73A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
        fill="#4e8cee"
      />
      <text
        x="11"
        y="17.5"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        ?
      </text>
    </svg>
  </button>
);

export default HelpIcon;
