const { json, extent, scaleLinear, select, axisBottom, axisLeft } = d3;

async function drawScatterplot() {
  /* ACCESS DATA */
  const dataset = await json("../nyc_weather_data.json");

  const xAccessor = (d) => d.dewPoint;
  const yAccessor = (d) => d.humidity;
  const colorAccessor = (d) => d.cloudCover;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 600,
    height: 600,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 60,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = scaleLinear()
    .domain(extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = scaleLinear()
    .domain(extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

  const colorScale = scaleLinear()
    .domain(extent(dataset, colorAccessor))
    .range(["skyblue", "darkslategrey"]);

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

  // /* update-enter
  bounds
    .append("g")
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("fill", (d) => colorScale(colorAccessor(d)));
  /* */

  /* 
  // update-enter-exit
  const updateSelection = bounds.append("g").selectAll("circle").data(dataset);

  const enterSelection = updateSelection.enter();

  const exitSelection = updateSelection.exit();

  enterSelection
    .append("circle")
    .attr("r", 5)
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("fill", (d) => colorScale(colorAccessor(d)));
  */

  /* 
  // join
  bounds
    .append("g")
    .selectAll("circle")
    .data(dataset)
    .join("circle")
    .attr("r", 5)
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("fill", (d) => colorScale(colorAccessor(d)));
  */

  /* 
  // join with update-enter-exit
  bounds
    .append("g")
    .selectAll("circle")
    .data(dataset)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("r", 5)
          .attr("cx", (d) => xScale(xAccessor(d)))
          .attr("cy", (d) => yScale(yAccessor(d)))
          .attr("fill", (d) => colorScale(colorAccessor(d))),
      (update) => null,
      (exit) => null
    );
  */

  /* PERIPHERALS */
  const xAxisGenerator = axisBottom().scale(xScale).ticks(4);
  const xAxis = bounds
    .append("g")
    .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  xAxis
    .append("text")
    .text("Dew point (°F)")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("font-size", 15)
    .attr("fill", "currentColor");

  const yAxisGenerator = axisLeft().scale(yScale).ticks(4);
  const yAxis = bounds.append("g").call(yAxisGenerator);

  yAxis
    .append("text")
    .text("Relative humidity")
    .attr("font-size", 15)
    .attr("fill", "currentColor")
    .style("text-anchor", "middle")
    .style(
      "transform",
      `translate(${-dimensions.margin.left + 15}px, ${
        dimensions.boundedHeight / 2
      }px) rotate(-90deg)`
    );
}

drawScatterplot();
