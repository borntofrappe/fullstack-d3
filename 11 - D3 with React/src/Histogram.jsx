import { bin, extent, max, scaleLinear } from "d3";

import Chart from "./Chart/Chart";
import LinearGradient from "./Chart/LinearGradient";
import AxisBottom from "./Chart/AxisBottom";
import AxisLeft from "./Chart/AxisLeft";

export default function Histogram({ data, accessor, label }) {
  const numberThresholds = 8;
  const width = 250;
  const height = 100;
  const margin = {
    top: 10,
    right: 10,
    bottom: 25,
    left: 28,
  };
  const barPadding = 1;
  const strokeWidthAxis = 0.6;
  const fontSize = 7;

  const xScale = scaleLinear()
    .domain(extent(data, accessor))
    .range([0, width])
    .nice();

  const binGenerator = bin()
    .domain(xScale.domain())
    .value(accessor)
    .thresholds(numberThresholds);

  const bins = binGenerator(data);

  const yAccessor = (d) => d.length;
  const yScale = scaleLinear()
    .domain([0, max(bins, yAccessor)])
    .range([height, 0])
    .nice();

  const gradientId = `histogram-gradient-${Math.random().toString().slice(-5)}`;

  return (
    <Chart width={width} height={height} margin={margin}>
      <defs>
        <LinearGradient
          id={gradientId}
          colors={["#9c85f7", "#d0c7f4"]}
          x1="0"
          y1="0"
          x2="0"
          y2={height}
        />
      </defs>
      <g>
        {bins.map((d, index) => (
          <rect
            key={index}
            fill={`url(#${gradientId})`}
            x={xScale(d.x0) + barPadding / 2}
            width={max([0, xScale(d.x1) - xScale(d.x0) - barPadding])}
            y={yScale(yAccessor(d))}
            height={height - yScale(yAccessor(d))}
          />
        ))}
      </g>

      <AxisBottom
        scale={xScale}
        width={width}
        height={height}
        label={label}
        styleTicks={{ fill: "#9da09c", fontSize: fontSize * 0.9 }}
        styleLabel={{ fill: "#9da09c", fontSize: fontSize }}
        styleLine={{ stroke: "#9da09c", strokeWidth: strokeWidthAxis }}
      />

      <AxisLeft
        scale={yScale}
        width={width}
        height={height}
        label="Count"
        styleTicks={{ fill: "#9da09c", fontSize: fontSize * 0.9 }}
        styleLabel={{ fill: "#9da09c", fontSize: fontSize }}
        styleLine={{ stroke: "#9da09c", strokeWidth: strokeWidthAxis }}
      />
    </Chart>
  );
}
