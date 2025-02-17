const {
  json,
  extent,
  max,
  scaleLinear,
  histogram, // deprecated in favour of bin
  bin,
  select,
  mean,
  axisBottom,
} = d3;

async function drawBarCharts() {
  /* ACCESS DATA
  the accessor function depends on the metric of the individual bar chart
  */
  const dataset = await json("../nyc_weather_data.json");

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

  function drawHistogram(metric) {
    /* ACCESS DATA */
    const metricAccessor = (d) => d[metric];

    /* SCALES */
    const xScale = scaleLinear()
      .domain(extent(dataset, metricAccessor))
      .range([0, dimensions.boundedWidth])
      .nice();

    /* 
    // d3.histogram is deprecated in favour of d3.bin
    const binGenerator = histogram()
      .domain(xScale.domain())
      .value(metricAccessor)
      .thresholds(12);
    */

    const binGenerator = bin()
      .domain(xScale.domain())
      .value(metricAccessor)
      .thresholds(12);

    const bins = binGenerator(dataset);

    const yAccessor = (d) => d.length;
    const yScale = scaleLinear()
      .domain([0, max(bins, yAccessor)])
      .range([dimensions.boundedHeight, 0])
      .nice();

    /* DRAW DATA */
    const wrapper = select("#wrapper")
      .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    wrapper.attr("role", "figure").attr("tabindex", "0");

    wrapper
      .append("title")
      .text(
        `Histogram plotting the distribution of ${metric} for the city of New York and in 2016`
      );

    const bounds = wrapper
      .append("g")
      .style(
        "transform",
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );

    const binsGroup = bounds.append("g");

    binsGroup
      .attr("role", "list")
      .attr("tabindex", "0")
      .attr("aria-label", "Histogram bars");

    const barPadding = 4;
    const binGroups = binsGroup.selectAll("g").data(bins).enter().append("g");

    binGroups
      .attr("role", "listitem")
      .attr("tabindex", "0")
      .attr(
        "aria-label",
        (d) =>
          `The metric ${metric} was observed between the values of ${
            d.x0
          } and ${d.x1} for a total of ${yAccessor(d)} times`
      );

    binGroups
      .append("rect")
      .attr("x", (d) => xScale(d.x0) + barPadding / 2)
      .attr("width", (d) => max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
      .attr("y", (d) => yScale(yAccessor(d)))
      .attr("height", (d) => dimensions.boundedHeight - yScale(yAccessor(d)))
      .attr("fill", "cornflowerblue");

    const textGroups = binGroups.filter(yAccessor);

    textGroups
      .append("text")
      .attr("x", (d) => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
      .attr("y", (d) => yScale(yAccessor(d)) - 5)
      .text((d) => yAccessor(d))
      .attr("text-anchor", "middle")
      .attr("fill", "darkslategrey")
      .style("font-size", 12);

    const meanValue = mean(dataset, metricAccessor);

    const meanGroup = bounds
      .append("g")
      .style("transform", `translate(${xScale(meanValue)}px, 0px)`);

    meanGroup
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", dimensions.boundedHeight)
      .attr("stroke", "maroon")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", 6);

    meanGroup
      .append("text")
      .text("Mean")
      .attr("x", 5)
      .attr("y", 5)
      .attr("fill", "maroon")
      .style("font-size", 12)
      .style("font-family", "sans-serif");

    /* PERIPHERALS */
    const xAxisGenerator = axisBottom().scale(xScale);
    const xAxis = bounds
      .append("g")
      .style("transform", `translate(0px, ${dimensions.boundedHeight}px)`)
      .call(xAxisGenerator);

    xAxis
      .append("text")
      .text(metric)
      .style("text-transform", "capitalize")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .attr("font-size", 15)
      .attr("fill", "currentColor");

    wrapper.selectAll("text").attr("aria-hidden", "true");
  }

  // call drawHistogram to draw a bar chart for each of the following metrics
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
  metrics.forEach((metric) => drawHistogram(metric));
}

drawBarCharts();
