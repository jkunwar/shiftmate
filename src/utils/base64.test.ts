import { base64ToBytes } from './base64';

const encode = (text: string) => Buffer.from(text).toString('base64');
const decode = (bytes: Uint8Array) => Buffer.from(bytes).toString();

it.each(['', 'a', 'ab', 'abc', 'abcd', '%PDF-1.4 hello world!!'])('round-trips %j', (text) => {
  expect(decode(base64ToBytes(encode(text)))).toBe(text);
});

it('ignores whitespace and line breaks', () => {
  expect(decode(base64ToBytes('aGVs\nbG8g d29ybGQ='))).toBe('hello world');
});
