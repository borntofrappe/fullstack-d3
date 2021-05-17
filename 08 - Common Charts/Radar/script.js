const {
  json,
  timeParse,
  timeFormat,
  scaleBand,
  scaleLinear,
  extent,
  lineRadial,
  areaRadial,
  curveLinearClosed,
  select,

} = d3;

async function drawRadar() {
  /* ACCESS DATA */
  const dataset = await json('../../nyc_weather_data.json');

  const dateParser = timeParse('%Y-%m-%d');
  const dateFormatter = timeFormat('%B %d, %Y');

  const metrics = [
    'windBearing',
    'moonPhase',
    'pressure',
    'humidity',
    'windSpeed',
    'temperatureMax',
  ];

  const accessors = metrics.reduce((acc, curr) => {
    acc[curr] = d => d[curr];
    return acc;
  }, {});

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 450,
    height: 450,
    margin: 70,
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin + dimensions.margin);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin + dimensions.margin);

  /* SCALES */
  const radius = dimensions.boundedWidth / 2;

  const angleScale = scaleBand()
    .domain(metrics)
    .range([0, Math.PI * 2]);

  const radiiScales = metrics.reduce((acc, curr) => {
    acc[curr] = scaleLinear()
      .domain(extent(dataset, accessors[curr]))
      .range([0, radius]);
    return acc;
  }, {});

  const lineGenerator = lineRadial()
    .angle(d => angleScale(d.metric))
    .radius(d => radiiScales[d.metric](d.value))
    .curve(curveLinearClosed);

  const areaGenerator = areaRadial()
    .angle(d => angleScale(d.metric))
    .innerRadius(0)
    .outerRadius(d => radiiScales[d.metric](d.value))
    .curve(curveLinearClosed);

  /* DRAW DATA */
  const radarDate = select('#wrapper').append('h2');

  const radarButton = select('#wrapper')
    .append('button')
    .text('Next day');

  const wrapper = select('#wrapper')
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height);

  const bounds = wrapper
    .append('g')
    .style(
      'transform',
      `translate(${dimensions.margin}px, ${dimensions.margin}px)`
    );

  const centerGroup = bounds
    .append('g')
    .append('g')
    .style(
      'transform',
      `translate(${dimensions.boundedWidth / 2}px, ${dimensions.boundedHeight /
        2}px)`
    );

  const axisGroup = centerGroup.append('g');
  const dataGroup = centerGroup.append('g');

  const radarArea = dataGroup
    .append('path')
    .attr('fill', 'cornflowerblue')
    .attr('opacity', 0.2);

  const radarLine = dataGroup
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'cornflowerblue')
    .attr('stroke-width', 3);

  /* PERIPHERALS */
  const axisGroups = axisGroup
    .selectAll('g')
    .data(metrics)
    .enter()
    .append('g');

  const gridRadii = Array(3)
    .fill('')
    .map((d, i, { length }) => ((i + 1) * radius) / length);

  axisGroup
    .append('g')
    .attr('opacity', 0.2)
    .selectAll('circle')
    .data(gridRadii)
    .enter()
    .append('circle')
    .attr('r', d => d)
    .attr('fill', 'none')
    .attr('stroke', 'currentColor ')
    .attr('stroke-width', 1);

  axisGroups
    .append('path')
    .attr('opacity', 0.2)
    .attr('fill', 'none')
    .attr('stroke', 'currentColor ')
    .attr('stroke-width', 1)
    .attr('d', `M 0 0 V -${radius}`)
    .attr('transform', d => `rotate(${(angleScale(d) * 180) / Math.PI})`);

  axisGroups
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 13)
    .attr('fill', 'currentColor')
    .text(d => d)
    .attr('transform', d => {
      const angle = angleScale(d) - Math.PI / 2;
      const x = Math.cos(angle) * (radius + dimensions.margin - 25);
      const y = Math.sin(angle) * (radius + dimensions.margin - 25);
      return `translate(${x} ${y})`;
    });

  function drawDay(indexDay) {
    const date = dateFormatter(dateParser(dataset[indexDay].date));
    const dataDay = metrics.map(metric => ({
      metric,
      value: dataset[indexDay][metric],
    }));

    radarDate.text(date);

    radarArea.transition().attr('d', areaGenerator(dataDay));

    radarLine.transition().attr('d', lineGenerator(dataDay));
  }

  let index = 0;
  drawDay(index);

  radarButton.on('click', () => {
    index = (index + 1) % dataset.length;
    drawDay(index);
  });
}

drawRadar();
