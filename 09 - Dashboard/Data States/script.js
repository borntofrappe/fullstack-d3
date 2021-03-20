/* global d3 */
async function drawBarChart() {
  const dimensions = {
    width: 500,
    height: 350,
    margin: {
      top: 30,
      right: 15,
      bottom: 50,
      left: 15,
    },
  };

  const barPadding = 2;

  dimensions.boundedWidth = dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

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

    const defs = bounds
      .append('defs')
      
  const gradientId = 'overlay-gradient';
  const maskId = 'overlay-mask';

  defs 
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', 1)
    .selectAll('stop')
    .data(['hsl(0, 0%, 100%)', 'hsl(0, 0%, 50%)'])
    .enter()
    .append('stop')
    .attr('stop-color', d => d)
    .attr('offset', (d, i, { length }) => `${(i * 100) / (length - 1)}%`)

  defs 
    .append('mask')
    .attr('id', maskId)
    .append('rect')
    .attr('width', dimensions.boundedWidth)
    .attr('height', dimensions.boundedHeight)
    .attr('fill', `url(#${gradientId})`)

    const binsGroup = bounds.append('g');
    const meanGroup = bounds.append('g')
    const axisGroup = bounds.append('g');
    const overlayGroup = bounds.append('g');

    const bins = Array(10).fill().map((d, i, {length}) => {
      const bandWidth = dimensions.boundedWidth / length;
      const padding = barPadding;
      const width = bandWidth - padding * 2
      const height = Math.floor(Math.random() * (dimensions.boundedHeight / 2) + dimensions.boundedHeight / 2);
      
      const x = i * bandWidth;
      const y = dimensions.boundedHeight - height;
      return {
        x,
        y,
        width,
        height,
        padding
      }
    })

    const binGroups = binsGroup
      .selectAll('g')
      .data(bins)
      .enter()
      .append('g');

    binGroups
      .append('rect')
      .attr('x', d => d.x + d.padding)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('fill', 'hsl(0, 0%, 60%)');

      meanGroup
      .style('opacity', 0)

      meanGroup
        .append('line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', dimensions.boundedHeight)
        .attr('stroke-width', 2)
        .attr('stroke', 'currentColor')
        .attr('stroke-dasharray', '3 6')

        meanGroup
          .append('text')
          .attr('class', 'label')
          .text('Mean')
          .attr('x', 5)
          .attr('y', 5)


    const xAxisGroup = axisGroup
      .append('g')
      .attr('transform', `translate(0 ${dimensions.boundedHeight})`)
      
    xAxisGroup
      .append('path')
      .attr('d', `M 0 0 H ${dimensions.boundedWidth}`)
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1)
      .attr('fill', 'none');

      xAxisGroup
        .append('text')
        .attr('x', dimensions.boundedWidth / 2)
        .attr('y', dimensions.margin.bottom - 10)
        .attr('class', 'label')

  const overlayBins = overlayGroup
    .append('g')
    .attr('class', 'overlay-bins')
    .selectAll('g')
    .data(bins)
    .enter()
    .append('g');

    overlayBins
    .append('rect')
    .attr('x', d => d.x + d.padding)
    .attr('y', d => d.y)
    .attr('width', d => d.width)
    .attr('height', d => d.height)
    .attr('stroke', 'currentColor')
    .attr('fill', 'currentColor')
    .attr('mask', `url(#${maskId})`)

  const overlayTextGroup = overlayGroup
    .append('g')
    .attr('fill', 'currentColor')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('transform', `translate(${dimensions.boundedWidth / 2} ${dimensions.boundedHeight / 2})`)

  overlayTextGroup
    .append('text')
    .attr('class', 'main')
    .text('Loading')

  overlayTextGroup
    .append('text')
    .attr('class', 'sub')
    .text('Please wait as we fetch the data')
    .attr('y', 42)


  async function drawData() {
    const metric = 'temperatureMax';
    const dataset = await d3.json('../../nyc_weather_data.json');
    const metricAccessor = d => d[metric];

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(dataset, metricAccessor))
      .range([0, dimensions.boundedWidth])
      .nice();

    const binGenerator = d3
      .bin()
      .domain(xScale.domain())
      .value(metricAccessor)

    const bins = binGenerator(dataset);

    const yAccessor = d => d.length;
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins, yAccessor)])
      .range([dimensions.boundedHeight, 0])
      .nice();

    const overlayTransition = d3.transition().duration(750);
    
    overlayGroup
      .transition(overlayTransition)
      .style('opacity', 0)
      .remove()

    const update = binsGroup
      .selectAll('g')
      .data(bins);

    const enter = update.enter().append('g');
    const exit = update.exit();

    const exitTransition = d3.transition(overlayTransition).duration(500);
    const updateTransition = d3.transition(exit.empty() ? overlayTransition : exitTransition).transition().duration(1000);
    const enterTransition = d3.transition(updateTransition).transition().duration(1000);

    exit
      .select('rect')
      .transition(exitTransition)
      .attr('y', dimensions.boundedHeight)
      .attr('height', 0);

    exit
      .transition(exitTransition)
      .remove()

    enter
      .append('rect')
      .attr('fill', 'cornflowerblue')
      .attr('x', d => xScale(d.x0) + barPadding)
      .attr('width', d => d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding * 2]))
      .attr('y', dimensions.boundedHeight)
      .attr('height', 0)
      .transition(enterTransition)
      .attr('y', d => yScale(yAccessor(d)))
      .attr('height', d => dimensions.boundedHeight - yScale(yAccessor(d)))

    update
      .select('rect')
      .transition(updateTransition)
      .attr('x', d => xScale(d.x0) + barPadding)
      .attr('width', d =>
        d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding * 2])
      )
      .attr('y', d => yScale(yAccessor(d)))
      .attr('height', d => dimensions.boundedHeight - yScale(yAccessor(d)))
      .attr('fill', 'cornflowerblue');

    const xAxis = d3
    .axisBottom(xScale)
    .ticks(5)
    .tickSize(0)
    .tickPadding(5)

    xAxisGroup
    .select('text')
    .text(metric)
    .style('opacity', 0)
    .transition(updateTransition)
    .style('opacity', 1)
    
    xAxisGroup
      .transition(updateTransition)
      .call(xAxis)

    enter
        .merge(update)
        .append('text')
        .attr('class', 'label')
        .attr('x', d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
        .attr('y', d => yScale(yAccessor(d)) - 5)
        .text(d => yAccessor(d))
        .attr('text-anchor', 'middle')
    .style('opacity', 0)
    .transition(enterTransition)
    .delay((d, i) => i * 50)
    .style('opacity', 1)

        const mean = d3.mean(dataset, metricAccessor);

        meanGroup
          .transition(enterTransition)
          .transition()
          .style('opacity', 1)
          .style('transform', `translate(${xScale(mean)}px, 0px)`);
    
  }

  setTimeout(() => {
    drawData();
  }, 2500);
}

drawBarChart();
