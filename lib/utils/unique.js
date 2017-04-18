'use babel';

export default function unique(array) {
  return [...new Set(array)];
}
