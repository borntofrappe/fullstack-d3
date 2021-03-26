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

This layered structure is useful to safely draw the visualization and peripherals (axis, labels), without fear of cropping the visuals. Anything falling outside of the `<svg>` SVG element `<svg>` is indeed not rendered.

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

The chapter describes three methods to smoothly change a value over time, with the `<animate>` element (SVG), the`transition` property (CSS) and the `transition` method (D3). With the project folder, I elected to focus on the last approach only.

D3 provides a `.transition` method to interpolate between a start and end state. Essentially, it is enough to apply a transition as follows:

```js
d3.select('rect').attr('width', 0).transition().attr('width', 100);
```

In this instance, the selected rectangle is updated to have a final width of `100`.

### Bar Chart

Before introducing the `transition` method in the context of a bar chart, it is important to have a discussion on the structure of the visualization, and again on the concept of a data join.

#### Static and Dynamic

The function creating the visualization is divided between static and dynamic instructions. Static are those lines included regardless of the state of the visualization: the object describing the dimensions of the SVG element `<svg>`, the SVG wrapper itself, the group element making up the bounds. Dynamic are those lines which change depending on the input data, and in the specific example the metric chosen for the histogram: the scales, the position and height of the rectangles.

#### Data Join

The concept of the data join, as introduced in the second chapter _02 - Scatterplot_, allows to bind data to DOM element, and it is here essential to have D3 manage the transition new, existing and old elements.

`drawHistogram` begins by selecting group elements `<g>` and binding the data provided by the bins.

```js
const binGroups = binsGroup.selectAll('g').data(bins);
```

From this starting point, `binGroups` describes the update selection, in other words those group elements `<g>` which already exist. New (missing) elements are identified with the `enter` function, while old (excessive) elements with the `exit` method.

```js
const newBinGroups = binGroups.enter();
const oldBinGroups = binGroups.exit();
```

With this structure, it is finally possible to update the visualization as needed. In the speficic example:

- old elements are removed with the `remove` function

  ```js
  oldBinGroups.remove();
  ```

- new elements are included through a group element

  ```js
  const newBinGroups = binGroups.enter().append('g');
  ```

  The groups are then used to add the desired label and rectangle

  ```js
  newBinGroups.filter(yAccessor).append('text');
  // set attributes and properties

  newBinGroups.append('rect');
  // set attributes and properties
  ```

- existing element modify the position and text of the labels, not to mention the position and size of the bars

  ```js
  binGroups.filter(yAccessor).select('text');
  // modify attributes and properties

  binGroups.select('rect');
  // modify attributes and properties
  ```

#### Transition

Coming back to the topic of the chapter, `transition` is applied to a selection object creating a transition object.

```js
binGroups
  .select('rect')
  .transition()
  .attr('y', (d) => yScale(yAccessor(d)));
```

The change can be customized in duration and delay with matching functions.

```js
binGroups
  .select('rect')
  .transition()
  .duration(500)
  .delay(100)
  .attr('y', (d) => yScale(yAccessor(d)));
```

Multiple transitions can also be chained by using the method repeatedly.

```js
binGroups
  .select('rect')
  .transition()
  .duration(500)
  .delay(100)
  .attr('y', (d) => yScale(yAccessor(d)))
  .transition()
  .attr('fill', 'cornflowerblue');
```

In this instance the color is modified _after_ the rectangle rectangle reaches its `y` coordinate.

On its own, `transition` is already useful to smoothly change attributes and properties. It is however possible to initialize a transition on the root element with `d3.transition`, and later reference the transition as the argument of a `transition` function.

```js
const updateTransition = d3.transition().duration(500).delay(100);

binGroups
  .select('rect')
  .transition(updateTransition)
  .attr('y', (d) => yScale(yAccessor(d)));
```

With this structure the necessary transitions are initialised ahead of time, and can be repeated throughout the code to synchronize change on multiple elements.

```js
binGroups.select('rect').transition(updateTransition);
// ...

binGroups.filter(yAccessor).select('text').transition(updateTransition);
// ...
```

Multiple transitions can then be chained to have the change happen in sequence.

```js
const exitTransition = d3.transition().duration(500);

const updateTransition = exitTransition.transition().duration(1000);
```

### Line

The goal is to update the line chart introduced in the first chapter, _01 Line Chart_, in order to show a fixed number of days. The days are then modified to have the line progress through the year, and analyse the contribution of each passing day.

_Please note:_ the code might differ from that proposed in the book, as I attempted to create the transition on my own.

#### Static and Dynamic

As in the demo animating the bar chart, the function creating the visualization includes static and dynamic elements. With `drawDays`, the idea is to receive a subset of the original dataset, and modify the axis and the line accordingly.

#### Transition

For the axis, it is enough to use the `transition` method before executing the axis generator.

```js
yAxisGroup.transition().call(yAxisGenerator);
xAxisGroup.transition().call(xAxisGenerator);
```

For the line, however, the same solution produces the undesired effect of a wriggle.

```js
line.transition(transition).attr('d', lineGenerator(data));
```

This is because D3 is updating the `d` attribute of the line point by point. Consider the following example, where the line is described with a series of points (`L`, or _line to_, instructs the path element to continue the line toward a certain (`x`, `y`) pairing).

```html
<!-- assuming y coordinates (0, -5, -10, -8)  -->
<path d="M 0 0 L 1 -5 L 2 -10 L 3 -8" />
<!-- assuming next coordinate (-2)  -->
<path d="M 0 -5 L 1 -10 L 2 -8 L 3 -2" />
```

The first point `(0, 0)` is updated to be `(0, -5)`, resulting in the point moving upwards. As the idea of the animation is to scroll the line toward the left, the solution is to here move the points horizontally:

- while updating the `d` attribute, shift the entire line to the right

  ```js
  .attr('d', lineGenerator(data))
  .style('transform', `translate(${x}px, 0px)`);
  ```

  With this translation, the line doesn't wriggle, as the `x` coordinate is preserved. The last point exceeds the horizontal dimension of the chart, however.

- with a transition, remove the offset to have the points move to the left

  ```js
  .attr('d', lineGenerator(data))
  .style('transform', `translate(${x}px, 0px)`)
  .transition(transition)
  .style('transform', 'translate(0px, 0px)');
  ```

  After the translation, the new point resides at the very end of the line, in its rightful `x` coordinate.

There are two important aspects I left out, but I thought of explaining the concept first before describing these details:

1. how much to translate the line

2. how to show the points only in the area described by `dimensions.boundedWidth` and `dimensions.boundedHeight`

To tackle the first issue, the line is translated by the space between two successive points. The book picks the very last two points, to stress the importance of the new data, but ideally any pair of points would do (this is knowing that the data points are all separated by 1 day).

```js
const lastTwoPoints = data.slice(-2);
const pixelsBetweenLastPoints =
  xScale(xAccessor(data[1])) - xScale(xAccessor(data[0]));

// equivalent measure

const pixelsBetweenSuccessivePoints =
  xScale(xAccessor(data[1])) - xScale(xAccessor(data[0]));
```

To fix the second issue, it is instead necessary to introduce a new SVG element in `<clipPath>`. Defined in the a `<defs>` element, the clip describes the area in which elements are actually shown. In the instance of the line chart, it describes a rectangle spanning the bounded width and height.

```js
bounds
  .append('defs')
  .append('clipPath')
  .append('rect')
  .attr('width', dimensions.boundedWidth)
  .attr('height', dimensions.boundedHeight);
```

With an identifier, it is then possible to link the clip to the group element nesting the line, so that the line is shown only in the prescribed rectangle.

```js
bounds.append('defs').append('clipPath').attr('id', 'bounds-clip-path');
// clipping area

const lineGroup = bounds
  .append('g')
  .attr('clip-path', 'url(#bounds-clip-path)');
```

#### Minor Tweaks

