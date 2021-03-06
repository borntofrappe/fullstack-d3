# Fullstack D3

[_Fullstack D3_](https://www.newline.co/fullstack-d3) is an incredibly informative book from [_Amelia Wattenberger_](https://wattenberger.com/) centered on the D3 library. With this folder I replicate the examples provided in the book, and annotate the lessons learned in the process.

_Please note_:

- I am quite familiar with the D3 library already, and I approach the book with the goal of improving my workflow

- the visualizations are recreated D3 version 6, retrieved from [unpkg.com](https://unpkg.com/d3) on March 4th 2021

## Setup

At least for the first few visualizations, data is retrieved from a file in `.json` format. To bypass the CORS safety restriction, it is first necessary to set up a server. The node package `live-server` readily accommodates for this need.

```bash
npm install -g live-server
```

Once installed, `live-server` provides a live environment on `http://localhost:8080/` (default port).

```bash
live-server
```

## 01 - Line Chart

The book begins immediately with a line chart. It is useful to introduce D3, but also the flow for every visualization.

| Module (`d3-`) | Function (`d3.`)       |
| -------------- | ---------------------- |
| fetch          | json                   |
| selection      | select                 |
| time-format    | timeParse              |
| scale          | scaleLinear, scaleTime |
| array          | extent                 |
| shape          | line                   |
| axis           | axisLeft, axisBottom   |

### Accessor functions

Accessor functions are functions detailing which values to use in the visualization.

```js
const yAccessor = (d) => d.temperatureMax;
```

Such a construct is useful to access the data, for instance when describing the domain of a scale.

```js
const yScale = d3
  .scaleLinear()
  // .domain(d3.extent(dataset, d => d.temperatureMax))
  .domain(d3.extent(dataset, yAccessor));
```

Or again, for the coordinates for the line generator function.

```js
const lineGenerator = d3
  .line()
  // .y((d) => yScale(d.temperature))
  .y((d) => yScale(yAccessor(d)));
```

Included at the top of the script, accessor functions are also useful to contextualize the visualization, to highlight which metric is analysed.

### Wrapper and bounds

The line chart is included in an SVG element `<svg>` and it is furthermore inside of a group element `<g>`.

```html
<!-- wrapper -->
<svg>
  <!-- bounds -->
  <g></g>
</svg>
```

This layered structure is useful to safely draw the visualization and peripherals (axes, labels), without fear of cropping the visuals. Anything falling outside of the `<svg>` SVG element `<svg>` is indeed not rendered.

The wrapping SVG element is attributed an arbitrary width, height and margin.

```js
const dimensions = {
  width: 600,
  height: 400,
  margin: {
    top: 20,
    right: 20,
    bottom: 50,
    left: 80,
  },
};
```

The dimensions of the bounds are then determined by the margin introduced on either side.

```js
dimensions.boundedWidth =
  dimensions.width - (dimensions.margin.left + dimensions.margin.right);
dimensions.boundedHeight =
  dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);
```

### Axis and `call`

To include an axis, you first create the peripheral with the `d3-axis` module.

```js
const yAxisGenerator = d3.axisLeft().scale(yScale);
```

The generator function is then able to include the axis matching the scale in an existing element, like a group element `<g>`.

```js
const yAxis = bounds.append('g');
yAxisGenerator(yAxis);
```

In this intance, the `.call` method provides a convenient alternative by calling the generator function with the current selection.

```js
bounds.append('g').call(yAxisGenerator);
```

## 02 - Scatterplot

The second visualization is useful to repeat the concepts introduced with the line chart and also describe the concept of a data join.

| Module (`d3-`) | Function (`d3.`)                    |
| -------------- | ----------------------------------- |
| selection      | selectAll, enter, exit, merge, join |

### Data Join

The visualization includes one circle for each data point, mapping the dew point to the axis, the humidity to the `y` axis, and the cloud cover to the `fill`, the color of the shape.

It is technically possible to append the circles with a for loop, for instance with a `forEach` iterator.

```js
dataset.forEach((point) => {
  groupCircles.append('circle').attr('...', '...');
});
```

However, D3 provide the concept of a data join to bind the data to DOM elements. With this binding, each element is linked to a data point, and the visualization can be updated knowing which value is already included.

The binding can be implemented in at least two ways.

1. select, data, enter

   Start by selecting every circle. As no circle is included in the visualization, D3 now describes an empty selection.

   ```js
   groupCircles.selectAll('circle');
   ```

   With the `data` function, build a selection which knows the elements needed to map the data. In the specific example, a selection which describes all new elements, as no circle is included in the visualization and no data point is represented.

   ```js
   groupCircles.selectAll('circle').data(dataset);
   ```

   With the `enter` function, access the data points which need to be included in the visualization.

   ```js
   groupCircles.selectAll('circle').data(dataset).enter();
   ```

   Finally, include a circle element for each item of the collection.

   ```js
   groupCircles
     .selectAll('circle')
     .data(dataset)
     .enter()
     .append('circle')
     // other defining attributes
     .attr('r', 5);
   ```

   While the implementation may seem convoluted, it helps to know that, when you use the `data` function, the selection returned by D3 differentiates the elements with a `_enter` and `_exit` key. The first type describes items which are not represented in the visualizations, data points which are not already mapped to a circle. The second type describes items which were represented, but should no longer be, circles exceeding the sufficient amount.

   ```js
   const update = groupCircles.selectAll('circle').data(dataset);

   const enter = update.enter();

   enter
     .append('circle')
     // other defining attributes
     .attr('r', 5);

   // exit = update.exit();
   ```

   To consider both new and existing elements, for instance, to attribute a color to all elements in the visualization, the `.merge` function marries the enter and update selection.

   ```js
   enter
     .append('circle')
     // other defining attributes
     .attr('r', 5)
     .merge(update)
     .attr('fill', 'red');
   ```

2. join

   Introduced in a later version of `d3-selection` module ([v1.4.0](https://github.com/d3/d3-selection/releases/tag/v1.4.0)), the `.join` function provides a different interface for data binding.

   In the specific example, it allows to draw one circle for each data point by calling directly the desired shape.

   ```js
   groupCircles
     .selectAll('circle')
     .data(dataset)
     .join('circle')
     // other defining attributes
     .attr('r', 5);
   ```

   In a more structured manner, the `join()` function allows to target the different selections with a series of callback functions.

   ```js
   groupCircles
     .selectAll('circle')
     .data(dataset)
     .join(
       // (update) => ,
       (enter) =>
         enter
           .append('circle')
           // other defining attributes
           .attr('r', 5)
       // (exit) => ,
     );
   ```

   Here it is possible to manage the enter, update and exit selections directly.

_Please note_:

- try to log the value returned by a function to understand what said function does This is useful, for instance, to see how D3 manages the selection following the `data()` function, the `_enter` and `_exit` keys.

  ```js
  const update = groupCircles.selectAll('circle').data(dataset);
  console.log(upate);,
  ```

- in the script I implemented data binding with the first approach, but continued exploring the concept with other instructions. These are commented out, but fundamentally create the same visualizatio as the first one.

## 03 - Bar Charts

The project is useful to introduce another generator function in `d3.bin`, and a couple helper functions in `d3.mean` and `selection.filter`.

The chapter is also and extremely useful in terms of accessibility, with a first set of attributes to make the visualization accessible for screen readers.

| Module (`d3-`) | Function (`d3.`) |
| -------------- | ---------------- |
| array          | bin, mean        |
| selection      | filter           |

### ~Histogram~ Bin

The book describes the `d3.histogram` function to create a series of bins, a series of arrays in which to slot the data points. [Since version 6](https://github.com/d3/d3/blob/master/CHANGES.md#breaking-changes), however, the function has been renamed to `d3.bin`.

```js
// const binGenerator = d3
// .histogram()
const binGenerator = d3.bin();
```

According to details in [the migration guide](https://observablehq.com/@d3/d3v6-migration-guide#bin), it seems `d3.histogram` is preserved as an alias, but it is ultimately deprecated.

### Mean

`d3-array` provides a few helper functions for summary statistics, among which `d3.mean`. In the visualization, the function is used to highlight the mean with a line and text label.

```js
const mean = d3.mean(dataset, metricAccessor);
```

### Filter

A selection can be filtered according to a function. In the specific project, it is used to have the text label for the histogram bars only on the bars describing at least one observation.

```js
const textGroups = binGroups.filter(yAccessor);
```

`yAccessor` returns the length of the bin, which if `0` describes a falsy value. The function works essentially as a shorthand for the following snippet.

```js
const textGroups = binGroups.filter((d) => yAccessor(d) !== 0);
```

### Accessibility

The visualization is made accessible for screen readers with a selection of elements and attributes.

- the `title` element introduces the visualization

  ```html
  <svg>
    <title>Describe the visualization</title>
  </svg>
  ```

- the `tabindex` attribute allows to have specific elements select-able through keyboard.

  In the individual bar chart, the idea is to focus on the SVG container, the group element nesting all the histogram bars, and the group element responsible for the individual bars

  ```html
  <svg tabindex="0">
    <!-- group nesting all the bars -->
    <g tabindex="0">
      <!-- groups nesting the individual bars -->
      <g tabindex="0"></g>
      <g tabindex="0"></g>
      <!-- ... -->
    </g>
  </svg>
  ```

- the `role` attribute identifies the specific purpose of the select-able elements, while `aria-label` provides an informative label

  ```html
  <svg role="figure">
    <g role="list" aria-label="Histogram bars">
      <g role="listitem" aria-label="Describe bar"></g>
      <g role="listitem" aria-label="Describe bar"></g>
      <!-- ... -->
    </g>
  </svg>
  ```

## 04 - Animation and Transitions

The chapter describes three methods to smoothly change a value over time, with the `<animate>` element, CSS's `transition` property and D3's own `transition` method. With the project folder, however, I elected to focus on the last approach only.

### Fixtures and updates

### Data binding

### transition
