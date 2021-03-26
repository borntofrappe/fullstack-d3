async function drawRadarWeatherChart() {
  /* ACCESS DATA */
  const dataset = await d3.json('../../nyc_weather_data.json');

  /* CHART DIMENSIONS */
  const dimensions = {
    size: 600,
    margin: 50,
  };

  dimensions.boundedSize = dimensions.size - (dimensions.margin * 2);
  dimensions.boundedRadius = dimensions.boundedSize / 2;
  /* SCALES */

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

  bounds.append('circle').attr('r', 5)
    
}

drawRadarWeatherChart();
