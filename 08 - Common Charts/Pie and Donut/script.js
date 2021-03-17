async function drawDonutChart() {
  /* ACCESS DATA */
  const dataset = await d3.json('../../nyc_weather_data.json');
  const iconAccessor = d => d.icon;

  const iconsPaths = {
    'clear-day':
      'm50 0a8.8 8.8 0 0 0-8.801 8.801 8.8 8.8 0 0 0 8.801 8.799 8.8 8.8 0 0 0 8.801-8.799 8.8 8.8 0 0 0-8.801-8.801zm-29 12.07a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm58.27 0a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm-29.26 15.93a22 22 0 0 0-22 22 22 22 0 0 0 22 22 22 22 0 0 0 22-22 22 22 0 0 0-22-22zm-41.2 13.2a8.8 8.8 0 0 0-8.801 8.801 8.8 8.8 0 0 0 8.801 8.801 8.8 8.8 0 0 0 8.799-8.801 8.8 8.8 0 0 0-8.799-8.801zm82.4 0a8.8 8.8 0 0 0-8.799 8.801 8.8 8.8 0 0 0 8.799 8.801 8.8 8.8 0 0 0 8.801-8.801 8.8 8.8 0 0 0-8.801-8.801zm-70.2 29.13a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm58.27 0a8.8 8.8 45 0 0-6.352 2.576 8.8 8.8 45 0 0 0 12.45 8.8 8.8 45 0 0 12.45 0 8.8 8.8 45 0 0 0-12.45 8.8 8.8 45 0 0-6.094-2.576zm-29.26 12.07a8.8 8.8 0 0 0-8.801 8.799 8.8 8.8 0 0 0 8.801 8.801 8.8 8.8 0 0 0 8.801-8.801 8.8 8.8 0 0 0-8.801-8.799z',
    'partly-cloudy-day':
      'm72 0.5a4.84 4.84 0 0 0-4.84 4.84 4.84 4.84 0 0 0 4.84 4.84 4.84 4.84 0 0 0 4.84-4.84 4.84 4.84 0 0 0-4.84-4.84zm-15.95 6.637a4.84 4.84 0 0 0-3.492 1.418 4.84 4.84 0 0 0 0 6.844 4.84 4.84 0 0 0 6.844 0 4.84 4.84 0 0 0 0-6.844 4.84 4.84 0 0 0-3.352-1.418zm32.05 0a4.84 4.84 0 0 0-3.492 1.418 4.84 4.84 0 0 0 0 6.844 4.84 4.84 0 0 0 6.844 0 4.84 4.84 0 0 0 0-6.844 4.84 4.84 0 0 0-3.352-1.418zm-16.09 8.764a12.1 12.1 0 0 0-12.1 12.1 12.1 12.1 0 0 0 12.1 12.1 12.1 12.1 0 0 0 12.1-12.1 12.1 12.1 0 0 0-12.1-12.1zm-22.66 7.26a4.84 4.84 0 0 0-4.84 4.84 4.84 4.84 0 0 0 4.84 4.84 4.84 4.84 0 0 0 4.84-4.84 4.84 4.84 0 0 0-4.84-4.84zm45.32 0a4.84 4.84 0 0 0-4.84 4.84 4.84 4.84 0 0 0 4.84 4.84 4.84 4.84 0 0 0 4.84-4.84 4.84 4.84 0 0 0-4.84-4.84zm-38.61 16.02a4.84 4.84 0 0 0-3.492 1.418 4.84 4.84 0 0 0 0 6.844 4.84 4.84 0 0 0 6.844 0 4.84 4.84 0 0 0 0-6.844 4.84 4.84 0 0 0-3.352-1.418zm32.05 0a4.84 4.84 0 0 0-3.492 1.418 4.84 4.84 0 0 0 0 6.844 4.84 4.84 0 0 0 6.844 0 4.84 4.84 0 0 0 0-6.844 4.84 4.84 0 0 0-3.352-1.418zm-58.09 0.8164a30 30 0 0 0-30 30 30 30 0 0 0 30 30h35a20 20 0 0 0 20-20 20 20 0 0 0-20-20 20 20 0 0 0-6.393 1.074 30 30 0 0 0-28.61-21.07zm42 5.82a4.84 4.84 0 0 0-4.84 4.84 4.84 4.84 0 0 0 4.84 4.84 4.84 4.84 0 0 0 4.84-4.84 4.84 4.84 0 0 0-4.84-4.84z',
    'partly-cloudy-night':
      'm69.01 12.91a15.4 15.4 0 0 0 2.988 30.5 15.4 15.4 0 0 0 15.09-12.41 15.4 15.4 0 0 1-2.99 0.3125 15.4 15.4 0 0 1-15.09-18.39v-0.009766zm-39.01 27.09a30 30 0 0 0-30 30 30 30 0 0 0 30 30h35a20 20 0 0 0 20-20 20 20 0 0 0-20-20 20 20 0 0 0-6.393 1.074 30 30 0 0 0-28.61-21.07z',
    'rain':
      'm40 6a30 30 0 0 0-30 30 30 30 0 0 0 30 30h35a20 20 0 0 0 20-20 20 20 0 0 0-20-20 20 20 0 0 0-6.393 1.074 30 30 0 0 0-28.61-21.07zm-6.061 68.44a4 4 0 0 0-3.939 4.057v10a4 4 0 1 0 8 0v-10a4 4 0 0 0-4.061-4.057zm32 0a4 4 0 0 0-3.939 4.057v10a4 4 0 1 0 8 0v-10a4 4 0 0 0-4.061-4.057zm-16 5a4 4 0 0 0-3.939 4.057v10a4 4 0 1 0 8 0v-10a4 4 0 0 0-4.061-4.057z',
    'other':
      'm20 40a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10 10 10 0 0 0-10-10zm30 0a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10 10 10 0 0 0-10-10zm30 0a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10 10 10 0 0 0-10-10z',
  };

  const iconData = dataset
    .map(d => iconAccessor(d))
    .reduce((acc, curr) => {
      const key = iconsPaths[curr] ? curr : 'other';
      acc[key] = acc[key] + 1 || 1;
      return acc;
    }, {});

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 400,
    height: 400,
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const radius = dimensions.boundedWidth / 2;
  const colors = d3.schemePastel1;

  const keyAccessor = d => d.key;
  const valueAccessor = d => d.value;

  const pieGenerator = d3
    .pie()
    .padAngle(0.01)
    .value(d => valueAccessor(d));

  const arcGenerator = d3
    .arc()
    .innerRadius(radius * 0.75)
    .outerRadius(radius);

  const iconPieData = pieGenerator(
    Object.entries(iconData).map(([key, value]) => ({
      key,
      value,
    }))
  );

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

  const centerGroup = bounds
    .append('g')
    .append('g')
    .style(
      'transform',
      `translate(${dimensions.boundedWidth / 2}px, ${dimensions.boundedHeight /
        2}px)`
    );

  centerGroup
    .append('text')
    .text('2018 Weather')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('y', -16)
    .attr('font-size', 28)
    .attr('font-weight', 'bold');

  centerGroup
    .append('text')
    .text('New York City, NY')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('y', 20)
    .attr('font-size', 16);

  const sliceGroups = centerGroup
    .selectAll('g')
    .data(iconPieData)
    .enter()
    .append('g');

  sliceGroups
    .append('path')
    .attr('fill', (d, i) => colors[i % colors.length])
    .attr('d', d => arcGenerator(d));

  const centroidGroups = sliceGroups
    .append('g')
    .attr('transform', d => `translate(${arcGenerator.centroid(d)})`);

  centroidGroups
    .append('path')
    .attr('fill', 'currentColor')
    .attr('d', d => iconsPaths[keyAccessor(d.data)])
    .attr('transform', 'scale(0.2) translate(-50 -80)');

  centroidGroups
    .append('text')
    .attr('fill', 'currentColor')
    .text(d => valueAccessor(d.data))
    .attr('text-anchor', 'middle')
    .attr('y', 16)
    .attr('font-size', 13);
}

drawDonutChart();
