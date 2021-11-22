const {
  csv,
  timeParse,
  timeFormat,
  format,
  schemeSet1,
  scaleTime,
  scaleLinear,
  timeDay,
  min,
  max,
  select,
  axisLeft,
  axisBottom,
} = d3;

async function drawCandlestickChart() {
  /* ACCESS DATA */
  const dataset = await csv("./data_stock.csv");

  const dateParser = timeParse("%d-%m-%Y");
  const dateFormatter = timeFormat("%d %b");
  const valueFormatter = format(".2f");

  const xAccessor = (d) => dateParser(d.date);
  const lowAccessor = (d) => d.low;
  const highAccessor = (d) => d.high;
  const openAccessor = (d) => d.open;
  const closeAccessor = (d) => d.close;
  const gainAccessor = (d) => d.close > d.open;

  const colors = schemeSet1;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 600,
    height: 400,
    margin: {
      top: 30,
      right: 20,
      bottom: 20,
      left: 65,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = scaleTime()
    .domain([
      timeDay.offset(min(dataset, xAccessor), -1),
      timeDay.offset(max(dataset, xAccessor), 1),
    ])
    .range([0, dimensions.boundedWidth]);

  const yScale = scaleLinear()
    .domain([min(dataset, lowAccessor), max(dataset, highAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();

  /* DRAW DATA */
  const wrapper = select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  bounds
    .append("rect")
    .attr("width", dimensions.boundedWidth)
    .attr("height", dimensions.boundedHeight)
    .attr("fill", "none")
    .attr("stroke", "currentColor");

  const axisGroup = bounds.append("g");
  const candlestickGroup = bounds.append("g");
  const legendGroup = bounds.append("g");

  const candlestickGroups = candlestickGroup
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${xScale(xAccessor(d))} 0)`);

  candlestickGroups
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 2)
    .attr(
      "d",
      (d) => `M 0 ${yScale(lowAccessor(d))} V ${yScale(highAccessor(d))}`
    );

  const dayWidth =
    xScale(timeDay.offset(xAccessor(dataset[0]), 1)) -
    xScale(xAccessor(dataset[0]));
  const rectWidth = dayWidth * 0.75;

  candlestickGroups
    .append("rect")
    .attr("fill", (d) => (gainAccessor(d) ? colors[1] : colors[0]))
    .attr("x", -rectWidth / 2)
    .attr("width", rectWidth)
    .attr("y", (d) => yScale(max([openAccessor(d), closeAccessor(d)])))
    .attr("height", (d) =>
      Math.abs(yScale(openAccessor(d)) - yScale(closeAccessor(d)))
    );

  /* PERIPHERALS */
  axisGroup
    .append("text")
    .text("Monthly stock price")
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", 16)
    .attr("font-weight", "bold")
    .attr(
      "transform",
      `translate(${dimensions.boundedWidth / 2} ${-dimensions.margin.top + 20})`
    );

  const yAxisGenerator = axisLeft()
    .scale(yScale)
    .ticks(6)
    .tickSize(0)
    .tickPadding(5)
    .tickFormat((d) => `$${valueFormatter(d)}`);

  const yAxisGroup = axisGroup.append("g").call(yAxisGenerator);

  yAxisGroup
    .selectAll("g.tick")
    .append("path")
    .attr("d", `M 0 0 h ${dimensions.boundedWidth}`)
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", "0.5")
    .attr("opacity", "0.5");

  yAxisGroup
    .append("text")
    .text("Price")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", 14)
    .attr("font-weight", "bold")
    .style(
      "transform",
      `translate(${-dimensions.margin.left + 8}px, ${
        dimensions.boundedHeight / 2
      }px) rotate(-90deg)`
    );

  const xAxisGenerator = axisBottom()
    .scale(xScale)
    .ticks(5)
    .tickSize(0)
    .tickPadding(10)
    .tickFormat((d) => dateFormatter(d));

  axisGroup
    .append("g")
    .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  axisGroup.selectAll("g.tick text").attr("font-size", 11);

  const legendSize = 60;
  const legendSquareSize = 10;
  const legendsGroup = legendGroup
    .attr(
      "transform",
      `translate(${dimensions.boundedWidth / 2} ${
        dimensions.boundedHeight - legendSquareSize * 2
      })`
    )
    .selectAll("g")
    .data(["Down", "Up"])
    .enter()
    .append("g")
    .attr(
      "transform",
      (d, i, { length }) =>
        `translate(${legendSize * (i - (length - 1) / 2)} 0)`
    );

  legendsGroup
    .append("text")
    .attr("x", legendSquareSize)
    .attr("dominant-baseline", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", 14)
    .text((d) => d);

  legendsGroup
    .append("rect")
    .attr("width", legendSquareSize)
    .attr("height", legendSquareSize)
    .attr(
      "transform",
      `translate(-${legendSquareSize / 2} -${legendSquareSize / 2})`
    )
    .attr("fill", (d, i) => colors[i]);
}

drawCandlestickChart();
