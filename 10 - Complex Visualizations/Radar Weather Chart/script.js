async function drawRadarWeatherChart() {
  /* ACCESS DATA */
  const dataset = await d3.json('../../nyc_weather_data.json');

  const dateParser = d3.timeParse('%Y-%m-%d');
  const dateAccessor = d => dateParser(d.date);

  const temperatureMinAccessor = d => d.temperatureMin;
  const temperatureMaxAccessor = d => d.temperatureMax;
  const uvIndexAccessor = d => d.uvIndex;
  const precipProbabilityAccessor = d => d.precipProbability;
  const precipTypeAccessor = d => d.precipType;
  const cloudCoverAccessor = d => d.cloudCover;

  const formatDateMonth = d => d3.timeFormat('%b')(d)
  const formatTemperature = d => `${d3.format('.0f')(d)}°F`;

  /* CHART DIMENSIONS */
  const dimensions = {
    size: 600,
    margin: 100,
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

  const defs = wrapper.append('defs');
  const gradientId = 'tempereature-gradient';
  const stops = 10;
  const stopData = Array(stops).fill().map((d, i, {length}) => ({
    color: d3.interpolateYlOrRd(i / (length - 1)),
    offset: `${(i * 100) / (length - 1)}%`
  }))
  defs
      .append('radialGradient')
      .attr('id', gradientId)
      .selectAll('stop')
      .data(stopData)
      .enter()
      .append('stop')
      .attr('stop-color', d => d.color)
      .attr('offset', d => d.offset)

  const peripheralsGroup = bounds.append('g');
  const axisGroup = peripheralsGroup.append('g');

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
        const x = Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin * 0.75)
        const y = Math.sin(angle) * (dimensions.boundedRadius + dimensions.margin * 0.75)

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


  const gridLinesGroup = peripheralsGroup.append('g');

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

  
  const temperatureGroup = bounds.append('g');
    const freezingTemperature = 32;
    if(radiusScale.domain()[0] <= freezingTemperature) {
      temperatureGroup  
        .append('circle')
        .attr('r', radiusScale(freezingTemperature))
        .attr('fill', '#00d2d3')
        .attr('opacity', 0.15)
    }

    const temperatureAreaGenerator = d3.areaRadial()
      .angle(d => angleScale(dateAccessor(d)))
      .innerRadius(d => radiusScale(temperatureMinAccessor(d)))
      .outerRadius(d => radiusScale(temperatureMaxAccessor(d)))

    temperatureGroup
      .append('path')
      .attr('d', temperatureAreaGenerator(dataset))
      .attr('fill', `url(#${gradientId})`)

    const uvIndexGroup = bounds.append('g')
    const uvIndexThreshold = 8;
    const uvIndexData = dataset.filter(d => uvIndexAccessor(d) >= uvIndexThreshold)
    const uvIndexStrokeLength = (radiusScale(temperatureTicks[1]) - radiusScale(temperatureTicks[0])) / 2;
    const uvIndexY = radiusScale(temperatureTicks[temperatureTicks.length - 1]) - uvIndexStrokeLength / 2

    uvIndexGroup
      .selectAll('path')
      .data(uvIndexData)
      .enter()
      .append('path')
      .attr('transform', d => `rotate(${angleScale(dateAccessor(d)) * 180 / Math.PI})`)
      .attr('d', `M 0 -${uvIndexY} v -${uvIndexStrokeLength}`)
      .attr('fill', 'none')
      .attr('stroke', '#feca57')
      .attr('stroke-width', 3)
   

    const cloudCoverRadiusScale = d3.scaleSqrt()
    .domain(d3.extent(dataset, cloudCoverAccessor))
    .range([1, 10])

  const cloudCoverGroup = bounds.append('g');

  cloudCoverGroup
    .selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('transform', d => {
      const angle = angleScale(dateAccessor(d)) - Math.PI / 2;
      const x = Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin * 0.5);
      const y = Math.sin(angle) * (dimensions.boundedRadius + dimensions.margin * 0.5);

      return `translate(${x} ${y})`
    })
    .attr('fill', '#c8d6e5')
    .attr('r', d => cloudCoverRadiusScale(cloudCoverAccessor(d)))
    .attr('opacity', 0.5)

  
    const precipProbabilityRadiusScale = d3.scaleSqrt()
    .domain(d3.extent(dataset, precipProbabilityAccessor))
    .range([1, 8])

    const precipTypes = ['rain', 'sleet', 'snow'];

    const precipTypeColorScale = d3.scaleOrdinal()
      .domain(precipTypes)
      .range(["#54a0ff","#636e72","#b2bec3"])

      const precipGroup = bounds.append('g');

      precipGroup
        .selectAll('circle')
        .data(dataset.filter(precipTypeAccessor))
        .enter()
        .append('circle')
        .attr('transform', d => {
          const angle = angleScale(dateAccessor(d)) - Math.PI / 2;
          const x = Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin * 0.3);
          const y = Math.sin(angle) * (dimensions.boundedRadius + dimensions.margin * 0.3);
    
          return `translate(${x} ${y})`
        })
        .attr('fill', d => precipTypeColorScale(precipTypeAccessor(d)))
        .attr('r', (d, i) => precipProbabilityRadiusScale(precipProbabilityAccessor(d)))
        .attr('opacity', 0.5)

}

drawRadarWeatherChart();
