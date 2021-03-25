async function drawMarginalHistogram() {
  const dataset = await d3.json('../../nyc_weather_data.json');

  const xAccessor = d => d.temperatureMin;
  const yAccessor = d => d.temperatureMax;
  const parseDate = d3.timeParse('%Y-%m-%d');
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
      height: 25,
    },
    histogram: {
      height: 60,
      margin: 10
    }
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
  const legendGroup = bounds.append('g');
  const scatterplotGroup = bounds.append('g');
  const histogramsGroup = bounds.append('g');

  scatterplotGroup
    .selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('r', 5)
    .attr('cx', d => xScale(xAccessor(d)))
    .attr('cy', d => yScale(yAccessor(d)))
    .attr('fill', d => colorScale(colorAccessor(d)));


    histogramsGroup.attr('class', 'color-sub')
  const thresholds = 20;
  const topHistogramGenerator = d3.bin()
      .domain(xScale.domain())
      .value(xAccessor)
      .thresholds(thresholds)

  const topHistogramBins = topHistogramGenerator(dataset)
 
  const topHistogramScale = d3.scaleLinear().domain([0, d3.max(topHistogramBins, d => d.length)]).range([dimensions.histogram.height, 0])
  const topHistogramAreaGenerator = d3.area()
      .x(d => xScale((d.x0 + d.x1) / 2))
      .y0(d => topHistogramScale(d.length))
      .y1(dimensions.histogram.height)
      .curve(d3.curveBasis)

      const topHistogramGroup = histogramsGroup
      .append('g')
      .attr('transform', `translate(0 -${dimensions.histogram.height + dimensions.histogram.margin})`)

      
      topHistogramGroup
        .append('path')
        .attr('d', topHistogramAreaGenerator(topHistogramBins))
        .attr('fill', 'currentColor')


      const rightHistogramGenerator = d3.bin()
      .domain(yScale.domain())
      .value(yAccessor)
      .thresholds(thresholds)

  const rightHistogramBins = rightHistogramGenerator(dataset)
 
  const rightHistogramScale = d3.scaleLinear().domain([0, d3.max(rightHistogramBins, d => d.length)]).range([dimensions.histogram.height, 0])
  const rightHistogramAreaGenerator = d3.area()
      .x(d => xScale((d.x0 + d.x1) / 2))
      .y0(d => rightHistogramScale(d.length))
      .y1(dimensions.histogram.height)
      .curve(d3.curveBasis)

      const rightHistogramGroup = histogramsGroup
      .append('g')
      .attr('transform', `translate(${dimensions.boundedWidth} 0) rotate(90) translate(${dimensions.boundedWidth} -${dimensions.histogram.height + dimensions.histogram.margin}) scale(-1 1)`)

      
      rightHistogramGroup
        .append('path')
        .attr('d', rightHistogramAreaGenerator(rightHistogramBins))
        .attr('fill', 'currentColor')

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
    .attr('fill', `url(#${gradientId})`);

  const legendTickScale = d3
    .scaleLinear()
    .domain(colorScale.domain())
    .range([0, dimensions.legend.width]);

  const legendTicksGroup = legendGroup
    .selectAll('g')
    .data(d3.timeMonths(...colorScale.domain()).filter((d, i) => i % 2 !== 0))
    .enter()
    .append('g')
    .attr('transform', d => `translate(${legendTickScale(d)} 0)`);

  legendTicksGroup
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 1)
    .attr('d', `M 0 0 v ${dimensions.legend.height / 4}`);

  legendTicksGroup
    .append('text')
    .text(d => d3.timeFormat('%b')(d))
    .attr('fill', 'currentColor')
    .attr('font-size', 13)
    .attr('y', -4)
    .attr('text-anchor', 'middle');

  const ticks = 5;
  const xAxisGenerator = d3.axisBottom().scale(xScale).ticks(ticks);
  
  const xAxisGroup = axisGroup
    .append('g')
    .attr('transform', `translate(0 ${dimensions.boundedHeight})`)
    .call(xAxisGenerator);

  xAxisGroup
    .append('text')
    .text('Minimum Temperature (°F)')
    .attr('x', dimensions.boundedWidth / 2)
    .attr('y', dimensions.margin.bottom - 10)
    .attr('font-size', 16)
    .attr('fill', 'currentColor');

  const yAxisGenerator = d3.axisLeft().scale(yScale).ticks(ticks);
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
    .attr('font-size', 16)
    .attr('fill', 'currentColor');

  axisGroup.selectAll('g.tick text').attr('font-size', 12);
}

drawMarginalHistogram();
