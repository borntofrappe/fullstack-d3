async function drawDashboard() {
  const dataset = await d3.json('../../nyc_weather_data.json');

  const icons = {
    'uv-index': `<svg width="1em" height="1em" viewBox="0 0 100 100" aria-focusable="false" aria-hidden="true">
      <path fill="currentColor" d="m50 0a8.8 8.8 0 0 0-8.801 8.801 8.8 8.8 0 0 0 8.801 8.799 8.8 8.8 0 0 0 8.801-8.799 8.8 8.8 0 0 0-8.801-8.801zm-29 12.07a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm58.27 0a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm-29.26 15.93a22 22 0 0 0-22 22 22 22 0 0 0 22 22 22 22 0 0 0 22-22 22 22 0 0 0-22-22zm-41.2 13.2a8.8 8.8 0 0 0-8.801 8.801 8.8 8.8 0 0 0 8.801 8.801 8.8 8.8 0 0 0 8.799-8.801 8.8 8.8 0 0 0-8.799-8.801zm82.4 0a8.8 8.8 0 0 0-8.799 8.801 8.8 8.8 0 0 0 8.799 8.801 8.8 8.8 0 0 0 8.801-8.801 8.8 8.8 0 0 0-8.801-8.801zm-70.2 29.13a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm58.27 0a8.8 8.8 45 0 0-6.352 2.576 8.8 8.8 45 0 0 0 12.45 8.8 8.8 45 0 0 12.45 0 8.8 8.8 45 0 0 0-12.45 8.8 8.8 45 0 0-6.094-2.576zm-29.26 12.07a8.8 8.8 0 0 0-8.801 8.799 8.8 8.8 0 0 0 8.801 8.801 8.8 8.8 0 0 0 8.801-8.801 8.8 8.8 0 0 0-8.801-8.799z" />
    </svg>`,
    'snow': `<svg width="1em" height="1em" viewBox="0 0 100 100" aria-focusable="false" aria-hidden="true">
    <path fill="currentColor" d="m50 0a8.8 8.8 0 0 0-8.801 8.801 8.8 8.8 0 0 0 8.801 8.799 8.8 8.8 0 0 0 8.801-8.799 8.8 8.8 0 0 0-8.801-8.801zm-29 12.07a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm58.27 0a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm-29.26 15.93a22 22 0 0 0-22 22 22 22 0 0 0 22 22 22 22 0 0 0 22-22 22 22 0 0 0-22-22zm-41.2 13.2a8.8 8.8 0 0 0-8.801 8.801 8.8 8.8 0 0 0 8.801 8.801 8.8 8.8 0 0 0 8.799-8.801 8.8 8.8 0 0 0-8.799-8.801zm82.4 0a8.8 8.8 0 0 0-8.799 8.801 8.8 8.8 0 0 0 8.799 8.801 8.8 8.8 0 0 0 8.801-8.801 8.8 8.8 0 0 0-8.801-8.801zm-70.2 29.13a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm58.27 0a8.8 8.8 45 0 0-6.352 2.576 8.8 8.8 45 0 0 0 12.45 8.8 8.8 45 0 0 12.45 0 8.8 8.8 45 0 0 0-12.45 8.8 8.8 45 0 0-6.094-2.576zm-29.26 12.07a8.8 8.8 0 0 0-8.801 8.799 8.8 8.8 0 0 0 8.801 8.801 8.8 8.8 0 0 0 8.801-8.801 8.8 8.8 0 0 0-8.801-8.799z" />
  </svg>`,
  'plus': `<svg width="1em" height="1em" viewBox="0 0 100 100" aria-focusable="false" aria-hidden="true">
    <path fill="currentColor" d="m50 0a8.8 8.8 0 0 0-8.801 8.801 8.8 8.8 0 0 0 8.801 8.799 8.8 8.8 0 0 0 8.801-8.799 8.8 8.8 0 0 0-8.801-8.801zm-29 12.07a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm58.27 0a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm-29.26 15.93a22 22 0 0 0-22 22 22 22 0 0 0 22 22 22 22 0 0 0 22-22 22 22 0 0 0-22-22zm-41.2 13.2a8.8 8.8 0 0 0-8.801 8.801 8.8 8.8 0 0 0 8.801 8.801 8.8 8.8 0 0 0 8.799-8.801 8.8 8.8 0 0 0-8.799-8.801zm82.4 0a8.8 8.8 0 0 0-8.799 8.801 8.8 8.8 0 0 0 8.799 8.801 8.8 8.8 0 0 0 8.801-8.801 8.8 8.8 0 0 0-8.801-8.801zm-70.2 29.13a8.8 8.8 0 0 0-6.352 2.576 8.8 8.8 0 0 0 0 12.45 8.8 8.8 0 0 0 12.45 0 8.8 8.8 0 0 0 0-12.45 8.8 8.8 0 0 0-6.094-2.576zm58.27 0a8.8 8.8 45 0 0-6.352 2.576 8.8 8.8 45 0 0 0 12.45 8.8 8.8 45 0 0 12.45 0 8.8 8.8 45 0 0 0-12.45 8.8 8.8 45 0 0-6.094-2.576zm-29.26 12.07a8.8 8.8 0 0 0-8.801 8.799 8.8 8.8 0 0 0 8.801 8.801 8.8 8.8 0 0 0 8.801-8.801 8.8 8.8 0 0 0-8.801-8.799z" />
  </svg>`,
  }


  const timeParseMilliseconds = d3.timeParse("%Q");
  const timeFormatMilliseconds = d3.timeFormat('%-I %p')
  const timeParseDate = d3.timeParse('%Y-%m-%d');
  const timeFormatDate = d3.timeFormat('%-m/%d');
  const timeFormatHour = d3.timeFormat('%-H');

  const formatTemperatureMax = d3.format('.1f')
  const formatWindSpeed = d3.format('.2f')

  const positionScale = d3.scaleLinear()
    .domain([0, 23])
    .range([0, 100]);

  const colorTemperatureMaxScale = d3.scaleLinear()
    .domain(d3.extent(dataset, d => d.temperatureMax))
    .range(['hsl(199, 100%, 85%)', 'hsl(0, 100%, 81%)']);

    const colorWindSpeedScale = d3.scaleLinear()
    .domain(d3.extent(dataset, d => d.windSpeed))
    .range(['hsl(0, 0%, 100%)', 'hsl(209, 19%, 72%)']);

    const temperatureMaxClass = 'temperatureMax'
    const windSpeedClass = 'windSpeed'

  const uvIndexThreshold = 3;
  const metrics = [
    {
      key: 'date',
      label: 'Day',
      align: 'left',
      render: d => timeFormatDate(timeParseDate(d)),
    },
    {
      key: 'summary',
      label: 'Summary',
      align: 'left',
      render: d => d
    },
    {
      key: 'temperatureMax',
      label: 'Max Temp',
      align: 'right',
      class: temperatureMaxClass,
      render: d => formatTemperatureMax(d)
    },
    {
      key: 'temperatureMaxTime',
      label: 'Max Temp Time',
      align: 'center',
      // render: d => timeFormatMilliseconds(timeParseMilliseconds(d))
      render: d => `<span aria-label="${timeFormatMilliseconds(timeParseMilliseconds(d))}"><svg width="100" height="10" viewBox="0 0 100 10" style="width: 100%; height: auto;"><g transform="translate(${positionScale(parseInt(timeFormatHour(timeParseMilliseconds(d))))} 0)"><path fill="none" stroke="currentColor" stroke-width="1" d="M 0 0 v 10" /></g></svg></span>`
    },
    {
      key: 'windSpeed',
      label: 'Wind Speed',
      align: 'right',
      class: windSpeedClass,
      render: d => formatWindSpeed(d)
    },
    {
      key: 'precipType',
      label: 'Did Snow',
      align: 'center',
      render: d => d === 'snow' ? `<span aria-label="Snow">${icons['snow']}</span>` : ''
    },
    {
      key: 'uvIndex',
      label: 'UV Index',
      align: 'left',
      render: d => `<span aria-label="${d}">${Array(d3.min([d, uvIndexThreshold])).fill().map(() => icons['uv-index']).join('')}${d > uvIndexThreshold ? icons['plus'] : ''}</span>` 
    },
  ]

  const table = d3.select('#wrapper').append('table');
  table
    .append('thead')
    .append('tr')
    .selectAll('th')
    .data(metrics)
    .enter()
    .append('th')
    .style('text-align', d => d.align)
    .text(d => d.label);

  const tableRows = table
    .append('tbody')
    .selectAll('tr')
    .data(dataset)
    .enter()
    .append('tr');

  tableRows
    .selectAll('td')
    .data(d => metrics.map(metric => ({
      key: metric.key,
      class: metric.class,
      value: d[metric.key],
      align: metric.align,
      render: metric.render
    })))
    .enter()
    .append('td')
    .attr('class', d => d.class ? d.class : '')
    .style('text-align', d => d.align)
    .html(d => d.render(d.value));

  d3.selectAll('td.windSpeed')
    .style('background', d => colorWindSpeedScale(d.value))

  d3.selectAll(`td.${temperatureMaxClass}`)
  .style('background', d => colorTemperatureMaxScale(d.value))

}

drawDashboard();
