import {
  curveCatmullRom,
  extent,
  scaleLinear,
  scaleTime,
  timeFormat,
} from "d3";

import LinearGradient from "./Chart/LinearGradient";
import Chart from "./Chart/Chart";
import Line from "./Chart/Line";
import Area from "./Chart/Area";
import AxisBottom from "./Chart/AxisBottom";
import AxisLeft from "./Chart/AxisLeft";

export default function Timeline({ data, xAccessor, yAccessor, label }) {
  const width = 500;
  const height = 100;
  const margin = {
    top: 10,
    right: 10,
    bottom: 15,
    left: 35,
  };
  const fontSize = 7;
  const strokeWidthAxis = 0.2;
  const strokeWidthLine = 1;

  const formatDate = timeFormat("%-b %-d");

  const xScale = scaleTime().domain(extent(data, xAccessor)).range([0, width]);

  const yScale = scaleLinear()
    .domain(extent(data, yAccessor))
    .range([height, 0])
    .nice();

  const gradientId = `timeline-gradient-${Math.random().toString().slice(-5)}`;

  return (
    <Chart width={width} height={height} margin={margin}>
      <defs>
        <LinearGradient
          id={gradientId}
          colors={["#e2def3", "#f8f9fa"]}
          x1="0"
          y1="0"
          x2="0"
          y2={height}
        />
      </defs>

      <Area
        data={data}
        xAccessor={(d) => xScale(xAccessor(d))}
        yAccessor={(d) => yScale(yAccessor(d))}
        y0Accessor={(d) => yScale(yScale.domain()[0])}
        curve={curveCatmullRom}
        style={{
          fill: `url(#${gradientId})`,
        }}
      />

      <Line
        data={data}
        xAccessor={(d) => xScale(xAccessor(d))}
        yAccessor={(d) => yScale(yAccessor(d))}
        curve={curveCatmullRom}
        style={{
          stroke: "#9980fa",
          strokeWidth: strokeWidthLine,
          strokeLinecap: "round",
        }}
      />

      <AxisBottom
        scale={xScale}
        width={width}
        height={height}
        formatTick={formatDate}
        styleTicks={{ fill: "#9da09c", fontSize: fontSize * 0.9 }}
        styleLine={{ stroke: "#9da09c", strokeWidth: strokeWidthAxis }}
      />

      <AxisLeft
        scale={yScale}
        width={width}
        height={height}
        label={label}
        styleTicks={{ fill: "#9da09c", fontSize: fontSize * 0.9 }}
        styleLabel={{ fill: "#9da09c", fontSize: fontSize }}
        styleLine={{ stroke: "#9da09c", strokeWidth: strokeWidthAxis }}
      />
    </Chart>
  );
}
