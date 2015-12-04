export default function mod (x, _n) {
  const n = _n | 0;
  return ((x%n)+n)%n;
}