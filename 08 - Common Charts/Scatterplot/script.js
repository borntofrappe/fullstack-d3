async function drawScatterplots() {
  /* ACCESS DATA */
  const dataset = await d3.json('../../nyc_weather_data.json');

  const colorAccessor = d => d.precipIntensity;

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 500,
    height: 500,
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

  const colorScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, colorAccessor))
    .range(['skyblue', 'darkslategrey']);

  function drawScatterplot(metricX, metricY) {
    const xAccessor = d => d[metricX];
    const yAccessor = d => d[metricY];

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

    const clipPathId = `clip-path-${metricX}-${metricY}`;

    bounds
      .append('defs')
      .append('clipPath')
      .attr('id', clipPathId)
      .append('rect')
      .attr('width', dimensions.boundedWidth)
      .attr('height', dimensions.boundedHeight);

    const axisGroup = bounds.append('g');
    const dataGroup = bounds
      .append('g')
      .attr('clip-path', `url(#${clipPathId})`);

    dataGroup
      .selectAll('circle')
      .data(dataset)
      .enter()
      .append('circle')
      .attr('r', 4)
      .attr('cx', d => xScale(xAccessor(d)))
      .attr('cy', d => yScale(yAccessor(d)))
      .attr('fill', d => colorScale(colorAccessor(d)));

    const sumXSquared = dataset.reduce(
      (acc, curr) => acc + xAccessor(curr) ** 2,
      0
    );
    const sumX = dataset.reduce((acc, curr) => acc + xAccessor(curr), 0);
    const sumY = dataset.reduce((acc, curr) => acc + yAccessor(curr), 0);
    const sumXY = dataset.reduce(
      (acc, curr) => acc + xAccessor(curr) * yAccessor(curr),
      0
    );

    const { length: n } = dataset;
    const m = (n * sumXY - sumX * sumY) / (n * sumXSquared - sumX ** 2);
    const q = (sumY - m * sumX) / n;

    // y = m * x + q
    dataGroup
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', '#f28e2c')
      .attr('stroke-width', 4)
      .attr(
        'd',
        `M 0 ${dimensions.boundedHeight - q} L ${
          dimensions.boundedWidth
        } ${dimensions.boundedHeight - dimensions.boundedWidth * m + q}`
      );

    /* PERIPHERALS */
    const xAxisGenerator = d3
      .axisBottom()
      .scale(xScale)
      .ticks(6);
    const xAxis = axisGroup
      .append('g')
      .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
      .call(xAxisGenerator);

    xAxis
      .append('text')
      .text(metricX)
      .attr('x', dimensions.boundedWidth / 2)
      .attr('y', dimensions.margin.bottom - 10)
      .attr('font-size', 15)
      .attr('fill', 'currentColor');

    const yAxisGenerator = d3
      .axisLeft()
      .scale(yScale)
      .ticks(6);
    const yAxis = axisGroup.append('g').call(yAxisGenerator);

    yAxis
      .append('text')
      .text(metricY)
      .attr('font-size', 15)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .style(
        'transform',
        `translate(${-dimensions.margin.left +
          15}px, ${dimensions.boundedHeight / 2}px) rotate(-90deg)`
      );
  }

  const metrics = [
    ['temperatureMin', 'temperatureMax'],
    ['windSpeed', 'pressure'],
    ['windSpeed', 'humidity'],
  ];

  metrics.forEach(([metricX, metricY]) => drawScatterplot(metricX, metricY));
}

drawScatterplots();
