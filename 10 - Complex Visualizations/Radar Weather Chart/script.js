async function drawRadarWeatherChart() {
  /* ACCESS DATA */
  const dataset = await d3.json('../../nyc_weather_data.json');

  const dateParser = d3.timeParse('%Y-%m-%d');
  const dateAccessor = d => dateParser(d.date);

  const temperatureMinAccessor = d => d.temperatureMin;
  const temperatureMaxAccessor = d => d.temperatureMax;
  const uvIndexAccessor = d => d.uvIndex;
  const precipitationProbabilityAccessor = d => d.precipitationProbability;
  const precipitationTypeAccessor = d => d.precipitationType;
  const cloudCoverAccessor = d => d.cloudCover;

  const formatDateMonth = d => d3.timeFormat('%b')(d)
  const formatTemperature = d => `${d3.format('.0f')(d)}°F`;

  /* CHART DIMENSIONS */
  const dimensions = {
    size: 600,
    margin: 80,
  };

  dimensions.boundedSize = dimensions.size - (dimensions.margin * 2);
  dimensions.boundedRadius = dimensions.boundedSize / 2;
  
  /* SCALES */
  const angleScale = d3.scaleTime()
    .domain(d3.extent(dataset, dateAccessor))
    .range([0, Math.PI * 2])

  /* DRAW DATA */
  const wrapper = d3
    .select('#wrapper')
    .append('svg')
    .attr('width', dimensions.size)
    .attr('height', dimensions.size)

  const bounds = wrapper
    .append('g')
    .attr(
      'transform',
      `translate(${dimensions.margin + dimensions.boundedRadius} ${dimensions.margin + dimensions.boundedRadius})`
    );

  const peripheralsGroup = bounds.append('g');
  const temperatureGroup = bounds.append('g');

  const axisGroup = peripheralsGroup.append('g');
  const gridLinesGroup = peripheralsGroup.append('g');

  const months = d3.timeMonths(...angleScale.domain())
  axisGroup
      .append('g')
      .selectAll('path')
      .data(months)
      .enter()
      .append('path')
      .attr('transform', d => `rotate(${angleScale(d) * 180 / Math.PI})`)
      .attr('d', `M 0 0 v -${dimensions.boundedRadius}`)
      .attr('fill', 'none')
      .attr('stroke', '#cecece')
      .attr('stroke-width', 1)

    axisGroup
      .append('g')
      .selectAll('text')
      .data(months)
      .enter()
      .append('text')
      .attr('transform', d => {
        const angle = angleScale(d) - Math.PI / 2;
        const x = Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin * 0.6)
        const y = Math.sin(angle) * (dimensions.boundedRadius + dimensions.margin * 0.6)

        return `translate(${x} ${y})`
      })
      .text(d => formatDateMonth(d))
      .attr('fill', 'currentColor')
      .attr('font-size', 14)
      .attr('text-anchor', d => {
        const angle = angleScale(d) - Math.PI / 2;
        const x = Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin / 2)
        
        return Math.abs(x) < 5 ? 'middle' : x > 0 ? 'start' : 'end';
      })
      .attr('dominant-baseline', 'middle')


  const radiusScale = d3.scaleLinear()
      .domain(
        d3.extent([...dataset.map(temperatureMaxAccessor), ...dataset.map(temperatureMinAccessor)])
      )
      .range([0, dimensions.boundedRadius])
      .nice()

    const temperatureTicks = radiusScale.ticks(4); 

    gridLinesGroup
    .append('g')
    .selectAll('circle')
    .data(temperatureTicks)
    .enter()
    .append('circle')
    .attr('r', d => radiusScale(d))
    .attr('fill', 'none')
    .attr('stroke', '#cecece')
    .attr('stroke-width', 1)

    gridLinesGroup
    .append('g')
    .selectAll('rect')
    .data(temperatureTicks.filter(d => d))
    .enter()
    .append('rect')
    .attr('fill', '#e7ecee')
    .attr('width', 39.5)
    .attr('x', 0.5)
    .attr('y',  d => radiusScale(d) * -1 - 7)
    .attr('height', 16)

    gridLinesGroup
    .append('g')
    .selectAll('text')
    .data(temperatureTicks.filter(d => d))
    .enter()
    .append('text')
    .text(d => formatTemperature(d))
    .attr('fill', '#8395a7')
    .attr('x', 4)
    .attr('y',  d => (radiusScale(d) * -1) + 2)
    .attr('font-size', 12)
    .attr('dominant-baseline', 'middle')
    .attr('opacity', 0.75);

  



   
  
}

drawRadarWeatherChart();
