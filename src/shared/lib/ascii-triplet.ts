export function hasRepeatedOrSequentialAsciiTriplet(value: string) {
  const characters = value.toLowerCase();
  for (let index = 0; index < characters.length - 2; index += 1) {
    const triplet = characters.slice(index, index + 3);
    if (!/^[a-z]{3}$|^[0-9]{3}$/.test(triplet)) continue;
    const first = triplet.charCodeAt(0);
    const second = triplet.charCodeAt(1);
    const third = triplet.charCodeAt(2);
    if (first === second && second === third) return true;
    if (second - first === third - second && Math.abs(second - first) === 1)
      return true;
  }
  return false;
}

