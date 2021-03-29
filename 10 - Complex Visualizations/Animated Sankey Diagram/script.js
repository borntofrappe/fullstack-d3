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
    accDataset[key] = probabilities;
    return accDataset;
  }, {});


  const getRandomValue = (array) => array[Math.floor(Math.random() * array.length)];

  function generatePerson() {
    const sex = getRandomValue(sexIds);
    const ses = getRandomValue(sesIds);

    const key = getStatusKey({sex: sexNames[sex], ses: sesNames[ses]});
    const probabilities = stackedProbabilities[key];
    const probability = Math.random();
    const education = d3.bisect(probabilities, probability);


    return {
      sex,
      ses,
      education
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
  const startLabelGroup = peripheralsGroup.append('g').attr('transform', 'translate(-8, 0)')
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

      endLabelFemaleGroup
      .append('circle')
      .attr('opacity', 0.5)
      .attr('r', 5)

      endLabelFemaleGroup
      .append('g')
      .attr('transform', 'translate(20 1)')
      .attr('font-size', 12)
      .attr('dominant-baseline', 'middle')
      .selectAll('text')
      .data(d => Array(sesIds.length).fill().map((datum, i) => `v--1--${i}--${d}`))
      .enter()
      .append('text')
      .attr('id', d => d)
      .text(0)
      .attr('transform', (d, i) => `translate(${24 * i} 0)`)

      const endLabelMaleGroup = endLabelGroups
      .append('g')
      .attr('transform', 'translate(5 30)');


      endLabelMaleGroup
      .append('path')
      .attr('opacity', 0.5)
      .attr('d', 'M -6 5 L 6 5 0 -5')

      endLabelMaleGroup
      .append('g')
      .attr('transform', 'translate(20 1)')
      .attr('font-size', 12)
      .attr('dominant-baseline', 'middle')
      .selectAll('text')
      .data(d => Array(sesIds.length).fill().map((datum, i) => `v--0--${i}--${d}`))
      .enter()
      .append('text')
      .attr('id', d => d)
      .text(0)
      .attr('transform', (d, i) => `translate(${24 * i} 0)`)


      d3.select('#v--0--0--5').text(12)
}

drawAnimatedSankey();