- the different parts of the visualization, like the axis, the line, the rectangle, are all nested in group elements `<g>`

- the rectangle describing the freezing area limits the `y` coordinate to the bounded height

  ```js
  const freezingTemperatureY = d3.min([dimensions.boundedHeight, yScale(32)]);
  ```

  Without this precaution, the risk is to have a negative height, as the height is computed by subtracting the `y` coordinate to the bounded threshold

  ```js
  rectangle
    .attr('y', freezingTemperatureY)
    .attr('height', dimensions.boundedHeight - freezingTemperatureY);
  ```

- the horizontal scale considers the input data from the second point

  ```js
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data.slice(1), xAccessor))
    .range([0, dimensions.boundedWidth]);
  ```

  This is to avoid removing the first point while first point is still visible. Starting with the second point, the first one is mapped to a negative `x` coordinate, which means it is finally removed outisde of the clip area. Comment out the clip to assess this is what actually happens.

  ```js
  const lineGroup = bounds.append('g');
  // .attr('clip-path', 'url(#bounds-clip-path)');
  ```

## 05 - Interactions

_Please note:_ version 6 of the D3 library revised event handlers considerably. Where needed, I try to highlight the code for both version 6 and version 5, used in the book.

### Events

Listen to events through the `on` method. On a selection, this method describes the event and a callback function.

```js
selection.on('mouseenter', function () {
  // do something
});
```

The function is called when the event is registered, and has knowledge of the event and the bound data.

```js
const rectangles = bounds.selectAll('rect').data(dates).enter().append('rect');

rectangles.on('mouseenter', function (event, d) {
  // do something
});
```

In this example, the function is executed as the mouse enters in a rectangle. `event` provides details behind the event, like the `x`, `y` coordinates of the event, while `d` the individual date bound to the specific rectangle.

_Please note:_ prior to D3 version 6, the callback function is called with three values: the datum bound to the selection, the index and the collection to which the element belongs.

```js
rectangles.on('mouseenter', function (d, i, nodes) {
  // do something
});
```

Again and in the rectangles' example, `d` would descibe the date, `nodes` the collection of rectangles, and `i` the index of the invoking rectangle in said collection. To know about the event, the library would have provided the global `d3.event`.

It is still possible to know about the index and nodes collection, but with a different syntax.

```js
rectangles.on('mouseenter', function (event, d) {
  const nodes = rectangles.nodes();
  const i = nodes.indexOf(this);
});
```

_Plese also note:_ with the `function` keyword, `this` describes the element behind the event. The concept is useful to target the specific element.

```js
rectangles.on('mouseenter', function (event, d) {
  d3.select(this);
  // update the hovered rectangle
});
```

With ES6 arrow syntax, `=>`, and since version 6, it is still possible to have a reference to the element with `event.currentTarget`.

```js
rectangles.on('mouseenter', (event, d) => {
  d3.select(event.currentTarget);
  // update the hovered rectangle
});
```

With the `on` keyword the library attaches event handlers to the selected element. With `null` instead of a callback function, it is then possible to destroy said handlers.

```js
rectangles.on('mouseenter', null);
```

The `dispatch` method finally allows to execute the code of a specific, input event handler.

```js
rectangles.dispatch('mouseenter').on('mouseenter', null);
```

In this instance, the logic described in the callback function is executed before removing the associated handler.

### Bar Chart

The first interactive example is based on a bar chart, and I decided to use the visualization created for the third chapter, _03 Bar Charts_, as a basis.

#### Stylesheet

The visualization is first updated with a stylesheet, which includes a first type of interaction through the `:hover` pseudo class.

```css
svg rect:hover {
  fill: purple;
}
```

As the mouse hovers on the rectangles, the color is updated to the chosen hue.

_Please note:_ The property overrides the `fill` attribute.

```js
rectangles.attr('fill', 'cornflowerblue');
```

Had the color been set inline and with the `.style` method, the solution would not have worked (at least without the `!important` keyword). This relates to CSS specificity and not to D3 itself.

```js
rectangles
  // .attr('fill', 'cornflowerblue');
  .style('fill', 'cornflowerblue');
```

#### Tooltip

Past the stylistic update, D3 manages the contents and position of a tooltip as included in a `<div>` container. The markup is modified from the solution created in the third chapter to nest each bar chart in a wrapping `<div>` element.

```html
<div id="root">
  <div class="wrapper"></div>
  <div class="wrapper"></div>
  <div class="wrapper"></div>
</div>
```

Based on this solution, the idea is to include a tooltip for each visualization.

```html
<div class="wrapper">
  <div class="tooltip">
    <!-- svg -->
  </div>
</div>
```

In so doing, the position of the tooltip is made relative to the dedicated bar chart.

```css
.wrapper {
  position: relative;
}

.wrapper .tooltip {
  position: absolute;
}
```

In the stylesheet, the tooltip is modified with a series of property value pairs, mostly to change the appearance of the element, but it is important to highlight the following:

- `z-index` makes it possible to have the tooltip reside above the sibling SVG element

- `pointer-events` set to `none` avoids mouse events on the element. This is so that when the user hovers on a rectangle, invoking the tooltip, the tooltip itself doesn't block mouse interaction

- `opacity` set to `0` hides the tooltip. The idea is to change the opacity through D3 and in the script

In the script, D3 finally manages the tooltip as the mouse hovers on a rectangle, and using the event handlers introduced in this chapter.

```js
binGroups
  .append('rect')
  .on('mouseenter', onMouseEnter())
  .on('mouseleave', onMouseLeave());
```

`onMouseEnter` updates the tooltip modifying the text of its nested elements. For instance and in a heading element, the tooltip shows the metric of the particular bar chart.

```js
tooltip.select('h2').text(metric);
```

In terms of style, the function also shows the tooltip modifying its opacity.

```js
tooltip.style('opacity', 1);
```

Most importantly, the function updates the position of the tooltip so that it resides above the selected rectangle. The solution is not simple, so that it might help to explain the logic in details:

- `x` refers to the center of the selected rectangle, accessing the coordinates of the range described by `d.x0` and `d.y0`

  ```js
  const x = xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2;
  ```

- `y` refers to the top of the selected rectangle, through the value of the rectangle itself

  ```js
  const y = yScale(yAccessor(d));
  ```

- both `x` and `y` are updated to consider the margin, included horizontally and vertically in the wrapping `<g>` element

  ```js
  const x = xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2 + margin.left;

  const y = yScale(yAccessor(d)) + margin.top;
  ```

- with the `transform` property, the tooltip is translated to the prescribed `x` and `y` coordinates

  ```js
  tooltip.style('transform', `translate(${x}px, ${y}px)`);
  ```

  This works, but the tooltip is positioned from the top left corner

- again in the `transform` property, the `calc` function modifies the position to align the tooltip as wanted

  ```js
  tooltip.style(
    'transform',
    `translate(calc(-50% + ${x}px), calc(-100% + ${y}px))`
  );
  ```

  Percentages in the `transform` property are relative to the dimensions of the element itself, so that `50%` in the first expression describes half the tooltip's width, and `100%` in the second expression refers to its total height

`onMouseLeave` finally hides the tooltip.

```js
function onMouseLeave() {
  tooltip.style('opacity', 0);
}
```

#### Format

`d3.format` creates a formatting function with a series of directives.

```js
const format = d3.format('.2f');
```

In this instance, `format` can be used to describe numerical values with two numbers after the decimal point.

```js
format(3); // 3.00
format(3.1456); // 3.14
```

The book explains the syntax succinctly and as follows:

```code
[,][.precision][type]
```

- `[,]`: add a comma every three digits to the left of the decimal point

- `[.precision]`: specify the number of digits to include after the decimal point

- `[type]`: format with a specific notation, like fixed `f`, decimal `r`, percentage `%`.

