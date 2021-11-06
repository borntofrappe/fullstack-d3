const {
  json,
  select,
  scaleLinear,
  extent,
  bin,
  max,
  transition,
  mean,
  axisBottom,
} = d3;

async function drawBarChart() {
  /* ACCESS DATA
  the accessor function depends on the metric of the individual bar chart
  */
  const dataset = await json("../../nyc_weather_data.json");

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 600,
    height: 400,
    margin: {
      top: 30,
      right: 15,
      bottom: 50,
      left: 25,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* DRAW DATA (STATIC) */
  const wrapper = select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  wrapper.attr("role", "figure").attr("tabindex", "0");

  wrapper.append("title");

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const binsGroup = bounds.append("g");
  const axisGroup = bounds.append("g");
  const meanGroup = bounds.append("g");

  axisGroup
    .append("text")
    .style("text-transform", "capitalize")
    .attr("text-anchor", "middle")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.boundedHeight + dimensions.margin.bottom - 10)
    .attr("font-size", 15)
    .attr("fill", "currentColor");

  const xAxisGroup = axisGroup
    .append("g")
    .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`);

  meanGroup
    .append("path")
    .attr("stroke", "maroon")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", 6);

  binsGroup
    .attr("id", "bins")
    .attr("role", "list")
    .attr("tabindex", "0")
    .attr("aria-label", "Histogram bars");

  meanGroup
    .append("text")
    .attr("fill", "maroon")
    .style("font-size", 12)
    .style("font-family", "sans-serif");

  function drawHistogram(metric) {
    /* ACCESS DATA */
    const metricAccessor = (d) => d[metric];
    const yAccessor = (d) => d.length;

    /* SCALES */
    const xScale = scaleLinear()
      .domain(extent(dataset, metricAccessor))
      .range([0, dimensions.boundedWidth])
      .nice();

    const binGenerator = bin()
      .domain(xScale.domain())
      .value(metricAccessor)
      .thresholds(12);

    const bins = binGenerator(dataset);

    const yScale = scaleLinear()
      .domain([0, max(bins, yAccessor)])
      .range([dimensions.boundedHeight, 0])
      .nice();

    /* DRAW DATA (DYNAMIC) */
    wrapper
      .select("title")
      .text(
        `Histogram plotting the distribution of ${metric} for the city of New York and in 2016`
      );

    const exitTransition = transition().duration(500);

    const updateTransition = exitTransition.transition().duration(1000);

    const enterTransition = updateTransition.transition().duration(1000);

    const barPadding = 4;

    const binGroups = binsGroup.selectAll("g").data(bins);
    const newBinGroups = binGroups.enter().append("g");
    const oldBinGroups = binGroups.exit();

    oldBinGroups.transition(exitTransition).remove();

    oldBinGroups
      .select("text")
      .transition(exitTransition)
      .attr("y", dimensions.boundedHeight)
      .style("opacity", 0);

    oldBinGroups
      .select("rect")
      .attr("fill", "red")
      .transition(exitTransition)
      .attr("y", dimensions.boundedHeight)
      .attr("height", 0);

    newBinGroups
      .attr("role", "listitem")
      .attr("tabindex", "0")
      .merge(binGroups)
      .attr(
        "aria-label",
        (d) =>
          `The metric ${metric} was observed between the values of ${
            d.x0
          } and ${d.x1} for a total of ${yAccessor(d)} times`
      );

    newBinGroups
      .filter(yAccessor)
      .append("text")
      .text((d) => yAccessor(d))
      .attr("x", (d) => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "darkslategrey")
      .style("font-size", 12)
      .style("font-family", "sans-serif")
      .attr("y", dimensions.boundedHeight)
      .style("opacity", 0)
      .transition(enterTransition)
      .style("opacity", 1)
      .attr("y", (d) => yScale(yAccessor(d)) - 5);

    newBinGroups
      .append("rect")
      .attr("x", (d) => xScale(d.x0) + barPadding / 2)
      .attr("width", (d) => max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
      .attr("fill", "cornflowerblue")
      .attr("y", dimensions.boundedHeight)
      .attr("height", 0)
      .attr("fill", "yellowgreen")
      .transition(enterTransition)
      .attr("y", (d) => yScale(yAccessor(d)))
      .attr("height", (d) => dimensions.boundedHeight - yScale(yAccessor(d)))
      .transition()
      .attr("fill", "cornflowerblue");

    binGroups
      .filter(yAccessor)
      .select("text")
      .text((d) => yAccessor(d))
      .transition(updateTransition)
      .attr("x", (d) => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
      .attr("y", (d) => yScale(yAccessor(d)) - 5);

    binGroups
      .select("rect")
      .transition(updateTransition)
      .attr("x", (d) => xScale(d.x0) + barPadding / 2)
      .attr("width", (d) => max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
      .attr("y", (d) => yScale(yAccessor(d)))
      .attr("height", (d) => dimensions.boundedHeight - yScale(yAccessor(d)));

    const meanValue = mean(dataset, metricAccessor);

    meanGroup
      .transition(enterTransition)
      .delay(100)
      .style("transform", `translate(${xScale(meanValue)}px, 0px)`);

    meanGroup.select("path").attr("d", `M 0 0 V ${dimensions.boundedHeight}`);

    meanGroup.select("text").text("Mean").attr("x", 5).attr("y", 5);

    /* PERIPHERALS */
    const xAxisGenerator = axisBottom().scale(xScale);
    xAxisGroup.selectAll("*").remove();

    xAxisGroup.call(xAxisGenerator);

    axisGroup.select("text").text(metric);
  }

  const metrics = [
    "windSpeed",
    "moonPhase",
    "dewPoint",
    "humidity",
    "uvIndex",
    "windBearing",
    "temperatureMin",
    "temperatureMax",
  ];

  let indexMetric = 0;

  drawHistogram(metrics[indexMetric]);

  select("#wrapper")
    .append("button")
    .text("Change metric")
    .on("click", () => {
      indexMetric = (indexMetric + 1) % metrics.length;
      drawHistogram(metrics[indexMetric]);
    });
}

drawBarChart();
