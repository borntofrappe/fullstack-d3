const {
  json,
  timeParse,
  extent,
  scaleTime,
  scaleLinear,
  select,
  line,
  axisLeft,
  axisBottom,
  timeFormat,
  format,
  pointer,
  least,
} = d3;

async function drawLineChart() {
  /* ACCESS DATA */
  const data = await json('../../nyc_weather_data.json');
  const dataset = data.slice(0, 100);
  const dateParser = timeParse('%Y-%m-%d');

  const xAccessor = d => dateParser(d.date);
  const yAccessor = d => d.temperatureMax;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 850,
    height: 400,
    margin: {
      top: 10,
      right: 10,
      bottom: 20,
      left: 55,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = scaleTime()
    .domain(extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  const yScale = scaleLinear()
    .domain(extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  /* DRAW DATA */
  const wrapper = select('#wrapper')
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
    .attr('fill', 'hsl(180, 44%, 92%)');

  const lineGenerator = line()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)));

  bounds
    .append('path')
    .attr('d', lineGenerator(dataset))
    .attr('fill', 'none')
    .attr('stroke', 'hsl(41, 35%, 52%)')
    .attr('stroke-width', 2);

  /* PERIPHERALS */
  /*
  const yAxisGenerator = axisLeft().scale(yScale);
  const yAxis = bounds.append('g')
  yAxisGenerator(yAxis);
  */
  const yAxisGenerator = axisLeft().scale(yScale);
  const yAxis = bounds.append('g').call(yAxisGenerator);

  yAxis
    .append('text')
    .text('Maximum Temperature (°F)')
    .attr('text-anchor', 'middle')
    .attr('fill', 'currentColor')
    .attr('font-size', 14)
    .attr(
      'transform',
      `translate(${-dimensions.margin.left + 20} ${dimensions.boundedHeight /
        2}) rotate(-90)`
    );

  const xAxisGenerator = axisBottom().scale(xScale);

  bounds
    .append('g')
    .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  /* INTERACTIONS */
  const tooltip = select('#wrapper #tooltip');
  const tooltipCircle = bounds
    .append('circle')
    .attr('opacity', 0)
    .attr('fill', 'white')
    .attr('stroke', 'hsl(41, 35%, 52%)')
    .attr('stroke-width', 2)
    .attr('r', 4);

  function onMouseMove(event) {
    const formatDate = timeFormat('%B %A %-d, %Y');
    const formatValue = format('.1f');

    const [xHover] = pointer(event);
    const hoverDate = xScale.invert(xHover);
    const d = least(
      dataset,
      (a, b) =>
        Math.abs(xAccessor(a) - hoverDate) - Math.abs(xAccessor(b) - hoverDate)
    );
    const date = xAccessor(d);
    const value = yAccessor(d);

    const x = xScale(date);
    const y = yScale(value);

    tooltip
      .style(
        'transform',
        `translate(calc(-50% + ${x +
          dimensions.margin.left}px), calc(-100% + ${y}px - 0.5rem))`
      )
      .style('opacity', 1);

    tooltip.select('h2').text(formatDate(date));
    tooltip.select('p').text(`Maximum temperature: ${formatValue(value)} (°F)`);

    tooltipCircle
      .attr('opacity', 1)
      .attr('cx', x)
      .attr('cy', y);
  }

  function onMouseLeave() {
    tooltip.style('opacity', 0);

    tooltipCircle.attr('opacity', 0);
  }

  bounds
    .append('rect')
    .attr('width', dimensions.boundedWidth)
    .attr('height', dimensions.boundedHeight)
    .attr('fill', 'transparent')
    .on('mousemove', onMouseMove)
    .on('mouseleave', onMouseLeave);
}

drawLineChart();
