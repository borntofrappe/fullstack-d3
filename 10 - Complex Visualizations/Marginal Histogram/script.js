async function drawMarginalHistogram() {
  const dataset = await d3.json('../../nyc_weather_data.json');

  const xAccessor = d => d.temperatureMin;
  const yAccessor = d => d.temperatureMax;

  const dimensions = {
    width: 600,
    height: 600,
    margin: {
      top: 10,
      right: 10,
      bottom: 50,
      left: 50,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);


  const domain = d3.extent([...dataset.map(xAccessor), ...dataset.map(yAccessor)])
  const xScale = d3
    .scaleLinear()
    .domain(domain)
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain(domain)
    .range([dimensions.boundedHeight, 0])
    .nice();


  const wrapper = d3
    .select('#wrapper')
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height)
    .attr('viewBox', [0, 0, dimensions.width, dimensions.height]);

  const bounds = wrapper
    .append('g')
    .attr(
      'transform',
      `translate(${dimensions.margin.left} ${dimensions.margin.top})`
    );

  bounds
      .append('rect')
      .attr('class', 'color-background')
      .attr('fill', 'currentColor')
      .attr('width', dimensions.boundedWidth)
      .attr('height', dimensions.boundedHeight)

  const axisGroup = bounds.append('g')
  const circlesGroup = bounds.append('g')

  circlesGroup
    .selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('r', 5)
    .attr('cx', d => xScale(xAccessor(d)))
    .attr('cy', d => yScale(yAccessor(d)))
    .attr('fill', 'cornflowerblue');


  const xAxisGenerator = d3.axisBottom().scale(xScale);
  const xAxisGroup = axisGroup
    .append('g')
    .attr('transform', `translate(0 ${dimensions.boundedHeight})`)
    .call(xAxisGenerator);

  xAxisGroup
    .append('text')
    .text('Minimum Temperature (°F)')
    .attr('x', dimensions.boundedWidth / 2)
    .attr('y', dimensions.margin.bottom - 10)
    .attr('font-size', 14)
    .attr('fill', 'currentColor');

  const yAxisGenerator = d3.axisLeft().scale(yScale);
  const yAxisGroup = axisGroup.append('g').call(yAxisGenerator);

  yAxisGroup
    .append('text')
    .text('Maximum Temperature (°F)')
    .attr('transform', `translate(${-dimensions.margin.left + 15} ${dimensions.boundedHeight / 2}) rotate(-90)`)
    .style('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', 'currentColor')

  axisGroup
      .selectAll('g.tick text')
      .attr('font-size', 10)

      
}

drawMarginalHistogram();
