const {
  json,
  timeParse,
  timeFormat,
  timeMonths,
  timeWeeks,
  interpolateBlues,
  scaleLinear,
  extent,
  min,
  max,
  select
} = d3;

async function drawHeatmap() {
  /* ACCESS DATA */
  const data = await json('../../nyc_weather_data.json');
  
  const dateParser = timeParse('%Y-%m-%d');
  const dayParser = timeParse('%e');
  const dayFormatter = timeFormat('%A');
  const monthFormatter = timeFormat('%b');

  const dateAccessor = d => dateParser(d.date);
  
  const dataset = [...data].sort((a, b) => dateAccessor(a) - dateAccessor(b));
 
  const firstDate = dateAccessor(dataset[0]);
  // return the number of weeks since start date
  const weekAccessor = d => timeWeeks(firstDate, dateAccessor(d)).length;
  // return the number describing the day
  const dayAccessor = d => timeFormat('%w')(dateAccessor(d));

  const weeks = weekAccessor(dataset[dataset.length - 1]);
  const daysOfWeek = Array(7)
    .fill()
    .map((d, i) => dayFormatter(dayParser(i)));

  const months = timeMonths(
    dateAccessor(dataset[0]),
    dateAccessor(dataset[dataset.length - 1])
  );

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 800,
    margin: {
      top: 20,
      right: 0,
      bottom: 0,
      left: 80,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);

  const tileTotalSize = dimensions.boundedWidth / (weeks + 1);
  const tilePadding = tileTotalSize * 0.1;
  const tileSize = tileTotalSize - tilePadding * 2;

  dimensions.height =
    tileTotalSize * daysOfWeek.length +
    (dimensions.margin.top + dimensions.margin.bottom);

  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  const dimensionsLegend = {
    width: 250,
    height: 15,
    margin: {
      top: 0,
      right: 40,
      bottom: 0,
      left: 40,
    },
  };

  dimensionsLegend.boundedWidth =
    dimensionsLegend.width -
    (dimensionsLegend.margin.left + dimensionsLegend.margin.right);
  dimensionsLegend.boundedHeight =
    dimensionsLegend.height -
    (dimensionsLegend.margin.top + dimensionsLegend.margin.bottom);

  /* SCALES */
  const interpolateColor = interpolateBlues;
  const colorScale = scaleLinear().range([0, 1]);

  /* DRAW DATA */
  const heatmapMetric = select('#wrapper').append('h2');
  const heatmapGradientId = 'heatmap-gradient';

  const heatmapLegend = select('#wrapper')
    .append('svg')
    .attr('id', 'legend')
    .attr('width', dimensionsLegend.width)
    .attr('height', dimensionsLegend.height);

  heatmapLegend
    .append('linearGradient')
    .attr('id', heatmapGradientId)
    .selectAll('stop')
    .data([0, 1])
    .enter()
    .append('stop')
    .attr('offset', (d, i, { length }) => `${(i * 100) / (length - 1)}%`)
    .attr('stop-color', d => interpolateColor(d));

  const heatmapGroup = heatmapLegend
    .append('g')
    .style(
      'transform',
      `translate(${dimensionsLegend.margin.left}px, ${
        dimensionsLegend.margin.top
      }px)`
    );

  heatmapGroup
    .append('rect')
    .attr('width', dimensionsLegend.boundedWidth)
    .attr('height', dimensionsLegend.boundedHeight)
    .attr('fill', `url(#${heatmapGradientId})`);

  const heatmapMin = heatmapGroup
    .append('text')
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('x', -3);

  const heatmapMax = heatmapGroup
    .append('text')
    .attr('text-anchor', 'start')
    .attr('x', dimensionsLegend.boundedWidth + 3)
    
  heatmapGroup
    .selectAll('text')
    .attr('y', dimensionsLegend.boundedHeight / 2 + 1)
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 13);

  const heatmapButton = select('#wrapper')
    .append('button')
    .text('Change metric');

  const wrapper = select('#wrapper')
    .append('svg')
    .attr('id', 'heatmap')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height);

  const bounds = wrapper
    .append('g')
    .style(
      'transform',
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const axisGroup = bounds.append('g');
  const metricGroup = bounds.append('g');

  /* PERIPHERALS */
  const xAxisGroup = axisGroup.append('g');
  const yAxisGroup = axisGroup.append('g');

  xAxisGroup
    .selectAll('text')
    .data(months)
    .enter()
    .append('text')
    .text(d => monthFormatter(d))
    .attr('x', d => timeWeeks(firstDate, d).length * tileTotalSize)
    .attr('y', -dimensions.margin.top + 12);

  yAxisGroup
    .selectAll('text')
    .data(daysOfWeek)
    .enter()
    .append('text')
    .text(d => d)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('x', -5)
    .attr('y', (d, i) => i * tileTotalSize + 6);

  axisGroup
    .selectAll('text')
    .attr('font-size', 12)
    .attr('fill', 'currentColor');

  function drawMap(metric) {
    const metricAccessor = d => d[metric];
    colorScale.domain(extent(dataset, metricAccessor));

    heatmapMetric.text(metric);
    heatmapMin.text(min(dataset, metricAccessor));
    heatmapMax.text(max(dataset, metricAccessor));

    const updateGroup = metricGroup.selectAll('rect').data(dataset);

    const enterGroup = updateGroup.enter();

    const exitGroup = updateGroup.exit();

    exitGroup.remove();

    enterGroup
      .append('rect')
      .attr('fill', d => interpolateColor(colorScale(metricAccessor(d))))
      .attr('x', d => weekAccessor(d) * tileTotalSize + tilePadding)
      .attr('y', d => dayAccessor(d) * tileTotalSize + tilePadding)
      .attr('width', tileSize)
      .attr('height', tileSize);

    updateGroup
      .transition()
      .attr('fill', d => interpolateColor(colorScale(metricAccessor(d))));
  }

  const metrics = [
    'windSpeed',
    'moonPhase',
    'dewPoint',
    'humidity',
    'uvIndex',
    'windBearing',
    'temperatureMin',
    'temperatureMax',
  ];
  let metricIndex = 0;

  drawMap(metrics[metricIndex]);

  heatmapButton.on('click', () => {
    metricIndex = (metricIndex + 1) % metrics.length;
    drawMap(metrics[metricIndex]);
  });
}

drawHeatmap();
