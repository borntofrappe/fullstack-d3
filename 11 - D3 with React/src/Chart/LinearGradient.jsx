export default function LinearGradient({
  id,
  x1 = 0,
  y1 = 0,
  x2 = 1,
  y2 = 0,
  colors = ["black", "white"],
}) {
  const stops = colors.map((color, i) => (
    <stop
      key={`${color}-${i}`}
      offset={(1 / (colors.length - 1)) * i}
      stopColor={color}
    />
  ));
  return (
    <linearGradient
      id={id}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      gradientUnits="userSpaceOnUse"
    >
      {stops}
    </linearGradient>
  );
}
