import baseConfig from '../../packages/ui/tailwind.config.js';
export default {
  ...baseConfig,
  content: ['./src/**/*.{js,jsx}', './index.html', '../../packages/ui/src/**/*.{js,jsx}'],
};
