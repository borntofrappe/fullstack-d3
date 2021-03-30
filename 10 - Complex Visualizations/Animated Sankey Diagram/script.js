async function drawAnimatedSankey() {
  /* ACCESS DATA */
  const dataset = await d3.json('./education.json');

  const sexAccessor = d => d.sex;
  const sexNames = ['female', 'male']
  const sexIds = d3.range(sexNames.length)

  
  const educationAccessor = d => d.education;
  const educationNames = ["<High School", "High School", "Some Post-secondary", "Post-secondary", "Associate's", "Bachelor's and up"]
  const educationIds = d3.range(educationNames.length)

  const sesAccessor = d => d.ses;
  const sesNames = ['low', 'middle', 'high']
  const sesIds = d3.range(sesNames.length)

  const getStatusKey = ({sex, ses}) => `${sex}--${ses}`;

  const stackedProbabilities = dataset.reduce((accDataset, currDataset) => {
    const { sex, ses } = currDataset;
    const key = getStatusKey({sex, ses});
     `${sexAccessor(currDataset)}--${sesAccessor(currDataset)}`;
    const probabilities = educationNames.reduce((accEducation, currEducation, i) => {
      return [...accEducation, i < educationNames.length - 1 ? accEducation[accEducation.length - 1] + currDataset[currEducation] / 100 : 1];
    }, [0]);
    accDataset[key] = probabilities.slice(1);
    return accDataset;
  }, {});


  const getRandomValue = (array) => array[Math.floor(Math.random() * array.length)];
  const getRandomNumberInRange = (min, max) => Math.random() * (max - min) + min;

  function generatePerson(elapsed) {
    const sex = getRandomValue(sexIds);
    const ses = getRandomValue(sesIds);

    const key = getStatusKey({sex: sexNames[sex], ses: sesNames[ses]});
    const probabilities = stackedProbabilities[key];
    const probability = Math.random();
    const education = d3.bisect(probabilities, probability);


    return {
      sex,
      ses,
      education,
      startTime: elapsed,
      yJitter: getRandomNumberInRange(-15, 15)
    }

  }

  /* CHART DIMENSIONS */

  const dimensions = {
    width: 1000,
    height: 520,
    margin: {
      top: 10,
      right: 180,
      bottom: 10,
      left: 120,
    },
    pathHeight: 50
  }

  dimensions.boundedWidth = dimensions.width - (dimensions.margin.left + dimensions.margin.right)
  dimensions.boundedHeight = dimensions.height - (dimensions.margin.top + dimensions.margin.bottom)

  /* SCALES */
  const colorScale = d3.scaleLinear()
  .domain(d3.extent(sesIds))
  .range(['#12CBC4', '#B53471'])
  .interpolate(d3.interpolateHcl);

  const xScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, dimensions.boundedWidth])
    .clamp(true);

    const startYScale = d3.scaleLinear()
    .domain([sesIds.length, -1])
    .range([0, dimensions.boundedHeight])

    const endYScale = d3.scaleLinear()
    .domain([educationIds.length, -1])
    .range([0, dimensions.boundedHeight])

  const linkPoints = 6;
  const linkGenerator = d3
    .line()
    .x((d, i) => i * dimensions.boundedWidth / (linkPoints - 1))
    .y((d, i) => i < linkPoints / 2 ? startYScale(d[0]) : endYScale(d[1]))
    .curve(d3.curveMonotoneX)

  const linkOptions = d3.merge(sesIds.map(startId => educationIds.map(endId => Array(linkPoints).fill([startId, endId]))))

  /* DRAW DATA */
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
  )

  const linksGroup = bounds.append('g')

  linksGroup
  .selectAll('path')
  .data(linkOptions)
  .enter()
  .append('path')
  // .attr('d', d => linkGenerator(d))
  .attr('d', linkGenerator)
  .attr('fill', 'none')
  .attr('stroke', 'white')
  .attr('stroke-width', dimensions.pathHeight)

  /* PERIPHERALS */
  const peripheralsGroup = bounds.append('g')
  const startLabelGroup = peripheralsGroup.append('g').attr('transform', 'translate(-16, 0)')
  .attr('text-anchor', 'end')
  .attr('fill', 'currentColor')
  
  const startLabel = startLabelGroup
    .append('text')
    .attr('font-size', 12)
    .attr('y', startYScale(sesIds[sesIds.length - 1]) - 64)
    
  startLabel
    .append('tspan')
    .text('Socioeconomic')
  startLabel
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 16)
    .text('Status')

  startLabelGroup
    .append('g')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 15)
    .selectAll('text')
    .data(sesIds)
    .enter()
    .append('text')
    .text(d => sesNames[d])
    .attr('y', d => startYScale(d))
    .style('text-transform', 'capitalize')

    const endLabelGroup = peripheralsGroup.append('g').attr('transform', `translate(${dimensions.boundedWidth + 12}, 0)`)
    .attr('text-anchor', 'start')
    .attr('fill', 'currentColor')
    
    const endLabelGroups = endLabelGroup
      .selectAll('g')
      .data(educationIds)
      .enter()
      .append('g')
      .attr('transform', d => `translate(0 ${endYScale(d) - dimensions.pathHeight / 2 + 12})`);

      endLabelGroups
      .append('text')
      .attr('font-size', 15)
      .text(d => educationNames[d])
      .style('text-transform', 'capitalize')

      const endLabelFemaleGroup = endLabelGroups
        .append('g')
        .attr('transform', 'translate(5 14)')

      const radiusCircle = 5;

      endLabelFemaleGroup
      .append('circle')
      .attr('opacity', 0.5)
      .attr('r', radiusCircle)

      endLabelFemaleGroup
      .append('g')
      .attr('transform', 'translate(20 1)')
      .attr('font-size', 12)
      .attr('dominant-baseline', 'middle')
      .selectAll('text')
      .data(d => Array(sesIds.length).fill().map((datum, i) => ({
        id: `v--1--${i}--${d}`,
        ses: i,
        offset: 24 * i
      })))
      .enter()
      .append('text')
      .attr('fill', d => colorScale(sesAccessor(d)))
      .attr('id', d => d.id)
      .text(0)
      .attr('transform', (d) => `translate(${d.offset} 0)`)

      const endLabelMaleGroup = endLabelGroups
      .append('g')
      .attr('transform', 'translate(5 30)');

      const pointsTriangle = [
        [-6, 5],
        [6, 5],
        [0, -5],
      ].join(',')

      endLabelMaleGroup
      .append('polygon')
      .attr('opacity', 0.5)
      .attr('points', pointsTriangle)

      endLabelMaleGroup
      .append('g')
      .attr('transform', 'translate(20 1)')
      .attr('font-size', 12)
      .attr('dominant-baseline', 'middle')
      .selectAll('text')
      .data(d => Array(sesIds.length).fill().map((datum, i) => ({
        id: `v--0--${i}--${d}`,
        ses: i,
        offset: 24 * i
      })))
      .enter()
      .append('text')
      .attr('fill', d => colorScale(sesAccessor(d)))
      .attr('id', d => d.id)
      .text(0)
      .attr('transform', (d) => `translate(${d.offset} 0)`)


    const markersGroup = bounds.append('g');
    let people = [];

    const timer = d3.timer(updateMarkers)

    const yProgressScale = d3.scaleLinear()
      .domain([0.45, 0.55])
      .range([0, 1])
      .clamp(true);

      const time = 5000;
    const xProgressAccessor = (elapsed, d) => (elapsed - d.startTime) / time

    function updateMarkers(elapsed) {
      people.push(generatePerson(elapsed));
      const updateFemales = markersGroup
        .selectAll('.marker-circle')
        .data(people.filter(d =>sexAccessor(d) === 0 && xProgressAccessor(elapsed, d) < 1));

      updateFemales
        .enter()
        .append('circle')
        .attr('fill', d => colorScale(sesAccessor(d)))
        .attr('class', 'marker marker-circle')
        .attr('r', radiusCircle)

      updateFemales
        .exit()
        .remove()

      const updateMale = markersGroup
        .selectAll('.marker-triangle')
        .data(people.filter(d =>sexAccessor(d) === 1 && xProgressAccessor(elapsed, d) < 1));

      updateMale
        .enter()
        .append('polygon')
        .attr('fill', d => colorScale(sesAccessor(d)))
        .attr('class', 'marker marker-triangle')
        .attr('points', pointsTriangle)

      
      d3.selectAll('.marker')
        .attr('transform', (d) => {
          const xProgress = xProgressAccessor(elapsed, d);
          const x = xScale(xProgress)
          const yStart = startYScale(sesAccessor(d))
          const yEnd = endYScale(educationAccessor(d))
          const yGap = yEnd - yStart;
          const yProgress = yProgressScale(xProgress);
          const y = yStart + (yGap * yProgress) + d.yJitter
          
          return `translate(${x} ${y})`
        })

      

      
      if(elapsed > time * 1.5) {
        timer.stop()
      }
    }



    const barsWidth = 14;
    const barsGroup = bounds.append('g').attr('fill', 'currentColor');
    barsGroup
      .append('g')
      .selectAll('rect')
      .data(sesIds)
      .enter()
      .append('rect')
      .attr('fill', d => colorScale(d))
      .attr('x', -barsWidth / 2)
      .attr('width', barsWidth)
      .attr('y', d => startYScale(d) - dimensions.pathHeight / 2)
      .attr('height', dimensions.pathHeight)

      // barsGroup
      // .append('g')
      // .selectAll('rect')
      // .data(educationIds)
      // .enter()
      // .append('rect')
      // .attr('x', dimensions.boundedWidth -barsWidth / 2)
      // .attr('width', barsWidth)
      // .attr('y', d => endYScale(d) - dimensions.pathHeight / 2)
      // .attr('height', dimensions.pathHeight)


}

drawAnimatedSankey();