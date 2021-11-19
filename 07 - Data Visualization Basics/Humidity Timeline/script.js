const { json, timeParse, extent, axisLeft, axisBottom } = d3;

async function drawLineChart() {
  /* ACCESS DATA */
  const dataset = await json("../../nyc_weather_data.json");

  const dateParser = timeParse("%Y-%m-%d");

  const xAccessor = (d) => dateParser(d.date);
  const yAccessor = (d) => d.humidity;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 800,
    height: 350,
    margin: {
      top: 10,
      right: 10,
      bottom: 30,
      left: 70,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = d3
    .scaleTime()
    .domain(extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

  /* DRAW DATA */
  const wrapper = d3
    .select("#wrapper")
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
    .attr("fill", "white");

  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));

  bounds
    .append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 2);

  /* PERIPHERALS */
  const axisGroup = bounds.append("g");
  const yAxisGenerator = axisLeft().scale(yScale);
  const yAxisGroup = axisGroup.append("g").call(yAxisGenerator);
  yAxisGroup
    .selectAll("g.tick")
    .append("path")
    .attr("d", `M 0 0 H ${dimensions.boundedWidth}`)
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 0.25);

  yAxisGroup
    .append("text")
    .text("relative humidity")
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", 14)
    .style(
      "transform",
      `translate(${-dimensions.margin.left + 24}px, ${
        dimensions.boundedHeight / 2
      }px) rotate(-90deg)`
    );

  const xAxisGenerator = axisBottom().scale(xScale);

  axisGroup
    .append("g")
    .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);
}

drawLineChart();
