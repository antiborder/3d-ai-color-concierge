import MixedLightSlide from '../MixedLightSlide';

// Narration: backend/app/services/prompts/topics/blue_green_cyan.py
const BlueGreenCyan = () => (
  <MixedLightSlide
    topicId="blue_green_cyan"
    single={{ nm: 485, color: '#0090b8', labelKey: 'cyanLight' }}
    mix={[
      { nm: 450, color: '#2a3cff', labelKey: 'blueLight' },
      { nm: 520, color: '#00a040', labelKey: 'greenLight' },
    ]}
    // each total is drawn from the light that contributes most to it
    mixLines={{ kind: 'total', levelFrom: { L: 1, M: 1, S: 0 } }}
  />
);

export default BlueGreenCyan;
