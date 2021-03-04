async function drawScatterplot() {
  /* ACCESS DATA */
  const dataset = await d3.json('../nyc_weather_data.json');

  const xAccessor = d => d.dewPoint;
  const yAccessor = d => d.humidity;
  const colorAccessor = d => d.cloudCover;

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
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  const colorScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, colorAccessor))
    .range(['skyblue', 'darkslategrey']);

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

  bounds
    .append('g')
    .selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('cx', d => xScale(xAccessor(d)))
    .attr('cy', d => yScale(yAccessor(d)))
    .attr('r', 5)
    .attr('fill', d => colorScale(colorAccessor(d)));

  /*
  const updateSelection = bounds
    .append('g')
    .selectAll('circle')
    .data(dataset);

  const enterSelection = updateSelection.enter();

  const exitSelection = updateSelection.exit();

  enterSelection
    .append('circle')
    .attr('cx', d => xScale(xAccessor(d)))
    .attr('cy', d => yScale(yAccessor(d)))
    .attr('r', 5)
    .attr('fill', d => colorScale(colorAccessor(d)));
  */

  /*
  bounds
    .append('g')
    .selectAll('circle')
    .data(dataset)
    .join('circle')
    .attr('cx', d => xScale(xAccessor(d)))
    .attr('cy', d => yScale(yAccessor(d)))
    .attr('r', 5)
    .attr('fill', d => colorScale(colorAccessor(d)));
  */

  /*
  bounds
    .append('g')
    .selectAll('circle')
    .data(dataset)
    .join(enter =>
      enter
        .append('circle')
        .attr('cx', d => xScale(xAccessor(d)))
        .attr('cy', d => yScale(yAccessor(d)))
        .attr('r', 5)
        .attr('fill', d => colorScale(colorAccessor(d)))
    );
  */

  /* PERIPHERALS */
  const xAxisGenerator = d3.axisBottom().scale(xScale);
  const xAxis = bounds
    .append('g')
    .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  xAxis
    .append('text')
    .text('Dew point (°F)')
    .attr('x', dimensions.boundedWidth / 2)
    .attr('y', dimensions.margin.bottom - 10)
    .attr('font-size', 15)
    .attr('fill', 'currentColor');

  const yAxisGenerator = d3.axisLeft().scale(yScale);
  const yAxis = bounds.append('g').call(yAxisGenerator);

  yAxis
    .append('text')
    .text('Relative humidity')
    .attr('font-size', 15)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .style(
      'transform',
      `translate(${-dimensions.margin.left + 15}px, ${dimensions.boundedHeight /
        2}px) rotate(-90deg)`
    );
}

drawScatterplot();
