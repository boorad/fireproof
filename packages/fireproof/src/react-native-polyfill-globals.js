import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

// base64
// import { polyfill as polyfillBase64 } from 'react-native-polyfill-globals/src/base64';
// polyfillBase64();
import { btoa, atob } from 'react-native-quick-base64';
polyfillGlobal('atob', () => atob);
polyfillGlobal('btoa', () => btoa);


// buffer
import { Buffer } from "@craftzdog/react-native-buffer";
polyfillGlobal('buffer', () => Buffer);

// crypto
// TODO: this is successfully? handled in examples/native/metro.config.js

// encoding
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
polyfillEncoding();

// events
import { Event as EventShim } from 'event-target-shim';
polyfillGlobal('Event', () => EventShim);

// // stream
// import { Stream } from 'readable-stream';
// polyfillGlobal('stream', () => Stream);
// TODO: this is successfully handled in examples/native/metro.config.js