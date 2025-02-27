import { extent, scaleLinear } from "d3";
import "./App.css";
import { getScatterData } from "./data";

function App() {
  const data = getScatterData();
  const xAccessor = (d) => d.humidity;
  const yAccessor = (d) => d.temperature;
  const xLabel = "Humidity";
  const yLabel = "Temperature";

  const width = 100;
  const height = 100;
  const margin = {
    top: 5,
    right: 5,
    bottom: 23,
    left: 29,
  };
  const radius = 1.3;
  const strokeWidthAxis = 0.1;
  const fontSize = 6;

  const xScale = scaleLinear()
    .domain(extent(data, xAccessor))
    .range([0, width])
    .nice();

  const yScale = scaleLinear()
    .domain(extent(data, yAccessor))
    .range([height, 0])
    .nice();

  const xTicks = xScale.ticks(Math.floor(width / 20));
  const yTicks = yScale.ticks(Math.floor(height / 15));

  const viewBox =
    "0 0 " +
    (width + margin.left + margin.right) +
    " " +
    (height + margin.top + margin.bottom);
  return (
    <>
      <header>
        <h1>Weather dahboard</h1>
      </header>

      <svg viewBox={viewBox}>
        <g transform={`translate(${margin.left} ${margin.top})`}>
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

          <g transform={`translate(0 ${height})`}>
            <g
              fill="#9da09c"
              fontSize={fontSize}
              textAnchor="middle"
              transform={`translate(0 ${fontSize * 1.5})`}
            >
              {xTicks.map((d, index) => (
                <text key={index} x={xScale(d)}>
                  {d}
                </text>
              ))}
            </g>

            <line x2={width} stroke="#bdc3c7" strokeWidth={strokeWidthAxis} />
            <text
              fill="#9da09c"
              fontSize={fontSize}
              textAnchor="middle"
              transform={`translate(${width / 2} ${margin.bottom - 3})`}
            >
              {xLabel}
            </text>
          </g>

          <g>
            <g
              fill="#9da09c"
              fontSize={fontSize}
              textAnchor="end"
              transform={`translate(${-fontSize * 0.7} 0)`}
            >
              {yTicks.map((d, index) => (
                <text key={index} y={yScale(d)}>
                  {d}
                </text>
              ))}
            </g>
            <line y2={height} stroke="#bdc3c7" strokeWidth={strokeWidthAxis} />
            <text
              fill="#9da09c"
              fontSize={fontSize}
              textAnchor="middle"
              transform={`translate(${-margin.left + fontSize + 2} ${
                height / 2
              }) rotate(-90)`}
            >
              {yLabel}
            </text>
          </g>
        </g>
      </svg>
    </>
  );
}

export default App;
