import { useTranslation } from 'react-i18next';

interface PlaceholderSlideProps {
  contentId: string;
}

// Title-only slide for topics whose diagram has not been drawn yet.
// The AI explains the topic verbally while this is shown.
const PlaceholderSlide = ({ contentId }: PlaceholderSlideProps) => {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '40px 8px', fontFamily: 'sans-serif' }}>
      <h3
        style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {t(`educational.${contentId}.title`)}
      </h3>
    </div>
  );
};

export default PlaceholderSlide;
