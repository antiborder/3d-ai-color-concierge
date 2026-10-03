import MixedLightSlide from '../MixedLightSlide';

// Narration: backend/app/services/prompts/topics/red_green_yellow.py
// 510 nm green + 620 nm red gives about the same L/M/S responses as 575 nm yellow light.
const RedGreenYellow = () => (
  <MixedLightSlide
    topicId="red_green_yellow"
    single={{ nm: 575, color: '#c8a000', labelKey: 'yellowLight' }}
    mix={[
      { nm: 510, color: '#00a040', labelKey: 'greenLight' },
      { nm: 620, color: '#e01a00', labelKey: 'redLight' },
    ]}
    // green's responses go to the left Y axis, then red's to the right Y axis
    mixLines={{ kind: 'split' }}
  />
);

export default RedGreenYellow;
