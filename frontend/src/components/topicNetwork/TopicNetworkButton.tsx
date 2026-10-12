import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

/** Opens the 3D network of all topics; sits next to the language selector */
const TopicNetworkButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      onClick={onClick}
      title={t('topicNetwork.open')}
      aria-label={t('topicNetwork.open')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.5">
          <line x1="6" y1="6" x2="17" y2="8" />
          <line x1="6" y1="6" x2="8" y2="18" />
          <line x1="17" y1="8" x2="8" y2="18" />
          <line x1="17" y1="8" x2="19" y2="17" />
          <line x1="8" y1="18" x2="19" y2="17" />
        </g>
        <g fill="currentColor">
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="17" cy="8" r="2.5" />
          <circle cx="8" cy="18" r="2.5" />
          <circle cx="19" cy="17" r="2" />
        </g>
      </svg>
    </Button>
  );
};

// Matches the height and look of the language selector button
const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 35px;
  padding: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
`;

export default TopicNetworkButton;
