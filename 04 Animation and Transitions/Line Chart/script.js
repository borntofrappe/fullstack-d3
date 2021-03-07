async function drawLineChart() {
  /* ACCESS DATA */
  const dataset = await d3.json('../../nyc_weather_data.json');
  const dateParser = d3.timeParse('%Y-%m-%d');

  const xAccessor = d => dateParser(d.date);
  const yAccessor = d => d.temperatureMax;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 1200,
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

  /* DRAW DATA (STATIC) */
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

  bounds
    .append('defs')
    .append('clipPath')
    .attr('id', 'bounds-clip-path')
    .append('rect')
    .attr('width', dimensions.boundedWidth)
    .attr('height', dimensions.boundedHeight);

  const rectangle = bounds
    .append('g')
    .append('rect')
    .attr('x', 0)
    .attr('y', dimensions.boundedHeight)
    .attr('width', dimensions.boundedWidth)
    .attr('height', 0)
    .attr('fill', '#e0f3f3');

  const axisGroup = bounds.append('g');
  const xAxisGroup = axisGroup
    .append('g')
    .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`);

  const yAxisGroup = axisGroup.append('g');

  const lineGroup = bounds
    .append('g')
    .attr('clip-path', 'url(#bounds-clip-path)');

  const line = lineGroup
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', '#af9358')
    .attr('stroke-width', 2);

  function drawDays(data) {
    /* SCALES */
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data.slice(1), xAccessor))
      .range([0, dimensions.boundedWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, yAccessor))
      .range([dimensions.boundedHeight, 0]);

    const lineGenerator = d3
      .line()
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)));


    /* DRAW DATA (DYNAMIC) */
    const transition = d3.transition().duration(1000);

    const freezingTemperatureY = d3.min([dimensions.boundedHeight, yScale(32)]);
    rectangle
      .transition(transition)
      .attr('y', freezingTemperatureY)
      .attr('height', dimensions.boundedHeight - freezingTemperatureY);

    const lastTwoPoints = data.slice(-2);
    const pixelsBetweenLastPoints =
      xScale(xAccessor(lastTwoPoints[1])) - xScale(xAccessor(lastTwoPoints[0]));

    line
      .attr('d', lineGenerator(data))
      .style('transform', `translate(${pixelsBetweenLastPoints}px, 0px)`)
      .transition(transition)
      .style('transform', 'none');

    const yAxisGenerator = d3.axisLeft().scale(yScale);
    yAxisGroup.transition(transition).call(yAxisGenerator);

    const xAxisGenerator = d3.axisBottom().scale(xScale);
    xAxisGroup.transition(transition).call(xAxisGenerator);
  }

  let initialDay = 0;
  const days = 100;
  drawDays(dataset.slice(initialDay, initialDay + days));

  setInterval(() => {
    initialDay = (initialDay + 1) % (dataset.length - days);
    drawDays(dataset.slice(initialDay, initialDay + days));
  }, 1500);
}

drawLineChart();
