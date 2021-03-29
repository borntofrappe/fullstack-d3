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
    height: 500,
    margin: {
      top: 10,
      right: 200,
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
  .attr('stroke', 'currentColor')
  .attr('stroke-width', dimensions.pathHeight)


}

drawAnimatedSankey();