// @fireproof/core
import '@fireproof/core';

// polyfills
import { polyfill as polyfillBase64 } from 'react-native-polyfill-globals/src/base64';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
polyfillBase64();
polyfillEncoding();
polyfillReadableStream();
