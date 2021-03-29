async function drawAnimatedSankey() {
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

  console.table(stackedProbabilities);


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
  
  console.table(generatePerson())



}

drawAnimatedSankey();