jest.mock('react-native-encrypted-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const passthrough = (name) => {
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
