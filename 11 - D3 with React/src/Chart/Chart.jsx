export default function Chart({ width, height, margin, children }) {
  const viewBox =
    "0 0 " +
    (width + margin.left + margin.right) +
    " " +
    (height + margin.top + margin.bottom);

  return (
    <svg viewBox={viewBox}>
      <g transform={`translate(${margin.left} ${margin.top})`}>{children}</g>
    </svg>
  );
}
