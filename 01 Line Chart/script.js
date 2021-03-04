async function drawLineChart() {
  /* ACCESS DATA */
  const dataset = await d3.json('../nyc_weather_data.json');

  const dateParser = d3.timeParse('%Y-%m-%d');

  const xAccessor = d => dateParser(d.date);
  const yAccessor = d => d.temperatureMax;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 700,
    height: 400,
    margin: {
      top: 10,
      right: 10,
      bottom: 20,
      left: 20,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  /* DRAW DATA */
  const wrapper = d3
    .select('#wrapper')
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height);

  const bounds = wrapper
    .append('g')
    .style(
      'transform',
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const freezingTemperatureY = yScale(32);
  bounds
    .append('rect')
    .attr('x', 0)
    .attr('width', dimensions.boundedWidth)
    .attr('y', freezingTemperatureY)
    .attr('height', dimensions.boundedHeight - freezingTemperatureY)
    .attr('fill', '#e0f3f3');

  const lineGenerator = d3
    .line()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)));

  bounds
    .append('path')
    .attr('d', lineGenerator(dataset))
    .attr('fill', 'none')
    .attr('stroke', '#af9358')
    .attr('stroke-width', 2);

  /* PERIPHERALS */
  /*
  const yAxisGenerator = d3.axisLeft().scale(yScale);
  const yAxis = bounds.append('g')
  yAxisGenerator(yAxis);
  */
  const yAxisGenerator = d3.axisLeft().scale(yScale);
  bounds.append('g').call(yAxisGenerator);

  const xAxisGenerator = d3.axisBottom().scale(xScale);

  bounds
    .append('g')
    .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);
}

drawLineChart();
