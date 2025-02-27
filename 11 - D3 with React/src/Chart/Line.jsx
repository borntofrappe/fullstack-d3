import { curveMonotoneX, line } from "d3";

export default function Line({
  data,
  xAccessor,
  yAccessor,
  interpolation,
  style,
}) {
  const lineGenerator = line()
    .x((d) => xAccessor(d))
    .y((d) => yAccessor(d))
    .curve(interpolation || curveMonotoneX);

  return (
    <path
      style={style}
      d={lineGenerator(data)}
      fill="none"
      stroke="currentColor"
    />
  );
}