Refer to the [`d3-format` module](https://github.com/d3/d3-format) for the comprehensive list of the possible directives.

### Scatterplot

The second interactive demo relates to the scatterplot introduced in the second chapter, _02 Scatterplot_, and I decided to actually create two folders, to focus on event handlers first, and Delaunay triangulation second (the concept is introduced to aid the selection of individual data points).

Event handlers are included on `<circle>` elements exactly like on rectangles.

```js
bounds
  .append('circle')
  .on('mouseenter', onMouseEnter)
  .on('mouseleave', onMouseLeave);
```

On top of displaying the data points with numerical values, the tooltip also includes a date, which is formatted with the `d3-time-format` module. Formatted, and parsed actually, as it is first necessary to convert the string describing the points to a date object. The functions work similarly to `d3.format`, with a series of directives describing the format.

```js
const parseDate = d3.timeParse('%Y-%m-%d');
```

In this instance, the function creates a date object from a string displaying the full year, month and day, separated with a hyphen, like `2018-07-23`.

```js
const formatDate = d3.timeFormat('%B %A %-d, %Y');
```

In this instance, the function formats a date object to show the entire name of the month and day, followed by the number of the day and year, like `July Monday 23, 2018`.

Refer to the [`d3-time-format` module](https://github.com/d3/d3-time-format) for the possible directives.

### Delaunay

The scatter plot from the previous demo is enhanced to have the mouse highlight a circle with a bit of leeway. Delaunay triangulation works by partitioning the chart in triangles, each responsible for an individual circle. The data is then shown when hovering on the triangles, and not the smaller, nested circle.

- create the triangulation with `d3.Delaunay.from`. The function accepts three arguments, for the dataset and two functions describing the `x` and `y` coordinate of the points

  ```js
  const delaunay = d3.Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d))
  );
  ```

- create the voronoi diagram with the `voronoi` method. The function is called on the value returned by the previous function

  ```js
  const voronoi = delaunay.voronoi();
  ```

  With `xmax` and `ymax` it is possible to change the area covered by the diagram, and in the project, extend the area to the bounded dimensions.

  ```js
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;
  ```

- render the triangles with `voronoi.renderCell`. The function receives the index of the bounded data.

  ```js
  bounds
    .append('g')
    .selectAll('path')
    .data(dataset)
    .enter()
    .append('path')
    .attr('d', (d, i) => voronoi.renderCell(i));
  ```

By default, the path are rendered with a solid fill, so that the scatterplot is completely hidden. Setting a transparent fill, it is possible to conceal the elements, and still register mouse events.

```js
.append('path')
.attr('d', (d, i) => voronoi.renderCell(i))
.attr('fill', 'transparent')
```

As the triangles are meant to just support mouse interaction, it is unnecessary to shown them. If need be, remove the comments from the lines setting a thin stroke.

```js
// .attr('stroke', 'currentColor')
// .attr('stroke-width', 0.5)
```

For mouse interaction, the event handlers are finally set on the `<path>` elements.

```js
.append('path')
.on('mouseenter', onMouseEnter)
.on('mouseleave', onMouseLeave)
```

#### Highlight

The event handlers are modified to also show a maroon circle in the place of the selected data point. The idea is to here include a new circle, instead of modifying the existing shape. In so doing, it is possible to guarantee that the highlight is drawn above the existing circles.

```js
bounds
  .append('circle')
  .attr('id', 'tooltipCircle')
  .attr('fill', 'maroon')
  .attr('r', 5)
  .attr('cx', x)
  .attr('cy', y);
```

`x` and `y` are updated to refer to the coordinates of the selected data point.

The identifier is finally set to then target and remove the element as the mouse leaves the elements.

```js
bounds.select('#tooltipCircle').remove();
```

### Line

The final interactive demo provides more details for a line chart, a visualization similar to the one introduced in the first chapter, _01 Line Chart_. The biggest change is that the chart focuses on a subset of the entire data, on the first one hundred observations.

```js
const data = await d3.json('../../nyc_weather_data.json');
const dataset = data.slice(0, 100);
```

Past this choice, the chart displays a label for the `y` axis, highlighting how the vertical dimension describes the maximum temperature.

In terms of interaction, the idea is to consider the horizontal coordinate of the mouse to find the date, consider the date to find the closest data point, and finally highlighted the data point in the a tooltip and with a `<circle>` element.

The final step, how the data point is highlighted, is similar to the previous demos, so that the biggest hurdle is actually finding the data point.

For the horizontal coordinate, the script first adds an onverlay with a `<rect>` element, spanning the entirety of the bounded dimensions.

```js
bounds
  .append('rect')
  .attr('width', dimensions.boundedWidth)
  .attr('height', dimensions.boundedHeight)
  .attr('fill', 'transparent');
```

The coordinate is then retrieved following the `mousemove` event.

```js
bounds.append('rect').on('mousemove', onMouseMove);
```

The book retrieves the desired value with the `d3.mouse` method.

```js
function onMouseMove(event) {
  const [xHover] = d3.mouse(event);
}
```

Since version 6, however, the library works with `d3.pointer`. The method provides a more general interface for mouse and touch events.

```js
function onMouseMove(event) {
  const [xHover] = d3.pointer(event);
}
```

On the basis of the coordinate, the date is computed with the inverse of the horizontal scale.

```js
const hoverDate = xScale.invert(xHover);
```

The book finally finds the closest data point with `d3.scan`, identifying the index of the point describing the smallest difference between the point's date and the hover date. The function is however deprecated, and the library provides `d3.leastIndex` instead. `d3.least` actually returns the data point instead of the index, so that it is not necessary to find the index first.

```js
const d = d3.least();
```

The function is quite complex, but in the specific example, it works by comparing the items of the dataset two at a time.

```js
const d = d3.least(dataset, (a, b) => {});
```

The comparator function computes the difference between the points and the hover date, to finally return the difference between the two.

```js
const d = d3.least(
  dataset,
  (a, b) =>
    Math.abs(xAccessor(a) - hoverDate) - Math.abs(xAccessor(a) - hoverDate)
);
```

In this manner the function creates a collection of differences, and returns the smallest value.

## 06 - Map

_Please note:_ geographical visualizations are a substantial topic, and one in which I still lack familiarity. In light of this, the notes for the chapter are likely to be more detailed than previous ones.

The goal is to plot a chloropleth map, highlighting the population growth by applying a different color on the different countries.

### GeoJSON

For geographical visualization, GeoJSON provides the necessary syntax to draw a map. For the project, the syntax is obtained as follows:

- download a shapefile from [Natural Earth Data](https://www.naturalearthdata.com/). An `.shp` file provides an alternative format to represent geographic data

- convert the shapefile to GeoJSON objects. The book describes a library, but there are alternatives, like [mapshaper.org](https://mapshaper.org/) for a web-based interface

The output is a `.json` file, which I opted to label `world-geojson.json`. Imported in the script like data in previous projects, the object highlights a series of important fields.

```js
const countryShapes = await d3.json('./world-geojson.json');
console.log(countryShapes);
```

Take notice of the `features` array, which describes a series of `Feature` objects for the countries. Each feature has a `geometry` and `properties` field. The first one describes the coordinates making up each country, while the latter details information on the country itself, like its name or continent.

In the specific project, the book introduces here two accessor functions to retrieve the country's name and identifier.

```js
const countryNameAccessor = (d) => d.properties['NAME'];
const countryIdAccessor = (d) => d.properties['ADM0_A3_IS'];
```

The name is useful to describe the country, and will become relevant in the moment the country is highlighted in a tooltip, while the identifier provides a link with which to connect the country and the data describing the populatiojn growth.

### Data

_Please note:_ the values retrieved from the world bank seems to differ for some countries. This is likely because the data has been updated with more accurate estimates.

Data is retrieved from the [world bank](https://databank.worldbank.org/data/source/) and for the year 2017, looking specifically at four metrics:

- population growth

- population density

- net migration

- international tourism through receipts

The dataset is in `.csv` format, where the values are comma separated, but the script reads the data similarly to previous projects. The only difference is `d3.csv` is used in place of `d3.json`.

```js
const dataset = await d3.csv('./databank_data.csv');
console.log(dataset);
```

`dataset` described an array with one item for each row, but, for the project at hand, the relevant metric is just the population growth.

```js
const metric = 'Population growth (annual %)';
```

In light of this, a dedicated variable is set to store the necessary values in an object describing the country and population growth with key-value pairs.

```js
/* desired structure
{
  AFG: 2.54834664435549,
  ALB: -0.0919722937442495,
}
*/
```

I decided to use a `.reduce()` function instead of looping through the data with a `.forEach` loop as in the book, but the logic is the same: loop through the dataset, and include the country code if the item describes the chosen metric.

```js
if (curr['Series Name'] === metric) {
  acc[curr['Country Code']] = parseFloat(curr['2017 [YR2017]']) || 0;
}
```

`parseFloat` allows to convert the string to a numerical value, while `|| 0` provides a default value of `0` for those countries for which the value value is missing.

### Chart Dimensions

Similarly to previous projects, the chart starts with an object describing the dimensions of the visualization.

Unlike previous projects, however, `dimensions` doesn't initially set the height. The value is computed according to the chosen projection, described in the next section.

### Sphere

An object with a `type` of `'Sphere'` is all that is necessary to eventually draw the outline of the planet.

```js
const sphere = { type: 'Sphere' };
```

### Projection

A projection describes how the map is approximated. It is indeed necessary to distort the three dimensional shape in order to draw the visual in two dimensions.

There are several projections, each with its pros and cons, but the book argues for at least the following:

- Mercator (`d3.geoMercator`) and specifically Transverse Mertcator (`d3.geoTransverseMercator`), especially for maps devoted to countries or smaller units

- Winkel-Tripel (`d3.geoWinkel3`) and equal Earth (`d3.geoEqualEarth`), particularly for continents and the entire planet

The documentation for [`d3-geo`](https://github.com/d3/d3-geo) highlights the projections included in the main library, while [`d3-geo-projection`](https://github.com/d3/d3-geo-projection) provides a module for additional types. Incidentally, `d3.geoWinkel3` is available from this additional module.

For the specific map, the chosen projection is natural Earth.

```js
const projection = d3.geoEqualEarth();
```

To have the projection consider the bounded dimensions, `fitWidth` receives the chosen width and the object of type `'Sphere'` (the object which describes the outline of the planet).

```js
const projection = d3.geoEqualEarth().fitWidth(dimensions.boundedWidth, sphere);
```

### geoPath

`d3.geoPath` provides a generator function similar to `d3.line` as introduced in the first chapter, _01 Line Chart_. It is initialized with the chosen projection.

```js
const pathGenerator = d3.geoPath(projection);
```

It then receives a GeoJSON object to produce the necessary syntax for the `d` attribute of `<path>` elements. One of these objects, for instance, is the object of type `'Sphere'` introduced earlier.

```js
console.log(pathGenerator(sphere)); // M ....
```

### Chart Dimensions / 2

Thanks to the generator function, it is finally possible to compute the vertical dimensions of the chart. `pathGenerator.bounds` provides a two dimensional array with the bounds of the input GeoJSON object. Through the sphere, the function highlights the bounds of the entire visualization: `[[x0, y0], [x1, y1]]`, and finally the height of the bounded area.

```js
const y1 = pathGenerator.bounds(sphere)[1][1];

dimensions.boundedHeight = y1;
dimensions.height =
  dimensions.boundedHeight + (dimensions.margin.top + dimensions.margin.bottom);
```

### Scales

The projection takes care of the position of the countries, so that a scale is necessary only to map the population growth to a fill color. The book explains here how a linear scale can create a piece-wise scale, mapping three values to three distinct intervals.

```js
const colorScale = d3
  .scaleLinear()
  .domain([-maxChange, 0, maxChange])
  .range(['indigo', 'white', 'darkgreen']);
```

In this instance, `-maxChange` is mapped to indigo, `0` to white and `maxChange` to dark green. Any value in between is interpolated between the chosen colors.

It is important to note that `maxChange` describes the greater between the minimum and maximum population growth, in absolute terms. Using this value instead of the minimum and maximum allows to compare the degree with which countries grow or recede in number.

### Draw Data

The visualization is drawn in a `<svg>` making up the wrapper and a group element `<g>` making up the bounds, exactly like previous project.

The map itself is drawn with the path generator function, and at least three types of GeoJSON objects:

- the object of type `'Sphere'` draws the outline of the planet

  ```js
  bounds
    .append('path')
    .attr('d', pathGenerator(sphere))
    .attr('fill', '#e2f1f1')
    .attr('stroke', 'none');
  ```

- `d3.geoGraticule10` creates an object for the lines highlighting the longitude and latitude

  ```js
  const graticuleJson = d3.geoGraticule10();

  bounds
    .append('path')
    .attr('d', pathGenerator(graticuleJson))
    .attr('fill', 'none')
    .attr('stroke', '#cadddd');
  ```

  The function itself provides a graticule with a set of default options (`10` refers for instance to the degrees separating the longitude and latitude lines). [The documentation](https://github.com/d3/d3-geo#geoGraticule) provides more information as to how to customize the grid.

- each object in the `features` array describes the GeoJSON object for a country

  ```js
  bounds
    .append('g')
    .selectAll('path')
    .data(countryShapes.features)
    .enter()
    .append('path')
    .attr('d', pathGenerator);
  ```

  `pathGenerator` works as a shorthand for `d => pathGenerator(d)`, meaning the generating function receives a feature to produce the necessary SVG syntax.

To finally create the chloropleth map, the fill of each country considers the color scale and the population growth.

```js
.attr('fill', d => {
  const metricData = metricDataByCountry[countryIdAccessor(d)];
  return metricData ? colorScale(metricData) : '#e2e6e9`;
})
```

`#e2e6e9` is chosen as a default option for those countries not represented in the `metricDataByCountry` object.

### Navigator

`Navigator` is Web APIs which provides detailed information regarding the user location, following the consent of said user. In the specific project, it is used to find the longitude and latitude to then draw a circle in the matching location.

```js
navigator.geolocation.getCurrentPosition(position => {
    const { longitude, latitude } = position.coords;
}
```

The porjection is useful for the path generator, but also as a standalone function, to provide the `x` and `y` dimensions for a given set of real-world coordinates.

```js
const [x, y] = projection([longitude, latitude]);
```

Knowing the location, it is finally possible to highlight the position of the user.

```js
bounds.append('g').append('circle').attr('cx', x).attr('cy', y).attr('r', 6);
```

### Peripherals

Instead of axis, peripherals are included in the form of a legend, with a label, a byline and a rectangle describing the color scale. Two labels are included as previous projects, to describe the metric and a short description. Below this visuals, however, the legend details a rectangle to highlightc color scale. The scale is specifically through the fill of the rectangle, which is not a solid color, but a gradient with three colors (the same colors of the range of the color sale).

In SVG, the `<linearGradient>` element works similarly to `<clipPath>`:

- define the element in a `<defs>` block

  ```html
  <defs>
    <linearGradient id="linear-gradient"> </linearGradient>
  </defs>
  ```

- reference the element through the `id` attribute

  ```html
  <rect fill="url(#linear-gradient)" />
  ```

The element itself describes the colors of the gradient with a `<stop>` element and two foundational attributes: `stop-color` and `offset`.

```html
<linearGradient id="linear-gradient">
  <stop stop-color="red" offset="0%">
  <stop stop-color="blue" offset="100%">
</linearGradient>
```

In the visualization, the `<stop>` elements are included dynamically, binding the element to the colors of the scale, and specifically its range.

```js
console.log(colorScale.range()); // ["indigo", "white", "darkgreen"]
```

The color is included in the `stop-color` attribute, while the offset is computed on the basis of the element's index, so that the `[0, 100]` interval is evenly split in three parts.

```js
linearGradient
  .selectAll('stop')
  .data(colorScale.range())
  .enter()
  .append('stop')
  .attr('stop-color', (d) => d)
  .attr('offset', (d, i, { length }) => `${(i * 100) / (length - 1)}%`);
```

### Interactions

Interactions are included with a tooltip and a couple SVG shapes.

In terms of SVG, the highlight is shown with a `<circle>`, but also a `<path>` element recreating the selected country (the country is actually rendered first, to eventually show the circle above it).

The `<path>` is recreated with the path generator function.

```js
bounds
  .append('path')
  .attr('id', 'tooltipCountry')
  .attr('fill', 'cornflowerblue')
  .attr('d', pathGenerator(d));
```

The circle, instead, is positioned thanks to the `centroid` method, providing the center of a GeoJSON object and for a specific generator function.

```js
console.log(pathGenerator.centroid(sphere)); // [x, y]
```

For the tooltip, then, the HTML element highglights the selected country and the connected metric. If the metric is not available, the paragraph displays a default message.

```js
tooltip
  .select('p')
  .text(
    metricData
      ? `${formatMetric(metricData)}% population change`
      : 'Data not available'
  );
```

The position of the tooltip refers to the same coordinates computed for the circle, but adjusted for the chosen margins.

### Delaunay

As suggested in the book, mouse interaction can be improved with Delaunay's triangulation. The logic is fundamentally the same as in the previous chapter: include a series of `<path>` elements above the map and attach the mouse event to said shapes.

```js
bounds
  // bind features
  .append('path')
  .attr('d', (d, i) => voronoi.renderCell(i))
  .attr('fill', 'transparent')
  .on('mouseenter', onMouseEnter)
  .on('mouseleave', onMouseLeave);
```

The only difference is in the `x` and `y` coordinates used in the `d3.Delaunay.from` function, which now refer to the center of each country.

```js
const delaunay = d3.Delaunay.from(
  countryShapes.features,
  (d) => pathGenerator.centroid(d)[0],
  (d) => pathGenerator.centroid(d)[1]
);
```

## 07 - Data Visualization Basics

_Please note:_ the notes which follow are no substitute for the thorough analysis of the book. I will focus on a few concepts, but mostly try to recreate the proposed visualizations.

### Basics

A data visualization is useful only as it is able to answer a question. The line chart in the first chapter describes the variability of the temperature through the year; the scatterplot from the second project focuses on the correlation between humidity and dew point; the bar charts in the third demo show the distribution and variety of multiple metrics.

When picking a particular visualization, it is helpful to start with the data being analysed:

- qualitative, non numerical:

  - binary, representing one of two options (state of a light switch)

  - nominal, categories without order (weather)

  - ordinal, categories with natural order (wind intensity)

- quantitative, numerical:

  - discrete, where it's not possible to interpret a value intermediate of two measurements (number of cards)

  - continuous, where it's possible to interpolate between two values (degrees)

The type of data influences the type of chart. Picking for instance the temperature, the continuous metric can be highlighted with a bar chart (the height of the bars), a scatterplot (the `y` coordinate) or again color (the fill of circles, the gradient of a rectangle).

### Humidity Timeline

The goal is to create a visualization highlighting how humidity changes depending on the time of the year.

Starting from a rudimentary timeline, the book illustrates how to design the line chart to answer the question with more focus and purpose. The visualization is updated as follows:

- the line plots the data with a curve

  ```js
  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)))
    .curve(d3.curveBasis);
  ```

- instead of considering every data point, the line generator function receives a smaller set of values, considering the average for each week

  ```js
  lineGroup.append('path').attr('d', lineGenerator(downsampleData));
  ```

  `downsampleData` considers the weekly averages with `d3.timeWeeks`, a function generating the weeks from the start to end date

  ```js
  const weeks = d3.timeWeeks(
    xAccessor(dataset[0]),
    xAccessor(dataset[dataset.length - 1])
  );
  ```

- the data points are preserved through lighter grey circles

- the `y` axis displays fewer ticks modifying the axis generator function

- the label for the `y` axis is moved above the line chart, next to the topmost value

- the `x` axis is removed

- for the seasons, the line chart includes a semi-transparent rectangle, and a line highlighting the mean value

  ```js
  seasonGroup.append('rect');

  seasonGroup.append('path');
  ```

  The groups are bound to an object detailing the season.

  ```js
  const seasonGroup = seasonsGroup
    .append('g')
    .selectAll('g')
    .data(seasonData)
    .enter()
    .append('g');
  ```

  `seasonData` is built to have each data point represented by a season. `d3.timeYears` and `d3.timeMonth` are used to create an array describing one year more than necessary.

  ```js
  const years = d3.timeYears(d3.timeMonth.offset(startDate, -13), endDate);
  ```

  An additional (preceding) year is necessary to contemplate the winter season at the beginning of the dataset.

  `d3.timeYears` produces an array of date object. A formatting function is then used to have `years` describe the intger value only.

  ```js
  const years = d3
    .timeYears(d3.timeMonth.offset(startDate, -13), endDate)
    .map((yearDate) => parseInt(d3.timeFormat('%Y')(yearDate)));
  ```

- the `y` axis includes a label for the lines detailing the season's averages

- the `x` axis is re-introduced with a label for the seasons

### Color Scales

The project highlights how to include color through the `d3-scale-chromatic` and `d3-interpolate` modules.

It is important to note the following:

- categorical scales provide an array of distinct colors. Consider `d3.schemeCategory10`. You access individual colors by index, like `d3.schemeCategory10[0]`

- sequential, diverging, cyclical scales create a scale like `d3.scaleLinear`, with a domain (`[0, 1]`) and a range (an array of colors). Consider `d3.interpolateBlues()`. You obtain a color by calling the function with a specific number, like `d3.interpolateBlues(0.5)`

- when interpolating between two or more colors D3 supports both the scale and array syntax. `d3.interpolateBlues()`, for instance, creates a proper scale, while `d3.interpolateBlues[n]` creates an array of `n` colors in the prescribed range

- functions from `d3-interpolate` interpolate between two colors in a given color space. In this light, it is helpful to have a brief overview of the different formats:

  - keywords like `cornflowerblue` provide a first way to describe color. It is important to also highlight `transparent`, used in a previous project to hide elements like Delaunay's `<path>`s, and `currentColor`, useful to consider the value from the `color` property

  - `rgb[a]` describes a color through its red, green and blue components. `a` describes the optional alpha channel, for the opacity of the color. Each component is a number in the `[0, 255]` range, and colors are mixed with additive fashion, meaning `rgb(255, 255, 255)` is completely white

  - `hsl[a]` describes a color with a hue, saturation and lightness. The hue is a number in the `[0, 360]` range going from red, 0, to green, 120, to blue, 240, back to red, 360. Saturation is a percentage going from grey, `0%` to fully saturated, `100%`. Lightness is a percentage going from black, `0%`, to white, `100%`

  - `hcl[a]` describes a color with a hue, chroma and lightness. The chroma is a number in the `[0, 230]` influencing the saturation, while the lightness a number in the `[0, 100]` interval. The difference from the hsl color space is that two values with the same lightness value have the same perceived lightness. In light of this, the format is useful to avoid contrasting levels of saturation

## 08 - Common Charts

The chapter introduces a few types of data visualizations with the goal of providing a baseilne, a foundation for more complex projects. With the folder I try to replicate the visuals on my own.

### Candlestick

A candlestick chart highlights stock prices through the open, close, high and low metric.

A few highlights in terms of the D3 library:

- `d3.csv` considers the comma separated values the describing hypothetical prices

- `d3.schemeSet1` provides an array of colors to distinguish which day resulted in a net gain (when the closing price was higher than the opening value)

- `d3.timeDay.offset` is used to stretch the horizontal scale one day before and one day after the actual domain. The function is useful in the context of the time scale, to provide some padding around the values. A different approach would be to use a band scale, and have each observation positioned at a fraction of the available width

### Timeline

The goal with a timeline is to study the evolution of a metric over time. It is important to focus on the granularity of the time scale (), or again the smoothness of the line connecting the individual points. It is essential, finally, to accurately describe which data is included in the line; consider for instance how the redesign in chapter seven used the weekly mean in place of the daily observations, and how the visualization preserved the values through small, grey circles.

The project in the folder is fundamentally a copy of a previous line chart(s). The visual is is however on the points making up the line and the interpolating curve. With a `<input>` element of type `checkbox` it is possible to toggle the visibility of the points. With a `<select>` element, and a few `<option>`s, it is possible to change the function used in the line generator function.

### Heatmap

Taking inspiration from the visualization highlighting profile contributions on the GitHub platform, a heatmap displays a series of observations in a grid, and depicts a continuous or discrete metric through color.

The visualization itself includes a button to cycle through different metrics, similarly to the bar charts developed innthe fifth chapter, _05 - Interactions_.

In terms of D3, the project is an excellent exercise with the `d3-time` module, specifically `d3.timeWeeks`, `d3.timeMonths` and few directives included in the parsing, formatting functions.

### Radar

A radar chart is useful to highlight multiple metrics on the same chart. While it is possible to include multiple polygons in the same chart, it is preferable to limit the number of visuals. To show a greater number of visuals, the chart can show different polygons with a toggle (as in the demo), or with multiple, separate charts.

The visualization is created with two functions from the `d3-shape` module:

- `d3.lineRadial`, working similar to `d3.line`, but assigning the `x` and `y` coordinate of the line on the basis of an angle and radius

  ```js
  const lineGenerator = d3
    .lineRadial(..)
    .angle(..)
    .radius(..);
  ```

- `d3.areaRadial`, using the same arguments as the line generator function, but specifying two radii for the size of the area

  ```js
  const areaGenerator = d3
    .areaRadial(..)
    .angle(..)
    .innerRadius(..)
    .outerRadius(..);
  ```

### Scatter

A scatterplot is useful to study the relationship between two metric values.

The visualization is a copy of the scatterplot introduced earlier in the repository. Here, however, the focus is on the type of relationship between the two metrics:

- positive, between maximum and minimum temperature

- negative, between wind speed and air pressure

- null, between wind speed and humidity

The demo also includes a line of best fit, showing the correlation, if any, with a `<path>` element.

_Please note:_ the line of best fit is computed considering the `y` coordinate with two `x` values, describing the origin and the end of the visualization. A `<clipPath>` element is necessary restrict the `<path>` element to the bounded dimensions.

### Pie and Donut

A pie, or donut, chart is useful to focus on the parts of a whole. It is difficult to interpret small differences, but the type can provide a few insights. Focus on a few slices (five at most), sort the values (the pie generator function defaults to this option) and consider adding more information with labels, accompanying visuals.

The demo introduces two foundational function from the `d3-shape` module:

- `d3.pie` modifies the data to assign a start and end angle for each observation

  ```js
  const iconPieData = pieGenerator(data);
  ```

  `data` is provided with an array of objects, and the value for the slice is included in a `value` field

  ```js
  const pieGenerator = d3
    .pie()
    .padAngle(0.01)
    .value((d) => d.value);
  ```

- `d3.arc` creates the syntax for the `d` attribute of `<path>` elements starting from the a series of values:

  - `innerRadius`, `outerRadius`, are set immediately

    ```js
    const arcGenerator = d3
      .arc()
      .innerRadius(radius * 0.75)
      .outerRadius(radius);
    ```

  - `startAngle` and `endAngle`, included through the pie genertor function

_Please note:_ the `icons` folder includes a few SVG icons I created for the project. The syntax is included in `<path>` elements at the center of each slice.

### Histogram

A histogram is useful to analyze the variation in the values of a metric.

There are generally five types of distributions:

- normal, or gaussian, where the observations are centered around the mean

- skewed to the right, with a greater number of values in the upper half

- skewed to the left, focused in the bottom half

- bimodal, with two peaks

- symmetric, with a homogeneous set of observations

_Please note:_ the folder doesn't include a demo for the histogram, because the third chapter already implements the type for multiple variables.

### Box Plot

With a box plot it is possible to study the distribution of a numerical value. The median is useful to describe the tendency of the metric, while the 25th and 75th percentile (also know as 1st and 3rd quarile) provide a measure of the variability.

```text
  outliers

  - median + iqr * 1.5
  |
 --- 75th percentile
|   |
|---| median
|   |
 --- 25th percentile
  |
  - median - iqr * 1.5

  outliers
```

For the D3 library:

- `d3.scaleBand` provides the horizontal coordinate by mapping a discrete domain (an array describing the months) to a continuous range (the bounded width)

- `d3.timeMonths` works similarly to `d3.timeWeeks` in the redesign of the timeline of the seventh chapter. The function creates an array of date objects for the months between the input dates

- in terms of data binding, it is possible to bind two nested layers. Consider how the groups for the boxes are bound to `monthData` and the circles are bound to the array describing the outliers, `d.outliers`

## 09 - Dashboard

A dashboard is loosely introduced an interface for data, a display encompassing the value of a few metrics as weel as complex visualizations.

### Weather Metrics

The first demo works to show a rudimentary dashboard, displaying three metrics for a given day in the wind speed, visibility and atmospheric pressure.

Instead of using `<svg>` elements, I decided to bind the data to HTML elements.

The redesign works to show how the dashboard can be improved by providing more context and additional visuals:

- the values are formatted to consider fewer decimal numbers, with a fixed notation

- the metrics are displayed with labels distinct from the value of the connected property. `windSpeed` is displayed as `Wind Speed`, `visibility` as `Visibility` and `pressure` as `Atmospheric pressure`

- each metric is accompanied by a heading displaying the unit of measure

- each metric is accompanied by a gauge, highlighting the value in the context of the dataset, and where the value fits in the domain

It is important to note a distinction introduced with the `drawMetric` function. The script initially sets up the dashboard with the necessary HTML and SVG elements. In `drawMetric`, then, the idea is to change the contents, the appearance of the elements with the specific day.

The project highlights a few methods from the D3 library:

- `d3.scaleQuantize` is helpful to create a scale mapping a continuous domain to a discrete range.

  For the label above the gauge component, the idea is to display one of five options, from very low to very high, according to where the value fits in the domain.

  ```js
  d3.scaleQuantize().range(['Very low', 'Low', 'Average', 'High', 'Very high']);
  ```

  `scaleQuantize` divides the domain in intervals of equal size, so that if the value falls in the first 20% of values, it is associated to the `Very low` label. Between 20% and 40% to the `Low` label and so forth. Refer to the documentation in the [`d3-scale`](https://github.com/d3/d3-scale) module for more details.

- `d3.color` is useful to create a color which is then customized with the `.darker()` method.

  ```js
  d3.color(..).darker(1.5)
  ```

  In the project, the function receives a color from the `d3.interpolateBlues` scale. Refer to the documentation for the [`d3-color`](https://github.com/d3/d3-color) module for more information.

### Feed Metrics

The first demo considers a few metrics connected to a news feed, with the same visual designed for the weather dashboard. The focus is here on the number of views and articles connected to a hypothetical subject.

The second demo improves the design with an additional metric: demand. Here the goal is to show how data can be turned into insight, into an actionable metric.

_Please note:_ the script for the second demo slightly differs from the first, as I found a more useful solution in having the accessor function directly in the object describing each metric.

_Please also note:_ the data for the project is included in the _09 - Dashboard_ folder, alongside the icons designed for each section.

### Data States

The project works to show how a dashboard is able to accommodate multiple states.

In the context of a bar chart, the states are included with a rudimentary flow:

- loading; here the script renders a gray-scale, semi-translucent version of the bar chart, under a label describing the loading state.

- loaded, error or empty; here the bar chart is substituted with the actual visualization, or updated with an error message, or again a message describing the lack of data

The loading state is shown immediately, while the three remaining states follow after a brief timeout.

```js
setTimeout(() => {
  d3.json();
}, 2500);
```

`d3.json` provides a promise to fetch the data. If successful the idea is to either show the empty or loaded state, according to the length of the obtained data.

```js
d3.json('../../nyc_weather_data.json').then((dataset) => {
  if (dataset.length === 0) {
    handleEmptyState();
  } else {
    handleLoadedState(dataset);
  }
});
```

If not successful, the idea is to then show the error state.

```js
d3.json('../../nyc_weather_data.json').catch((error) => {
  console.error(error);
  handleErrorState();
});
```

_Please note_: in its current design, the promise should always proceed to the loaded state. To highlight the other states, try modifying the logic of the promise. To highlight an error, for instance, have the promise look for a non-existing file.

```js
d3.json('../../nyc_weather_data.jn');
```

### Outliers

The projects work to showcase how to handle outliers, values which vary from the mean and are prone to skew the perception of the visualization.

There is not one solution for every visualization, and it is important to consider the influence of outliers case by case. For instance and to visualize the popularity of articles in terms of views, it might be useful to preserve outliers in recent data, as to highlight potential spikes. It might be then more informative to crop the value (with an accompanying label) after an arbitrary amount of time, to highlight the overall trend. This is exactly what happens in the demo exploring the bar chart; in the first visualization the scale considers the maximum value, while in the second the domain is capped at a threshold considering the mean and standard deviation.

It is important to stress that the bar chart shows one way to handle outliers, and defines an outlier with another arbitrary choice. The second project, creating a timeline, proves this by plotting the number of views and articles. The number of articles is shown with a series of dots, and the number of dots is limited to a third of the bounded height. An outlier is here any observation with more articles than can fit in the chosen fraction of the height and is highlighted with a small arrow pointing upwards.

### Table

A table provides an effective layout to focus on exact values. In the first demo, the data is included as-is, without considering the design of the visualization. The project is still useful to rehearse data binding with HTML elements.

In the second demo, the table is redesigned both in style and function. In the stylesheet, the table is updated as follows:

- the table removes the border, included as a rudimentary way to distinguish the data

- cells benefit from whitespace in the form of considerable padding

- the font is updated with the `font-feature-setting` property so that individual numbers have the same width

- the column dedicated to the summary is reduced in importance through the `font-size` property

- the row describing the head of the table is fixed to the top of the table with the `position` property set to `sticky`. The same row uses a dark background and a light color for the text to create a clear disinction with the body of the table

- the rows alternate in background color to stress the distinction between observations

- the rows are highlighted on hover and through the background color

In the script, the content is updated as follows:

- the columns are aligned left or right according to whether the values are strings or numbers respectively

- the values are formatted with the `d3-format` and the `d3-format-time` modules to provide more readable labels

- the maximum temperature and the wind speed show the value in context with a color scale and the `background` property

- the UV index is represented with a series of icons instead of a numerical values

- the column describing the precipitation type is substituted with one detailing the presence, or lack, of snow. Snow is signalled with an icon instead of a label

- the time describing the maximum temperature is represented through the horizontal position of a line instead of a label describing the hour

_Please note:_ considering the entire dataset, the risk is to having the table exceedingly wide. This is mostly due to two fields: summary and UV index. For the first field, the solution is to limit the width of the associated text. For the second field, one solution is to limit the number of icons associated with the index, and highlight a greater value with another visual.

### Layout Design

The folder highlight how a dashboard works best when it focuses on providing a clear message and a few metric. The first demo shows the minimum and maximum temperature leading up to a selected day with a timeline. The second demo focyses on showing three metrics side by side.

### Deciding Questions

The folder focuses on two questions essential to the design of a dashboard: how familar are users with the provided data, how much time do user spend with the visualization. Already, these issues compel a different visualization. Consider for instance how inexperienced users might benefit from a short explanation (first demo), or again how time-sensitive readers might prefer a single metric instead of an elaborate visualization (second demo).

In terms of D3, it is helpful to note how the elaborate visualization in the second demo leans on the `d3-force` module to have the circles describing the observations separated from one another. With `d3.simulation`, the project sets up a series of forces to have the points tend toward the desired `x` coordinate.

```js
d3.forceSimulation(simulationData)
      .force('collision', ...)
      .force('x', d3.forceX().x(d => xScale(metricAccessor(d))))
      .force('y', ...)
```

The simulation is then run an arbitrary number of time to eventually position the circles.

```js
d3.simulation().tick(300);
```

## 10 - Complex Visualizations

The chapter is devoted to three complex visualizations, exploring multiple questions with elaborate designs and interactions. In the folder I try to recreate the projects as closely as possible.

### Marginal Histogram

The goal is to explore the weather dataset and specifically temperature ranges, the differences between minimum and maximum temperatures.

#### Scatterplot

A scatterplot works as a starting point, plotting the individual observations with a series of circles. Horizontally, the position is determined by the minimum temperature, while vertically the relevant metric is the maximum temperature.

```js
const xAccessor = (d) => d.temperatureMin;
const yAccessor = (d) => d.temperatureMax;
```

#### Background

The visualization includes a solid background in the form of a rectangle, spanning the entirety of the bounded dimensions. The shape is helpful to create a clear distinction between the scatterplot and the surrounding visuals (axis and soon-to-be histograms).

#### Domain

Both dimensions use the same domain, to have the sides immediately comparable.

```js
const domain = d3.extent([
  ...dataset.map(xAccessor),
  ...dataset.map(yAccessor),
]);
```

#### Color

The `fill` attribute of the `<circle>` element is updated to color the shapes according to the date of the year. It is here helpful to have a year of reference, so that data spanning multiple years refer to the same domain.

```js
const colorScaleYear = 2018;
const colorAccessor = (d) => parseDate(d.date).setYear(colorScaleYear);
```

The scale itself is a sequential scale. As per [the documentation](https://github.com/d3/d3-scale#scaleSequential), the scale is defined with a domain and an interpolator.

```js
d3.scaleSequential()
  .domain([,])
  .interpolator((d) => d);
```

The idea is to have the interpolator function receive a date and return a color in a prescribed interval. In the specific project, the interpolator makes a reference to the `d3.interpolateRainbow` function, which receives a value in the `[0, 1]` range to return a color in the rainbow spectrum.

```js
d3.scaleSequential()
  .domain([
    parseDate(`${colorScaleYear}-01-01`),
    parseDate(`${colorScaleYear}-12-31`),
  ])
  .interpolator((d) => d3.interpolateRainbow(d * -1));
```

By multiplying the value by `-1` it is possible to invert the rainbow, and have the warmer season described by warmer colors (red, orange, yellow).

This is helpful for my own understanding, but the interpolator function might also work as follows:

```js
.interpolator(d => `hsl(${d * 360}, 80%, 60%)`);
```

Here the color is picked from the hslcolor wheel in the `[0, 360]` range, with a fixed saturation and lightness. With `d3.color` it could also be possible to lean on the hcl format, obtaining a color wheel with the same perceived lightness.

```js
.interpolator(d => d3.hcl((d * 360 + 220) % 360, 160, 75));
```

As mentioned, the scale is used to color the circles in the scatterplot.

```js
.append('circle')
.attr('fill', d => colorScale(colorAccessor(d)));
```

However, the scale is also included in the `<linearGradient>` element to color the legend. The idea is to here include one `<stop>` element for each month, creating a gradient through twelve colors.

```js
.selectAll('stop')
.data(d3.timeMonths(...colorScale.domain()))
```

`d3.timeMonths` creates an array of dates between a start and end date. These dates are handily obtained through the domain of the scale itself.

The scale is useful elsewhere, for instance in the `fill` color of the histograms created for the highlighted circles (soon-to-be), but here I want to mention how the domain is included once more in the legend, to provide the labels of the gradient for every other month.

```js
.selectAll('g')
.data(d3.timeMonths(...colorScale.domain()).filter((d, i) => i % 2 !== 0))
```

#### Histograms

The idea is to include two histograms, describing the overall distribution of the temperatures across the year.

The dimensions of the visuals are included in the `dimensions` object, which is itself modified to increase the top and right margin.

```js
const dimensions = {
  margin: {
    top: 80,
    right: 80,
  },
  histogram: {
    height: 60,
    margin: 10,
  },
};
```

A `margin` is included for the histogram as well to separate the visual from the scatterplot.

The way the histogram is generated is similar to the visualizaton in a previous chapter. I'll describe the steps for the top histogram, but fundamentally, the code is the same for the right side (barring one difference highlighter later):

- `d3.bin` provides the generator function, with a given scale and threshold

  ```js
  const topHistogramGenerator = d3
    .bin()
    .domain(xScale.domain())
    .value(xAccessor)
    .thresholds(20);
  ```

  The accessor function means the generator function looks for the value in the minimum temperature.

  ```js
  const topHistogramBins = topHistogramGenerator(dataset);
  ```

- a linear scale maps the size of the bins to the height of the histogram. The size is determined by the `length` of the arrays describing the bins

  ```js
  const topHistogramScale = d3
    .scaleLinear()
    .domain([0, d3.max(topHistogramBins, (d) => d.length)])
    .range([dimensions.histogram.height, 0]);
  ```

- `d3.area` provides the generator function for the `d` attribute of the `<path>` element making up the histogram

  The function works similarly to `d3.line`, but defines two vertical coordinates, for the area below the line (or curve).

  ```js
  const topHistogramAreaGenerator = d3
    .area()
    .x((d) => xScale((d.x0 + d.x1) / 2))
    .y0((d) => topHistogramScale(d.length))
    .y1(dimensions.histogram.height);
  ```

  `x0` and `x1` are two fields included by the bin generator for each array, describing the start and end value (in this instance in terms of minimum temperature).

  As mentioned, the function is finally included in a `<path>` element above the scatterplot.

  ```js
  topHistogramGroup
    .append('path')
    .attr('d', topHistogramAreaGenerator(topHistogramBins))
    .attr('fill', 'currentColor');
  ```

The same logic is repeated for the right side, but the histogram is ultimately flipped and positioned to have the visualization highlight the ranges top to bottom.

#### Scatterplot Interaction

When hovering on the scatterplot, the visualization highlights a specific circle. This is implemented exactly as in the chapter devoted to interactions, with a tooltip and Delaunay's triangulation, so I want devote much attention to the code. I will note, however, that beside the tooltip and the circle highlighting the selection, the visualization includes two rectangle elements, to highlight the color in the context of the histogram.

```js
highlightGroup.append('rect');

highlightGroup.append('rect');
```

One important mention goes to the `mix-blend-mode` property, used to have the rectangles virtually hidden above the white background. This helps focusing the attention on the accompanying histograms.

```js
highlightGroup.style('mix-blend-mode', 'color-burn');
```

The highlight group is also included before the scatterplot, so that the rectangles are drawn below the circles.

#### Legend Interaction

The idea is to highlight a set of values when hovering on the legend. The implementation is slightly different from that describes in the book, but relies on the same visuals.

Immediately, `legendHighlightGroup` is created to contain two elements: a `<text>` working as a label and a `<rect>` to highlight the selected date, or more precisely the selected range.

```js
legendHighlightGroup.append('text');

legendHighlightGroup.append('rect');
```

When hovering on the rectangle making up the legend, the idea is to then pick a start and end date around the selected date. The specific date is obtained by inverting the horizontal coordinate with the scale created for the legend.

```js
const [x] = d3.pointer(event);
const date = legendTickScale.invert(x);
```

The range is then computed considering a number of weeks around the date, but limiting the values to the start and end of the year. The domain for the scale conveniently provides these values.

```js
const [startDate, endDate] = legendTickScale.domain();
```

`d3.timeWeek.offset` provides the date before/after the date, while `d3.max`, `d3.min` allow to fallback to the values if exceeding the selected year. For instance and for the start date, this value cannot precede the first of January.

```js
const d1 = d3.max([startDate, d3.timeWeek.offset(date, -weeksHighlight)]);
```

Based on this structure, `d1` and `d2` describe the dates in the given year. The highlight is noted in the legend by updating the rectangle to describe the range.

```js
legendHighlightGroup
  .select('rect')
  .attr('x', legendTickScale(d1))
  .attr('width', legendTickScale(d2) - legendTickScale(d1));
```

The label is also updated in position, similarly to the rectangle, but also and notably in the text, in order to display the dates with the chosen month and date.

```js
const formatLegendDate = d3.timeFormat('%b %d');

legendHighlightGroup.text(`${formatLegendDate(d1)} - ${formatLegendDate(d2)}`);
```

The two dates are however and most importantly used to highlight the dots with the appropriate date. This is achieved by considering every circle and changing the opacity according to the date.

```js
scatterplotGroup
  .selectAll('circle')
  .style('opacity', (d) => (isWithinRange(d, d1, d2) ? 1 : 0));
```

The date of reference is always in the year, to account for data potentially expanding beyond one year.

```js
function isWithinRange(datum, d1, d2) {
  const yearDate = dateAccessor(datum).setYear(colorScaleYear);
  return yearDate >= d1 && yearDate <= d2;
}
```

The function is used to hide/show the data matching the selection, but also and finally to create mini-histogram. This last step showcases the usefulness of D3 and its generator functions. What is necessary is to:

- consider the data in the range

  ```js
  const highlightDataset = dataset.filter((d) => isWithinRange(d, d1, d2));
  ```

- use the generator function(s) with the subset of data

  ```js
  topHistogramAreaGenerator(topHistogramGenerator(highlightDataset)); // M...
  ```

The syntax returned by the function is included in the `d` attribute of a `<path>` element. Two elements, actually, to plot a mini histogram for each axis.

```js
topHistogramHighlight
  .style('opacity', 1)
  .attr(
    'd',
    topHistogramAreaGenerator(topHistogramGenerator(highlightDataset))
  );
```

_Plese note:_ there are parts I elected not to document, hoping to focus on the most prominent sections of the code. Consider, for instance, how the function called when hovering on the legend includes a few more instructions which work to provide more polish:

- the labels and ticks above the legend are hidden when hovering on the legend, allowing to focus on the highlight

- the mini-histogram are attributed a color based on the selected date

### Radar Weather Chart

The second complex visualization focuses on a radial line chart, studying the weather dataset through multiple metrics.

#### Peripherals

- d3.timeMonths to create the months

- rotate path element to create angle lines (instead of computing the coordinates with cosine and sine functions)

- translate text elements at the end of the lines

- grid lines based on the temperature, `ticks` function to create an array of values based on the scale

```js
const temperatureTicks = radiusScale.ticks(4); // [20, 40, 60, 80, 100]
```

- grid numbers with a solid background

#### Temperature

- freezing temperature, conditional

- radial area generator function

- radial gradient with chromatic scale

```js
temperatureGroup
.append('circle')
.attr('r', dimensions.boundedRadius)
.attr('fill', `url(#${gradientId})`)
```
