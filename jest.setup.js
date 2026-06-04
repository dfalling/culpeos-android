jest.mock('react-native-encrypted-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('react-native-image-picker', () => ({
  __esModule: true,
  launchImageLibrary: jest.fn(() => Promise.resolve({didCancel: true})),
  launchCamera: jest.fn(() => Promise.resolve({didCancel: true})),
}));

jest.mock('@bam.tech/react-native-image-resizer', () => ({
  __esModule: true,
  default: {
    createResizedImage: jest.fn(() =>
      Promise.resolve({uri: 'file:///resized.jpg', size: 1024}),
    ),
  },
}));

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const passthrough = name => {
    const Component = React.forwardRef(({children}, _ref) =>
      React.createElement('View', {testID: name}, children),
    );
    Component.displayName = name;
    return Component;
  };
  return {
    __esModule: true,
    Map: passthrough('Map'),
    Camera: passthrough('Camera'),
    UserLocation: passthrough('UserLocation'),
    LocationManager: {
      requestPermissions: jest.fn(() => Promise.resolve(false)),
    },
    useCurrentPosition: () => null,
  };
});
