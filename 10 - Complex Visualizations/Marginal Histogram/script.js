async function drawMarginalHistogram() {
  const dataset = await d3.json('../../nyc_weather_data.json');

  const xAccessor = d => d.temperatureMin;
  const yAccessor = d => d.temperatureMax;
  const parseDate = d3.timeParse('%Y-%m-%d');
  const formatTemperature = d => `${d3.format('.1f')(d)}°F`;
  const formatDate = d3.timeFormat('%A, %b   %d, %Y');
  const dateAccessor = d => parseDate(d.date);
  const colorScaleYear = 2018;
  const colorAccessor = d => parseDate(d.date).setYear(colorScaleYear);

  const dimensions = {
    width: 600,
    height: 600,
    margin: {
      top: 80,
      right: 80,
      bottom: 60,
      left: 60,
    },
    legend: {
      width: 250,
      height: 20,
    },
    histogram: {
      height: 60,
      margin: 10,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  const domain = d3.extent([
    ...dataset.map(xAccessor),
    ...dataset.map(yAccessor),
  ]);

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

  const colorScale = d3
    .scaleSequential()
    .domain([
      parseDate(`${colorScaleYear}-01-01`),
      parseDate(`${colorScaleYear}-12-31`),
    ])
    .interpolator(d => d3.interpolateRainbow(d * -1));

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
    .attr('height', dimensions.boundedHeight);

  const gradientId = 'linear-gradient-id';
  const defs = bounds.append('defs');
  defs
    .append('linearGradient')
    .attr('id', gradientId)
    .selectAll('stop')
    .data(d3.timeMonths(...colorScale.domain()))
    .enter()
    .append('stop')
    .attr('offset', (d, i, { length }) => `${(i * 100) / (length - 1)}%`)
    .attr('stop-color', d => colorScale(d));

  const axisGroup = bounds.append('g');
  const histogramsGroup = bounds.append('g');
  const highlightGroup = bounds.append('g');
  const scatterplotGroup = bounds.append('g');
  const tooltipGroup = bounds.append('g');
  const delaunayGroup = bounds.append('g');
  const legendGroup = bounds.append('g');

  const scatterplotRadius = 5;

  scatterplotGroup
    .selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('r', scatterplotRadius)
    .attr('cx', d => xScale(xAccessor(d)))
    .attr('cy', d => yScale(yAccessor(d)))
    .attr('fill', d => colorScale(colorAccessor(d)));

  histogramsGroup.attr('class', 'color-sub');
  const thresholds = 20;
  const topHistogramGenerator = d3
    .bin()
    .domain(xScale.domain())
    .value(xAccessor)
    .thresholds(thresholds);

  const topHistogramBins = topHistogramGenerator(dataset);

  const topHistogramScale = d3
    .scaleLinear()
    .domain([0, d3.max(topHistogramBins, d => d.length)])
    .range([dimensions.histogram.height, 0]);
  const topHistogramAreaGenerator = d3
    .area()
    .x(d => xScale((d.x0 + d.x1) / 2))
    .y0(d => topHistogramScale(d.length))
    .y1(dimensions.histogram.height)
    .curve(d3.curveBasis);

  const topHistogramGroup = histogramsGroup
    .append('g')
    .attr(
      'transform',
      `translate(0 -${dimensions.histogram.height +
        dimensions.histogram.margin})`
    );

  topHistogramGroup
    .append('path')
    .attr('d', topHistogramAreaGenerator(topHistogramBins))
    .attr('fill', 'currentColor');

    const topHistogramHighlight = topHistogramGroup
    .append('path')

  const rightHistogramGenerator = d3
    .bin()
    .domain(yScale.domain())
    .value(yAccessor)
    .thresholds(thresholds);

  const rightHistogramBins = rightHistogramGenerator(dataset);

  const rightHistogramScale = d3
    .scaleLinear()
    .domain([0, d3.max(rightHistogramBins, d => d.length)])
    .range([dimensions.histogram.height, 0]);
  const rightHistogramAreaGenerator = d3
    .area()
    .x(d => xScale((d.x0 + d.x1) / 2))
    .y0(d => rightHistogramScale(d.length))
    .y1(dimensions.histogram.height)
    .curve(d3.curveBasis);

  const rightHistogramGroup = histogramsGroup
    .append('g')
    .attr(
      'transform',
      `translate(${dimensions.boundedWidth} 0) rotate(90) translate(${
        dimensions.boundedWidth
      } -${dimensions.histogram.height +
        dimensions.histogram.margin}) scale(-1 1)`
    );

  rightHistogramGroup
    .append('path')
    .attr('d', rightHistogramAreaGenerator(rightHistogramBins))
    .attr('fill', 'currentColor');

  const rightHistogramHighlight = rightHistogramGroup
    .append('path')

  /* INTERACTIONS */
  const tooltip = d3.select('#tooltip').style('opacity', 0);

  tooltipGroup.style('pointer-events', 'none').style('opacity', 0);

  const tooltipRadius = 8;
  const tooltipStrokeWidth = 3;

  tooltipGroup
    .append('circle')
    .attr('fill', 'currentColor')
    .attr('r', scatterplotRadius);

  tooltipGroup
    .append('circle')
    .attr('fill', 'none')
    .attr('stroke', 'maroon')
    .attr('stroke-width', tooltipStrokeWidth)
    .attr('r', tooltipRadius);

    highlightGroup
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .attr('fill', 'currentColor')
    .style('mix-blend-mode', 'color-burn');

  highlightGroup
    .append('rect')
    .attr('y', -scatterplotRadius)
    .attr('height', scatterplotRadius * 2);

  highlightGroup
    .append('rect')
    .attr('x', -scatterplotRadius)
    .attr('width', scatterplotRadius * 2);

  function onMouseEnter(event, d) {
    const x = xScale(xAccessor(d));
    const y = yScale(yAccessor(d));

    const color = colorScale(colorAccessor(d));

    tooltip
      .style(
        'transform',
        `translate(calc(-50% + ${x +
          dimensions.margin.left}px), calc(-100% + ${y +
          dimensions.margin.top -
          5}px - 1rem))`
      )
      .style('opacity', 1);

    tooltip.select('h2').text(formatDate(dateAccessor(d)));

    tooltip
      .select('p')
      .text(
        `${formatTemperature(xAccessor(d))} - ${formatTemperature(
          yAccessor(d)
        )}`
      );

    tooltipGroup.style('opacity', 1).attr('transform', `translate(${x} ${y})`);

    tooltipGroup.select('circle').attr('fill', color);

    highlightGroup
      .style('opacity', 1)
      .attr('transform', `translate(${x} ${y})`);

    highlightGroup
      .select('rect:nth-of-type(1)')
      .attr('width', dimensions.boundedWidth - x + dimensions.margin.right);

    highlightGroup
      .select('rect:nth-of-type(2)')
      .attr('height', y + dimensions.margin.top)
      .attr('transform', 'scale(1 -1)');
  }

  function onMouseLeave() {
    tooltip.style('opacity', 0);

    tooltipGroup.style('opacity', 0);
    
    highlightGroup.style('opacity', 0);
  }

  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d))
  );

  const voronoi = delaunay.voronoi([
    0,
    0,
    dimensions.boundedWidth,
    dimensions.boundedHeight,
  ]);

  delaunayGroup
    .append('g')
    .selectAll('path')
    .data(dataset)
    .enter()
    .append('path')
    .attr('d', (d, i) => voronoi.renderCell(i))
    .attr('fill', 'transparent')
    // .attr('stroke', 'currentColor')
    // .attr('stroke-width', 0.5)
    .on('mouseenter', onMouseEnter)
    .on('mouseleave', onMouseLeave);




  /* PERIPHERALS */
  legendGroup.attr(
    'transform',
    `translate(${dimensions.boundedWidth -
      dimensions.legend.width -
      10} ${dimensions.boundedHeight - dimensions.legend.height - 10})`
  );



  legendGroup
    .append('rect')
    .attr('width', dimensions.legend.width)
    .attr('height', dimensions.legend.height)
    .attr('fill', `url(#${gradientId})`)

  const legendTickScale = d3
    .scaleLinear()
    .domain(colorScale.domain())
    .range([0, dimensions.legend.width]);

  const legendTicksGroup = legendGroup
    .selectAll('g')
    .style('pointer-events', 'none')
    .data(d3.timeMonths(...colorScale.domain()).filter((d, i) => i % 2 !== 0))
    .enter()
    .append('g')
    .attr('transform', d => `translate(${legendTickScale(d)} 0)`);

  legendTicksGroup
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 1.5)
    .attr('d', `M 0 0 v ${dimensions.legend.height / 4}`);

  legendTicksGroup
    .append('text')
    .text(d => d3.timeFormat('%b')(d))
    .attr('fill', 'currentColor')
    .attr('font-size', 12)
    .attr('y', -4)
    .attr('text-anchor', 'middle');

  const legendHighlightGroup = legendGroup
      .append('g')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    legendHighlightGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', dimensions.legend.width / 2)
      .attr('y', -10)
      .attr('font-size', 13)
      .style('font-feature-settings', 'tnum')

    legendHighlightGroup
      .append('rect')
      .attr('width', 10)
      .attr('height', dimensions.legend.height)
      .attr('fill', 'hsla(0, 0%, 100%, 0.25)')
      .attr('stroke', 'hsl(0, 0%, 100%)')
      .attr('stroke-width', 3)

      
    const formatLegendDate = d3.timeFormat("%b %d");
    const weeksHighlight = 2;

    function isWithinRange(datum, d1, d2) {
      const yearDate = dateAccessor(datum).setYear(colorScaleYear);
      return yearDate >= d1 && yearDate <= d2;
    }
    
    function onLegendMouseMove(event) {
      const [x] = d3.pointer(event);
      const date = legendTickScale.invert(x);

      const [startDate, endDate] = legendTickScale.domain()

      const d1 = d3.max([startDate, d3.timeWeek.offset(date, -weeksHighlight)])
      const d2 = d3.min([endDate, d3.timeWeek.offset(date, weeksHighlight)])

      legendTicksGroup
        .style('opacity', 0)

      scatterplotGroup
        .selectAll('circle')
        .style('opacity', (d) => isWithinRange(d, d1, d2) ? 1 : 0)

      legendHighlightGroup
        .style('opacity', 1)

        legendHighlightGroup
        .select('text')
        .attr('x', legendTickScale(d1) + (legendTickScale(d2) - legendTickScale(d1)) / 2)
        .text(`${formatLegendDate(d1)} - ${formatLegendDate(d2)}`);

      legendHighlightGroup
        .select('rect')
        .attr('width', legendTickScale(d2) - legendTickScale(d1))
        .attr('transform', `translate(${legendTickScale(d1)} 0)`)

      const highlightDataset = dataset.filter(d => isWithinRange(d, d1, d2))

      const color = colorScale(date);

      topHistogramHighlight
        .style('opacity', 1)
        .attr('fill', color)
        .attr('d', topHistogramAreaGenerator(topHistogramGenerator(highlightDataset)))


      rightHistogramHighlight
        .style('opacity', 1)
        .attr('fill', color)
        .attr('d', rightHistogramAreaGenerator(rightHistogramGenerator(highlightDataset)))
    }

    function onLegendMouseLeave() {
      legendTicksGroup
        .style('opacity', 1)

      scatterplotGroup
        .selectAll('circle')
        .style('opacity', 1)

      legendHighlightGroup
        .style('opacity', 0)

        topHistogramHighlight
        .style('opacity', 0)

      rightHistogramHighlight
        .style('opacity', 0)
    }
    legendGroup
      .select('rect')
      .on('mousemove', onLegendMouseMove)
      .on('mouseleave', onLegendMouseLeave);


  const ticks = 5;
  const xAxisGenerator = d3
    .axisBottom()
    .scale(xScale)
    .ticks(ticks);

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

  const yAxisGenerator = d3
    .axisLeft()
    .scale(yScale)
    .ticks(ticks);
  const yAxisGroup = axisGroup.append('g').call(yAxisGenerator);

  yAxisGroup
    .append('text')
    .text('Maximum Temperature (°F)')
    .attr(
      'transform',
      `translate(${-dimensions.margin.left + 15} ${dimensions.boundedHeight /
        2}) rotate(-90)`
    )
    .style('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', 'currentColor');

  axisGroup.selectAll('g.tick text').attr('font-size', 11);

  axisGroup.selectAll('path')
    .attr('class', 'color-sub')
    axisGroup.selectAll('line')
    .attr('class', 'color-sub')

}

drawMarginalHistogram();
