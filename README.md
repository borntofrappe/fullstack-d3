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
