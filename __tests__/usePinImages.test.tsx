/**
 * @format
 */

import type {ReactElement} from 'react';
import {View} from 'react-native';
import {captureRef} from 'react-native-view-shot';
import ReactTestRenderer from 'react-test-renderer';
import {usePinImages} from '../src/map/usePinImages';
import {lightTheme} from '../src/theme/colors';

jest.mock('react-native-view-shot', () => ({
  __esModule: true,
  captureRef: jest.fn(),
}));

const mockCaptureRef = captureRef as jest.MockedFunction<typeof captureRef>;

// Under react-test-renderer a `<View>` ref is the component instance, so a
// capture host still carries the props it was rendered with. That's what lets
// a capture be traced back to the pin it was for — the thing that goes wrong
// when two of them overlap.
const uriOf = (host: unknown) => {
  const {children} = (host as {props: {children: ReactElement}}).props;
  const {icon} = children.props as {icon: string | null};
  return `data:image/png;base64,${icon ?? 'plain'}`;
};

/** The data URI the hook last registered for each icon it was handed. */
const drawn: Record<string, string | undefined> = {};

function Harness({icons}: {icons: readonly string[]}) {
  const {images, rasterizer, imageNameFor} = usePinImages(lightTheme, icons);
  for (const icon of icons) {
    const entry = images[imageNameFor(icon)];
    drawn[icon] =
      typeof entry === 'object' && 'source' in entry
        ? // Every entry this hook builds carries a `{uri}` source.
          (entry.source as {uri?: string}).uri
        : undefined;
  }
  return rasterizer;
}

/** Renders the rasterizer and lays out every capture host in one tick. */
async function layOutPins(icons: readonly string[]) {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<Harness icons={icons} />);
  });
  const renderer = tree as ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    for (const host of renderer.root.findAllByType(View)) {
      host.props.onLayout?.();
    }
  });
}

/** Runs the frame the capture queue waits on, then settles React. */
async function flushFrame() {
  await ReactTestRenderer.act(async () => {
    jest.runOnlyPendingTimers();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  for (const icon of Object.keys(drawn)) delete drawn[icon];
});

afterEach(() => {
  jest.useRealTimers();
});

test('captures pins one at a time', async () => {
  // Captures that stay in flight until released. The bug this guards against
  // is invisible to a mock that resolves immediately: react-native-view-shot's
  // Android module compresses every snapshot through one static byte buffer, so
  // two captures running at once come back holding each other's bytes.
  const releases: (() => void)[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  mockCaptureRef.mockImplementation(host => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    return new Promise(resolve => {
      releases.push(() => {
        inFlight -= 1;
        resolve(uriOf(host));
      });
    });
  });

  // The plain pin plus three icons: four hosts, all laid out in the same tick.
  await layOutPins(['🛏️', '🌲', '🍽']);
  await flushFrame();

  expect(mockCaptureRef).toHaveBeenCalledTimes(1);
  expect(maxInFlight).toBe(1);

  // Each finished capture lets exactly one more start, never two.
  for (let done = 1; done < 4; done += 1) {
    await ReactTestRenderer.act(async () => {
      releases[done - 1]();
    });
    await flushFrame();
    expect(mockCaptureRef).toHaveBeenCalledTimes(done + 1);
    expect(maxInFlight).toBe(1);
  }
});

test('registers each pin under the name of the icon it drew', async () => {
  mockCaptureRef.mockImplementation(host => Promise.resolve(uriOf(host)));

  await layOutPins(['🛏️', '🌲', '🍽']);
  // One capture per frame, and each one re-renders with the next pin to draw.
  for (let i = 0; i < 8; i += 1) await flushFrame();

  expect(drawn).toEqual({
    '🛏️': 'data:image/png;base64,🛏️',
    '🌲': 'data:image/png;base64,🌲',
    '🍽': 'data:image/png;base64,🍽',
  });
});
