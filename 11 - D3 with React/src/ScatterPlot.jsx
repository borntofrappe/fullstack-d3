import { extent, scaleLinear } from "d3";

import Chart from "./Chart/Chart";
import AxisBottom from "./Chart/AxisBottom";
import AxisLeft from "./Chart/AxisLeft";

export default function ScatterPlot({
  data,
  xAccessor,
  yAccessor,
  xLabel,
  yLabel,
}) {
  const width = 100;
  const height = 100;
  const margin = {
    top: 5,
    right: 5,
    bottom: 18,
    left: 20,
  };
  const radius = 1.3;
  const strokeWidthAxis = 0.1;
  const fontSize = 4.2;

  const xScale = scaleLinear()
    .domain(extent(data, xAccessor))
    .range([0, width])
    .nice();

  const yScale = scaleLinear()
    .domain(extent(data, yAccessor))
    .range([height, 0])
    .nice();

  return (
    <Chart width={width} height={height} margin={margin}>
      <g fill="#9980fa">
        {data.map((value, index) => (
          <circle
            key={index}
            r={radius}
            cx={xScale(xAccessor(value))}
            cy={yScale(yAccessor(value))}
          />
        ))}
      </g>

      <AxisBottom
        scale={xScale}
        width={width}
        height={height}
        label={xLabel}
        styleTicks={{ fill: "#9da09c", fontSize: fontSize * 0.9 }}
        styleLabel={{ fill: "#9da09c", fontSize: fontSize }}
        styleLine={{ stroke: "#9da09c", strokeWidth: strokeWidthAxis }}
      />

      <AxisLeft
        scale={yScale}
        width={width}
        height={height}
        label={yLabel}
        styleTicks={{ fill: "#9da09c", fontSize: fontSize * 0.9 }}
        styleLabel={{ fill: "#9da09c", fontSize: fontSize }}
        styleLine={{ stroke: "#9da09c", strokeWidth: strokeWidthAxis }}
      />
    </Chart>
  );
}
