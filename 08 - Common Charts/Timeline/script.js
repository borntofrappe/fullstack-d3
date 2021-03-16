async function drawLineChart() {
  /* ACCESS DATA */
  const data = await d3.json('../../nyc_weather_data.json');
  const days = 100;
  const dataset = data.slice(0, days);

  const dateParser = d3.timeParse('%Y-%m-%d');

  const xAccessor = d => dateParser(d.date);
  const yAccessor = d => d.temperatureMax;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 750,
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
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

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

  const lineGenerator = d3
    .line()
    .x(d => xScale(xAccessor(d)))
    .y(d => yScale(yAccessor(d)));

  const pathId = 'line-chart-path';

  bounds
    .append('path')
    .attr('id', pathId)
    .attr('d', lineGenerator(dataset))
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 2);

  const pointsId = 'line-chart-points';
  bounds
    .append('g')
    .attr('id', pointsId)
    .style('opacity', 0)
    .selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('r', 3)
    .attr('cx', d => xScale(xAccessor(d)))
    .attr('cy', d => yScale(yAccessor(d)))
    .attr('fill', 'currentColor');

  /* PERIPHERALS */
  const axisGroup = bounds.append('g');
  const yAxisGenerator = d3
    .axisLeft()
    .scale(yScale)
    .ticks(4);
  const yAxisGroup = axisGroup.append('g').call(yAxisGenerator);

  yAxisGroup
    .append('text')
    .text('Maximum Temperature (°F)')
    .attr('text-anchor', 'middle')
    .attr('fill', 'currentColor')
    .attr('font-size', 15)
    .style(
      'transform',
      `translate(${-dimensions.margin.left + 24}px, ${dimensions.boundedHeight /
        2}px) rotate(-90deg)`
    );

  const xAxisGenerator = d3
    .axisBottom()
    .scale(xScale)
    .ticks(8);

  axisGroup
    .append('g')
    .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
    .call(xAxisGenerator);

  d3.selectAll('g.tick text').attr('font-size', 11);

  /* INTERACTIONS */
  d3.select('#wrapper')
    .append('label')
    .text('Toggle points')
    .append('input')
    .attr('type', 'checkbox')
    .on('input', event =>
      d3.select(`#${pointsId}`).style('opacity', event.target.checked ? 1 : 0)
    );

  const curves = [
    'curveLinear',
    'curveMonotoneX',
    'curveNatural',
    'curveStep',
    'curveBasis',
    'curveCardinal',
  ];

  const select = d3
    .select('#wrapper')
    .append('label')
    .text('Select interpolation curve')
    .append('select');

  select
    .selectAll('option')
    .data(curves)
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

  select.on('input', event => {
    const { value } = event.target;
    lineGenerator.curve(d3[value]);
    d3.select(`#${pathId}`).attr('d', lineGenerator(dataset));
  });
}

drawLineChart();
