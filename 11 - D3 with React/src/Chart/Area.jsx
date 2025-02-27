import { curveMonotoneX, area } from "d3";

export default function Area({
  data,
  xAccessor,
  yAccessor,
  y0Accessor,
  interpolation,
  style,
}) {
  const areaGenerator = area()
    .x((d) => xAccessor(d))
    .y0((d) => y0Accessor(d))
    .y1((d) => yAccessor(d))
    .curve(interpolation || curveMonotoneX);

  return (
    <path
      style={style}
      d={areaGenerator(data)}
      fill="currentColor"
      stroke="none"
    />
  );
}
