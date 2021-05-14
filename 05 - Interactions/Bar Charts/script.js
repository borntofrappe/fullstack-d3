const {
  json,
  select,
  extent,
  max,
  scaleLinear,
  bin,
  format,
  axisBottom
} = d3;

async function drawBarCharts() {
  /* ACCESS DATA
  the accessor function depends on the metric of the individual bar chart
  */
  const dataset = await json('../../nyc_weather_data.json');

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 400,
    height: 350,
    margin: {
      top: 30,
      right: 15,
      bottom: 50,
      left: 25,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  function drawHistogram(metric) {
    const container = select('#root')
      .append('div')
      .attr('class', `wrapper`);

    const tooltip = container.append('div').attr('class', 'tooltip');

    tooltip.append('h2');

    tooltip.append('p');

    /* ACCESS DATA */
    const metricAccessor = d => d[metric];

    /* SCALES */
    const xScale = scaleLinear()
      .domain(extent(dataset, metricAccessor))
      .range([0, dimensions.boundedWidth])
      .nice();

    const binGenerator = bin()
      .domain(xScale.domain())
      .value(metricAccessor)
      .thresholds(12);

    const bins = binGenerator(dataset);

    const yAccessor = d => d.length;
    const yScale = scaleLinear()
      .domain([0, max(bins, yAccessor)])
      .range([dimensions.boundedHeight, 0])
      .nice();

    /* DRAW DATA */
    const wrapper = container
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    wrapper.attr('role', 'figure').attr('tabindex', '0');

    wrapper
      .append('title')
      .text(
        `Histogram plotting the distribution of ${metric} for the city of New York and in 2016`
      );

    const bounds = wrapper
      .append('g')
      .style(
        'transform',
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );

    const binsGroup = bounds.append('g');

    binsGroup
      .attr('role', 'list')
      .attr('tabindex', '0')
      .attr('aria-label', 'Histogram bars');

    const barPadding = 2;
    const binGroups = binsGroup
      .selectAll('g')
      .data(bins)
      .enter()
      .append('g');

    binGroups
      .attr('role', 'listitem')
      .attr('tabindex', '0')
      .attr(
        'aria-label',
        d =>
          `The metric ${metric} was observed between the values of ${
            d.x0
          } and ${d.x1} for a total of ${yAccessor(d)} times`
      );

    /* INTERACTION */
    function onMouseEnter(event, d) {
      const formatRange = format('.2f');

      const x =
        xScale(d.x0) +
        (xScale(d.x1) - xScale(d.x0)) / 2 +
        dimensions.margin.left;
      const y = yScale(yAccessor(d)) + dimensions.margin.top;

      tooltip
        .style(
          'transform',
          `translate(calc(-50% + ${x}px), calc(-100% + ${y}px - 0.5rem))`
        )
        .style('opacity', 1);

      tooltip.select('h2').text(metric);

      tooltip
        .select('p')
        .text(
          `${yAccessor(d)} times in the ${formatRange(d.x0)} - ${formatRange(
            d.x1
          )} range`
        );
    }

    function onMouseLeave() {
      tooltip.style('opacity', 0);
    }

    binGroups
      .append('rect')
      .attr('x', d => xScale(d.x0) + barPadding / 2)
      .attr('width', d => max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
      .attr('y', d => yScale(yAccessor(d)))
      .attr('height', d => dimensions.boundedHeight - yScale(yAccessor(d)))
      .attr('fill', 'cornflowerblue')
      .on('mouseenter', onMouseEnter)
      .on('mouseleave', onMouseLeave);

    /* PERIPHERALS */
    const xAxisGenerator = axisBottom().scale(xScale);
    const xAxis = bounds
      .append('g')
      .style('transform', `translate(0px, ${dimensions.boundedHeight}px)`)
      .call(xAxisGenerator);

    xAxis
      .append('text')
      .text(metric)
      .style('text-transform', 'capitalize')
      .attr('x', dimensions.boundedWidth / 2)
      .attr('y', dimensions.margin.bottom - 10)
      .attr('font-size', 15)
      .attr('fill', 'currentColor');
  }

  // call drawHistogram to draw a bar chart for each metric
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
  metrics.forEach(metric => drawHistogram(metric));
}

drawBarCharts();
