# Fullstack d3

[_Fullstack d3_](https://www.newline.co/fullstack-d3) is an informative book from [_Amelia Wattenberger_](https://wattenberger.com/) devoted to the [D3.js](https://d3js.org/) library. The goal of this repository is to replicate the examples provided in the book and annotate the lessons learned in the process.

_Introductory notes:_

- the repository includes the library in version `v7.9.0`; differences in the code are highlighted as they occur

- the script begins by listing the modules used in the rest of the code

  ```js
  const { json, timeParse, extent } = d3;
  ```

  This helps to provide an overview of the parts of the library actually being used, but is also important to stress the structure of D3. In production it may be preferable to include only the necessary modules instead of the entire library.

- at least for the first few visualizations, data is retrieved from a file in `.json` format

  To bypass the CORS safety restriction set up a server; `live-server` might be the quickest solution if installed globally

  ```sh
  pnpm add -g live-server
  live-server # visit http://localhost:8080/
  ```

## 01 - Line Chart

The book begins immediately with a line chart. It is useful to introduce D3, but also the sequence used to build a robust data visualization.

### Async function

The script calls an `async` function to create the visualization.

```js
async function drawLineChart() {}

drawLineChart();
```

Having a dedicated function allows to create a new scope for the variables. Most importantly, the `async` function helps to `await` the data from methods like `d3.json`, which return a promise.

```js
async function drawLineChart() {
  const dataset = await json("../nyc_weather_data.json");
}
```

### Date parser

In `nyc_weather_data.json` dates are strings, like "2018-01-02". Since the D3 library is able to work with date objects convert the value with the [`d3-time-format`](https://d3js.org/d3-time-format) module and the helper function `d3.timeParse`.

```js
const dateParser = timeParse("%Y-%m-%d");
```

The function receives as input a string detailing the format of the date. In this instance the full year followed by the month followed by the day, all separated with a hyphen.

For a list of directives refer to [D3's own documentation](https://d3js.org/d3-time-format#locale_format),

### Accessor functions

Accessor functions are useful to retrieve specific values from the input data.

```js
const yAccessor = (d) => d.temperatureMax;
```

The construct is useful to access the data throughout the visualization. Consider for instance:

- the domain for the scales, like `yScale`

  ```js
  const yScale = d3
    .scaleLinear()
    // .domain(d3.extent(dataset, d => d.temperatureMax))
    .domain(d3.extent(dataset, yAccessor));
  ```

- the coordinates for the line generator function

  ```js
  const lineGenerator = d3
    .line()
    // .y((d) => yScale(d.temperatureMax))
    .y((d) => yScale(yAccessor(d)));
  ```

Included at the top of the script, accessor functions are also useful to provide a hint as to the topic of the visualization.

### Wrapper and bounds

The line chart is included in an SVG element `<svg>` and it is furthermore nested in a group element `<g>`.

```html
<svg>
  <!-- wrapper -->
  <g>
    <!-- bounds -->
  </g>
</svg>
```

This layered structure is useful to safely draw the visualization and peripherals (axis, labels) without fear of cropping the visuals.

The wrapper has an arbitrary width, height and margin.

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

The dimensions of the bounds are determined by the margin introduced on either side.

```js
dimensions.boundedWidth =
  dimensions.width - (dimensions.margin.left + dimensions.margin.right);
dimensions.boundedHeight =
  dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);
```

### Selection

`d3.select` allows to retrieve a reference to an element in the DOM with regular CSS selectors.

```js
const wrapper = select("#wrapper");
```

The library returns a _selection object_ which is a particular type of array with several methods. One of the most useful methods is `.append`, to include HTML elements.

```js
const wrapper = select("#wrapper");

wrapper.append("svg");
```

Conveniently, it is possible to chain methods on the selection object. The practice becomes more and more useful the more methods modify the selection. One of these methods, `.attr`, allows to modify the attributes.

```js
const wrapper = select("#wrapper")
  .append("svg")
  .attr("width", dimensions.width)
  .attr("height", dimensions.height);
```

### Scales

Scales map a domain to a range. In the project at hand they map the temperature to a `y` coordinate, the date to a `x` coordinate.

[`d3-scale`](https://d3js.org/d3-scale) provides different methods suited for different types of scales. For the temperature, where both the domain and the range describe a continuous metric, the relevant function is `d3.scaleLinear`.

```js
const yScale = scaleLinear();
```

For the date, where the domain describes a series of date objects, the most appropriate method is `d3.scaleTime`.

```js
const xScale = scaleTime();
```

In both instances the domain describes the extremes of the respective metric.

```js
const yScale = scaleLinear().domain([0, 100]);
```

In place of a hard-coded variable, however, [`d3-array`](https://d3js.org/d3-array) provides a helper method `d3.extent` to extract the information with an accessor function.

```js
const yScale = scaleLinear().domain(extent(dataset, yAccessor));
```

### Line

The [`d3-shape`](https://d3js.org/d3-shape) module provides `d3.line()` as a _generator_ function. The goal is to create the syntax for the `d` attribute of `<path>` elements.

The `x` and `y` methods allow to decipher the exact coordinates on the basis of the input data.

```js
function lineGenerator = d3.line()
  .x(d => xScale(xAccessor(d)))
  .y(d => yScale(yAccessor(d)))
```

### Axis

To include an axis you first create the peripheral with methods from the [`d3-axis`](https://d3js.org/d3-axis) module.

```js
const yAxisGenerator = d3.axisLeft().scale(yScale);
```

`axisTop`, `axisRight`, `axisBottom`, `axisLeft` create a different structure in terms of ticks, positioned in the most appropriate side of the axis.

Once you initialize the generator function it is possible to update the DOM by calling the function with an existing element, like a group element `<g>`.

```js
const yAxis = bounds.append("g");
yAxisGenerator(yAxis);
```

Conveniently, the library allows to call the generator function on the current selection, passing the current selection as an argument through the `.call` method.

```js
bounds.append("g").call(yAxisGenerator);
```

In this manner there is no need to store a reference to the group.

## 02 - Scatterplot

The second visualization is useful to repeat the process introduced with the line chart and also illustrate the concept of a _data join_.

### Data Join

The visualization includes one circle for each data point, mapping the dew point to the `x` axis, the humidity to the `y` axis, and finally the cloud cover to the `fill`, the color of the shape.

It is technically possible to append the circles with a for loop, for instance with a `forEach` iterator.

```js
dataset.forEach((point) => {
  groupCircles.append("circle");
});
```

However, the chapter introduces the concept of a data join to bind the data to DOM elements. With this binding, each element is linked to a data point and the visualization can be updated knowing which value is already included.

The binding can be implemented in at least two ways.

1. select, data, enter

   Start by selecting every circle. As no circle is included in the visualization, d3 returns an empty selection.

   ```js
   groupCircles.selectAll("circle");
   ```

   With the `data` function, build a selection which knows the elements needed to map the data. In the specific example, a selection which describes all new elements, as no circle is already present.

   ```js
   groupCircles.selectAll("circle").data(dataset);
   ```

   With the `enter` function, access the data points which need to be included in the visualization.

   ```js
   groupCircles.selectAll("circle").data(dataset).enter();
   ```

   Finally, include a circle element for each item of the collection.

   ```js
   groupCircles
     .selectAll("circle")
     .data(dataset)
     .enter()
     .append("circle")
     // set attributes
     .attr("r", 5);
   ```

   While the implementation may seem convoluted, it helps to know that when you use the `data` function, the selection returned by D3 differentiates the elements with a `_enter` and `_exit` key. The first type describes items which are not represented in the visualizations, data points which are not already mapped to a circle; the second type describes items which were represented, but should no longer be, circles exceeding the necessary number.

   ```js
   const update = groupCircles.selectAll("circle").data(dataset);

   const enter = update.enter();

   enter
     .append("circle")
     // set attributes
     .attr("r", 5);

   // const exit = update.exit();
   ```

   To consider both new and existing elements, for instance to update the color of all circles, the `.merge` function unites the input selection with the current one.

   ```js
   enter
     .append("circle")
     // set attributes
     .attr("r", 5)
     .merge(update)
     .attr("fill", "red");
   ```

2. join

   Introduced in a later version of the `d3-selection` module, [v1.4.0](https://github.com/d3/d3-selection/releases/tag/v1.4.0), the `.join` function provides a different interface for data binding.

   In the specific example, it allows to draw one circle for each data point by referencing the desired shape directly.

   ```js
   groupCircles
     .selectAll("circle")
     .data(dataset)
     .join("circle")
     // set attributes
     .attr("r", 5);
   ```

   In a more structured example, the `join()` function allows to target the different selections with a series of callback functions.

   ```js
   groupCircles
     .selectAll("circle")
     .data(dataset)
     .join(
       (enter) => enter.append("circle") /* other defining attributes */,
       (update) => null,
       (exit) => null
     );
   ```

   It is therefore possible to manage the enter, update and exit selections separately.

   Note that it is not necessary to specify the three functions, and the snippet includes the remaining callbacks just to show where the update and exit logic would go

   ```js
   .join(
   (enter) => enter
      .append("circle")
      // set attributes
      .attr("r", 5);
   );
   ```

_Of note_:

- try to log the value returned by a function to understand what said function does. `console.log` is very useful to assess how d3 manages the selection following the `data()` function, the `_enter` and `_exit` keys.

  ```js
  const update = groupCircles.selectAll('circle').data(dataset);
  console.log(update);,
  ```

- in the script I implemented data binding with the first approach, but continued exploring the concept with other instructions. The code is commented out, but effectively creates the same visualization

### Linear Scales

A linear scale is able to interpolate between numerical values, but also colors.

```js
const colorScale = scaleLinear()
  .domain(extent(dataset, colorAccessor))
  .range(["skyblue", "darkslategrey"]);
```

`.nice()` makes it possible to round the values of the scale's intervals.

```js
const xScale = scaleLinear()
  .domain(extent(dataset, xAccessor))
  .range([0, dimensions.boundedWidth])
  .nice();
```

### Peripherals

Beside the axis, included with a limited set of ticks, the groups responsible for the peripherals include `<text>` elements to add a label. The two elements are sibling of the nodes created automatically by D3.

## 03 - Bar Charts

The project is useful to introduce another generator function in `d3.bin`, plus a couple helper functions in `d3.mean` and `selection.filter`.

The chapter is also insightful in terms of accessibility, with a first set of attributes to make the visualization accessible for screen readers and keyboard users.

### Bins

The book introduces `d3.histogram` to create a series of bins, a series of arrays in which D3 slots the data points. [Since version 6](https://github.com/d3/d3/blob/master/CHANGES.md#breaking-changes), however, the function has been deprecated in favour of `d3.bin`.

```js
// const binGenerator = d3
// .histogram()
const binGenerator = d3.bin();
```

According to details in [the migration guide](https://observablehq.com/@d3/d3v6-migration-guide#bin), it seems `d3.histogram` is preserved as an alias, but it is ultimately deprecated.

The function creates a series of bins on the basis of the domain of the horizontal scale.

```js
const binGenerator = bin()
  .domain(xScale.domain())
  .value(metricAccessor)
  .thresholds(12);
```

`threshold` describes the number of bins, but the value is not forced. D3 weighs the suggestion with the number of observations and the values of the domain.

### Mean

[`d3-array`](https://d3js.org/d3-array) also provides a few helper functions for summary statistics, among which `d3.mean`. In the visualization, the function is used to highlight the mean with a line and text label.

```js
const mean = d3.mean(dataset, metricAccessor);
```

### Filter

A selection can be filtered according to a function. In the project, the `filter()` function is used to have the text label for the histogram bars only on the bins which have at least one observation.

```js
const textGroups = binGroups.filter(yAccessor);
```

`yAccessor` returns the length of the bin, a falsy value for empty arrays. The function works essentially as a shorthand for the following snippet.

```js
const textGroups = binGroups.filter((d) => yAccessor(d));
```

### Accessibility

Accessibility is considered with a few elements and attributes:

- the `title` element introduces the visualization

  ```js
  wrapper.append("title").text("...");
  ```

- the `tabindex` attribute allows to have specific elements select-able through keyboard

  In the individual bar chart, the idea is to focus on the SVG container, the group element wrapping around the histogram bars, and the group elements wrapping around the individual bars

  ```js
  wrapper.attr("tabindex", "0");
  binsGroup.attr("tabindex", "0");
  binGroups.attr("tabindex", "0");
  ```

- the `role` attribute to identifies the purpose of the select-able elements

  ```js
  wrapper.attr("role", "figure");
  binsGroup.attr("role", "list");
  binGroups.attr("role", "listitem");
  ```

- the `aria-label` attribute adds an informative label

  ```js
  binsGroup.attr("aria-label", "Histogram bars");
  binGroups.attr("aria-label", (d) => `...`);
  ```

- `aria-hidden` set to `true` hides elements from screen readers

  ```js
  wrapper.selectAll("text").attr("aria-hidden", "true");
  ```

  In the demo the labels included on the group elements are enough to describe the bar charts, and the `<text>` elements overload screen readers with too many values. Without this precaution a screen reader would also note the ticks of the axis

### Metrics

`drawBarCharts` is responsible for fetching the data and setting the dimensions of the visualization. The bars themselves are included in a `drawHistogram` function. This structure allows to draw multiple bar charts by calling `drawHistogram` with a different argument.

```js
drawHistogram("windSpeed");
drawHistogram("moonPhase");
```

## 04 - Animation and Transitions

The chapter describes three methods to smoothly change a value over time:

1. the native SVG element `<animate />`

2. the CSS `transition` property (CSS)

3. d3.js `transition` method

In folder I chose to focus on the last approach only.

D3 provides a `.transition` method to interpolate between a start and end state. Essentially, it is enough to apply a transition as follows:

```js
d3.select("rect")
  .attr("transform", "scale(0)")
  .transition()
  .attr("transform", "scale(1)");
```

In this instance the selected rectangle transitions to its full size.

### Bar Chart

Before introducing the `transition` method in the context of a bar chart, it is important to have a discussion on the structure of the visualization, and again on the concept of a data join.

#### Static and Dynamic

The function creating the visualization is divided between static and dynamic instructions.

Static are those lines included regardless of the state of the visualization: the object describing the dimensions of the SVG element `<svg>`, the SVG wrapper itself, the group element making up the bounds.

Dynamic are those lines which change depending on the input data, and in the example the metric chosen for the histogram: the scales, the position and dimensions of the rectangles, the labels.

#### Data Join

The concept of the data join, as introduced in the second chapter `02 - Scatterplot`, allows to bind data to DOM element, and it is here essential to have D3 manage the transition for new, existing and old elements.

`drawHistogram` begins by selecting group elements `<g>` and binding the data provided by the bins.

```js
const binGroups = binsGroup.selectAll("g").data(bins);
```

From this starting point, `binGroups` describes the update selection, in other words those group elements `<g>` which already exist. New (missing) elements are identified with the `enter` function, while old (superfluous) elements with `exit`.

```js
const newBinGroups = binGroups.enter();
const oldBinGroups = binGroups.exit();
```

With this structure, it is finally possible to update the visualization. In the speficic example:

- remove old elements with the `remove` function

  ```js
  oldBinGroups.remove();
  ```

- include new elements in the form of a group elements

  ```js
  const newBinGroups = binGroups.enter().append("g");
  ```

  The groups are then used to add the desired label and rectangle

  ```js
  newBinGroups.filter(yAccessor).append("text");
  // set attributes and properties

  newBinGroups.append("rect");
  // set attributes and properties
  ```

- modify existing element in the position and text of the labels, not to mention the position and size of the bars

  ```js
  binGroups.filter(yAccessor).select("text");
  // modify attributes and properties

  binGroups.select("rect");
  // modify attributes and properties
  ```

#### Transition

Back to the topic of the chapter, `transition` is applied to a selection object creating a transition object.

```js
binGroups
  .select("rect")
  .transition()
  .attr("y", (d) => yScale(yAccessor(d)));
```

The change can be customized in duration and delay with matching functions.

```js
binGroups
  .select("rect")
  .transition()
  .duration(500)
  .delay(100)
  .attr("y", (d) => yScale(yAccessor(d)));
```

Multiple transitions can also be chained by using the method repeatedly.

```js
binGroups
  .select("rect")
  .transition()
  .duration(500)
  .delay(100)
  .attr("y", (d) => yScale(yAccessor(d)))
  .transition()
  .attr("fill", "cornflowerblue");
```

In this instance the rectangle reaches the new `y` coordinate and then changes in color.

On its own, `transition` is already useful to smoothly change attributes and properties. It is however possible to initialize a transition with `d3.transition` and later reference the value as the argument of a separate `transition` calls.

```js
const updateTransition = d3.transition().duration(500).delay(100);

binGroups
  .select("rect")
  .transition(updateTransition)
  .attr("y", (d) => yScale(yAccessor(d)));
```

With this structure the necessary transitions are initialized ahead of time and can be repeated throughout the code to synchronize changes on multiple elements.

```js
binGroups.select("rect").transition(updateTransition);

binGroups.filter(yAccessor).select("text").transition(updateTransition);
```

Multiple transitions can be chained to have the modifications happen in sequence.

```js
const exitTransition = d3.transition().duration(500);

const updateTransition = exitTransition.transition().duration(1000);
```

In this instance `updateTransition` will take place after `exitTransition`.

### Line

The goal is to update the line chart introduced in the first chapter, `01 Line Chart`, in order to show a fixed number of days. The days are then modified to have the line progress through the year and analyze the contribution of each passing day.

---

The code might differ from that proposed in the book, as I attempted to create the transition on my own.

#### Static and Dynamic

As in the demo animating the bar chart, the function creating the visualization includes static and dynamic elements. With `drawDays` the idea is to receive a subset of the original dataset and modify the axis and the line accordingly.

#### Transition

For the axis it is enough to use the `transition` method before executing the axis generator.

```js
yAxisGroup.transition().call(yAxisGenerator);
xAxisGroup.transition().call(xAxisGenerator);
```

For the line, the `transition` method produces the undesired effect of a wriggle.

```js
line.transition(transition).attr("d", lineGenerator(data));
```

This is because D3 is updating the `d` attribute of the line point by point. Consider the following example, where the line is described with a series of points (`L`, or "line to", instructs the path element to continue the line toward a specific `x` `y` coordinate).

```html
<path d="M 0 0 L 1 -5 L 2 -10 L 3 -8" />
<path d="M 0 -5 L 1 -10 L 2 -8 L 3 -2" />
```

Updating the line point by point, the transition results in the first point, `(0, 0)`, moving upwards, to `(0, -5)`. As the goal is to actually move the point to the left, the solution is add the new point, translate the entire line to the left and then remove the excess at the beginning.

- while updating the `d` attribute, shift the entire line to the right

  ```js
  .attr('d', lineGenerator(data))
  .style('transform', `translate(${x}px, 0px)`);
  ```

  With this translation, the line doesn't wriggle as the `x` coordinate is preserved. The last point is however outside of the chart area, to the right.

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

To tackle the first issue, the line is translated by the space between two successive points. The book picks the very last two points, to stress the importance of the new data, but ideally any pair of points would do. This is based on the assumption that the data points are all separated by one day.

```js
const lastTwoPoints = data.slice(-2);
const pixelsBetweenLastPoints =
  xScale(xAccessor(lastTwoPoints[1])) - xScale(xAccessor(lastTwoPoints[0]));
```

To fix the second issue it is instead necessary to introduce a new SVG element, `<clipPath>`. Defined in the `<defs>` element, the clip describes an area in which elements are actually shown. In the instance of the line chart, it describes a rectangle spanning the bounded width and height.

```js
bounds
  .append("defs")
  .append("clipPath")
  .append("rect")
  .attr("width", dimensions.boundedWidth)
  .attr("height", dimensions.boundedHeight);
```

The clip has a specific `id` later referenced in the `clip-path` attribute of the to-be-clipped element.

```js
bounds.append("defs").append("clipPath").attr("id", "bounds-clip-path");

const lineGroup = bounds
  .append("g")
  .attr("clip-path", "url(#bounds-clip-path)");
```

#### Minor Tweaks

- the different parts of the visualization, like the axis, the line, the rectangle, are all nested in group elements `<g>`

- the rectangle describing the freezing area limits the `y` coordinate to the bounded height

  ```js
  const freezingTemperatureY = d3.min([dimensions.boundedHeight, yScale(32)]);
  ```

  Without this precaution the risk is to have a negative height, as the height is computed by subtracting the `y` coordinate to the bounded threshold

  ```js
  rectangle
    .attr("y", freezingTemperatureY)
    .attr("height", dimensions.boundedHeight - freezingTemperatureY);
  ```

- the horizontal scale considers the input data from the second point

  ```js
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data.slice(1), xAccessor))
    .range([0, dimensions.boundedWidth]);
  ```

  This is to avoid removing the first point while this one is still visible. Starting with the second point, the first one is mapped to a negative `x` coordinate, which means it is finally removed outisde of the clip area. Comment out the clip to assess this is what actually happens.

  ```js
  const lineGroup = bounds.append("g");
  // .attr('clip-path', 'url(#bounds-clip-path)');
  ```

- the vertical scale is set for the entire dataset instead of only the data passed to the `drawDays` function

  ```js
  const yScale = scaleLinear()
    .domain(extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);
  ```

  This is a quick way to avoid the vertical jump which happens when the new point changes the domain

- the interval calling `drawDays` is cleared as the line reaches the end of the dataset

## 05 - Interactions

_Of note:_ version 6 of the D3 library revised event handlers considerably.

### Events

Listen to events through the `on` method. On a selection, the method specifies the event and a callback function.

```js
selection.on("mouseenter", function () {
  // do something
});
```

The function is called when the event is registered, and has knowledge of the event and the bound data.

```js
const rectangles = bounds.selectAll("rect").data(dates).enter().append("rect");

rectangles.on("mouseenter", function (event, d) {
  // do something
});
```

In this example, the function is executed as the cursor enters into the area described by each rectangle. `event` provides details behind the event, like the `x`, `y` coordinates of the pointer, while `d` describes the data bound to the specific rectangle (in the specific example a date).

_Please note:_ prior to D3 version 6 the callback function received three values: the data bound to the selection, the index and the collection to which the element belonged.

```js
rectangles.on("mouseenter", function (d, i, nodes) {
  // do something
});
```

Again and in the rectangles' example, `d` would describe the date, `nodes` the collection of rectangles, and `i` the index of the invoking rectangle in said collection. To know about the event, the library would have provided the global `d3.event`.

With version 6 it is still possible to know about the index and nodes' collection, but with a different syntax.

```js
rectangles.on("mouseenter", function (event, d) {
  const nodes = rectangles.nodes();
  const i = nodes.indexOf(this);
});
```

_Plese note:_ with the `function` keyword `this` describes the element behind the event. The concept is useful to target the specific element.

```js
rectangles.on("mouseenter", function (event, d) {
  d3.select(this);
  // update the hovered rectangle
});
```

With the ES6 arrow syntax, `=>`, and since version 6, it is still possible to have a reference to the element with `event.currentTarget`.

```js
rectangles.on("mouseenter", (event, d) => {
  d3.select(event.currentTarget);
  // update the hovered rectangle
});
```

With the `on` keyword the library attaches event handlers to the selected element. By passing `null` instead of a callback function it is possible to stop listening for the event.

```js
rectangles.on("mouseenter", null);
```

Finally and with the `dispatch` method it is possible to execute the code of the input event handler.

```js
rectangles.dispatch("mouseenter").on("mouseenter", null);
```

In this instance, the logic described in the callback function is executed once before removing the event.

### Bar Chart

The first interactive example is based on a bar chart, and I decided to use the visualization created for the third chapter, `03 Bar Charts`, as a basis.

#### Stylesheet

The visualization is first updated in the stylesheet, which includes a first type of interaction through the `:hover` pseudo class.

```css
svg rect:hover {
  fill: purple;
}
```

As the mouse hovers on the rectangles, the color is updated to the chosen hue.

_Please note:_ The property overrides the value set through the `fill` attribute.

```js
rectangles.attr("fill", "cornflowerblue");
```

Had the color been set inline and with the `.style` method, the solution would not have worked (at least without the `!important` keyword). This relates to CSS specificity and not to D3 itself.

```js
rectangles
  // .attr('fill', 'cornflowerblue');
  .style("fill", "cornflowerblue");
```

#### Tooltip

Past the stylistic update, d3 manages the contents and position of a tooltip as included in a `<div>` container. The markup is modified from the solution created in the third chapter to nest each bar chart in a `<div>` container.

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
  <div class="tooltip"></div>
  <!-- <svg /> -->
</div>
```

In so doing, the position of the tooltip is made relative to the dedicated wrapper.

```css
.wrapper {
  position: relative;
}

.wrapper .tooltip {
  position: absolute;
}
```

In the stylesheet, the tooltip is modified with a series of properties, mostly to change the appearance of the element, but it is important to highlight the following:

- `z-index` makes it possible to have the tooltip reside above the sibling SVG element

- `pointer-events` set to `none` avoids mouse events on the element. The risk is that when the tooltip is generated it blocks mouse interaction with the elements below

- `opacity` and `visibility` to make the tooltip evident or hidden. The idea is to change the two through D3 and in the script

In the script, D3 finally manages the tooltip as the mouse enters a rectangle.

```js
binGroups
  .append("rect")
  .on("mouseenter", onMouseEnter())
  .on("mouseleave", onMouseLeave());
```

`onMouseEnter` updates the tooltip modifying the text of its nested elements. For instance and in a heading element, the tooltip shows the metric of the particular bar chart.

```js
tooltip.select("h2").text(metric);
```

In terms of style, the function also shows the tooltip by modifying the opacity and visibility.

```js
tooltip.style("opacity", 1).style("visibility", "visible");
```

Most importantly, the function updates the position of the tooltip so that it appears above the selected rectangle. The solution is not simple, and it might help to explain the logic in steps:

- `x` refers to the center of the selected rectangle accessing the coordinates of the range described by `d.x0` and `d.x1`

  ```js
  const x = xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2;
  ```

- `y` refers to the top of the selected rectangle through the value of the rectangle itself

  ```js
  const y = yScale(yAccessor(d));
  ```

- both `x` and `y` are updated to consider the margin included horizontally and vertically in the wrapping `<g>` element

  ```js
  const x = xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2 + margin.left;

  const y = yScale(yAccessor(d)) + margin.top;
  ```

- with the `transform` property, then, the tooltip is translated to the rightful `x` and `y` coordinate

  ```js
  tooltip.style("transform", `translate(${x}px, ${y}px)`);
  ```

  This works, but the tooltip is positioned from the top left corner

- in the `transform` property the `calc` function modifies the position to align the tooltip to achieve the desired alignment

  ```js
  tooltip.style(
    "transform",
    `translate(calc(-50% + ${x}px), calc(-100% + ${y}px))`
  );
  ```

  Percentages in the `transform` property are relative to the dimensions of the element itself, so that `50%` in the first expression describes half the tooltip's width, and `100%` in the second expression refers to its total height

`onMouseLeave` finally hides the tooltip.

```js
function onMouseLeave() {
  tooltip.style("opacity", 0).style("visibility", "hidden");
}
```

#### Format

`d3.format` creates a formatting function with a series of directives.

```js
const format = d3.format(".2f");
```

In this instance `format` can be used to describe numerical values with two numbers after the decimal point.

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

- `[type]`: format with a specific notation, like fixed `f`, decimal `r`, or again percentage `%`

Refer to the [`d3-format` module](https://github.com/d3/d3-format) for the comprehensive list of the possible directives.

### Scatterplot

The second interactive demo relates to the scatterplot introduced in the second chapter, `02 Scatterplot`, and I decided to split the logic of the chapter in two smaller folders: `Scatterplot` to focus on event handlers and `Delaunay` to describe the method to facilitate the selection of the small circles.

Event handlers are included on `<circle>` elements exactly like on rectangles.

```js
bounds
  .append("circle")
  .on("mouseenter", onMouseEnter)
  .on("mouseleave", onMouseLeave);
```

On top of displaying the data points with numerical values the tooltip also includes a date, which is formatted with the `d3-time-format` module. Formatted and parsed actually, as it is first necessary to convert the string describing the points to a date object. The functions work similarly to `d3.format`, with a series of directives describing the format.

```js
const parseDate = d3.timeParse("%Y-%m-%d");
```

In this instance `timeParse` creates a date object from a string displaying the full year, month and day, separated with a hyphen, like `2018-07-23`.

```js
const formatDate = d3.timeFormat("%B %A %-d, %Y");
```

In this instance `timeFormat` formats a date object to show the entire name of the month and day, followed by the number of the day and year, like `July Monday 23, 2018`.

Refer to the [`d3-time-format` module](https://github.com/d3/d3-time-format) for the possible directives.

### Delaunay

The scatter plot from the previous section is enhanced to have the mouse highlight a circle with leeway. The Delaunay triangulation works by partitioning the chart in triangles, each responsible for an individual circle. The data is then shown when hovering on the triangles, and not the smaller units.

The process is formulaic, but effective:

- create the triangulation with `d3.Delaunay.from`. The function accepts three arguments: the dataset and two accessor functions describing to the `x` and `y` coordinates

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

  With `xmax` and `ymax` it is possible to change the area covered by the diagram, and in the project, extend the area to the bound dimensions.

  ```js
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;
  ```

- render the triangles with `voronoi.renderCell`

  ```js
  bounds
    .append("g")
    .selectAll("path")
    .data(dataset)
    .enter()
    .append("path")
    .attr("d", (d, i) => voronoi.renderCell(i));
  ```

  Note that the function receives the index of the bound data

By default, the path are rendered with a solid fill, so that the scatterplot is completely hidden. By setting the value to `transparent` it is possible to hide the elements and still register the mouse events

```js
.append('path')
.attr('d', (d, i) => voronoi.renderCell(i))
.attr('fill', 'transparent')
```

As the triangles are meant to just support mouse interaction, it is unnecessary to show them. If need be, remove the comments from the lines setting a thin stroke.

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

The event handlers are modified to also show a maroon circle in the place of the selected data point. The idea is to include a new circle, instead of modifying the existing shape. In so doing, it is possible to guarantee that the highlighted shape is drawn on top of the circles painted earlier.

```js
bounds
  .append("circle")
  .attr("id", "tooltipCircle")
  .attr("fill", "maroon")
  .attr("r", 5)
  .attr("cx", x)
  .attr("cy", y);
```

`x` and `y` are updated to refer to the coordinates of the selected data point.

The `id` attribute is useful to target and remove the element as the mouse leaves the elements.

```js
bounds.select("#tooltipCircle").remove();
```

### Line Chart

The final interactive demo provides more details for a line chart, a visualization similar to the one introduced in the first chapter, `01 Line Chart`. The biggest change is that the chart focuses on a subset of the entire data.

```js
const data = await d3.json("../../nyc_weather_data.json");
const dataset = data.slice(0, 100);
```

Past this choice, the chart displays a label for the `y` axis, highlighting how the vertical dimension describes the maximum temperature.

In terms of interaction, the idea is to:

- consider the horizontal coordinate of the mouse to find the date

- find the data point closest to the newfound date

- highlight the data point in the a tooltip and with a `<circle>` element.

The final step is similar to the previous demos, so that the biggest hurdle is actually finding the data point.

For the horizontal coordinate, the script first adds an onverlay with a `<rect>` element spanning the entirety of the bound dimensions.

```js
bounds
  .append("rect")
  .attr("width", dimensions.boundedWidth)
  .attr("height", dimensions.boundedHeight)
  .attr("fill", "transparent");
```

The coordinate is then retrieved following the `mousemove` event.

```js
bounds.append("rect").on("mousemove", onMouseMove);
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

Since the pixel coordinate may not describe an actual observation in the line chart it is necessary to the closest value.

Compute a date with the inverse of the horizontal scale

```js
const hoverDate = xScale.invert(xHover);
```

Find the nearest data point with `d3.scan`, comparing the difference between the data points and the hovered date.

```js
const i = d3.scan(/* ... */);
```

Note that since version 6 `d3.scan` is deprecated in favour of `d3.leastIndex`. Moreover, there exist `d3.least` to find the data point instead of the index, so that it is not necessary to find the index first.

```js
const d = d3.least(/* ... */);
```

The functions work by comparing the items of the dataset two at a time.

```js
const d = d3.least(dataset, (a, b) => {});
```

The comparator function computes the difference between the points and the hover date to finally return the difference between the two.

```js
const d = d3.least(
  dataset,
  (a, b) =>
    Math.abs(xAccessor(a) - hoverDate) - Math.abs(xAccessor(b) - hoverDate)
);
```

In this manner the function creates a collection of differences, and returns the smallest value. In this manner `d3.least` identifies the data point with the date closest to the hovered point.

What is left is then finding the coordinates for the value and highlighting the specific observation in the tooltip and added circle. Exactly as for the scatterplot and the Delaunay' demos.

```js
const date = xAccessor(d);
const value = yAccessor(d);

const x = xScale(date);
const y = yScale(value);
```

## 06 - Map

The goal is to plot a choropleth map to highlight population growth by applying a different color on the different countries.

### geoJSON

**geoJSON** refers to the syntax necessary to draw a map. For the project the syntax is obtained as follows:

- download a shapefile from [Natural Earth Data](https://www.naturalearthdata.com/). An `.shp` file provides an alternative format to represent geographic data

- convert the shapefile to GeoJSON objects. The book describes a library, but there are also tools online

The goal is to have as an output a `.json` file, see `world-geojson.json` in the project folder. The file is imported in the script similarly to the data in previous demos and with the `d3.json` function.

```js
const countryShapes = await d3.json("./world-geojson.json");
```

On the return object take notice of the `features` array, which describes a series of `Feature` objects for the countries. Each feature has a `geometry` and `properties` field. The first one describes the coordinates making up each country, while the second one details information on the country itself, like its name or continent.

In the chapter the book introduces two accessor functions to retrieve the country's name and identifier.

```js
const countryNameAccessor = (d) => d.properties["NAME"];
const countryIdAccessor = (d) => d.properties["ADM0_A3_IS"];
```

The name is useful to describe the country, and will become relevant in the moment the country is highlighted with a tooltip. The identifier provides a link to connect the country and the data describing the population growth.

### Data

_Please note:_ the values retrieved from the world bank seems to differ for some countries. This is likely because the data has been updated with more accurate estimates.

Data is retrieved from the [world bank](https://databank.worldbank.org) and for the year 2023, looking specifically at four metrics:

-

- population density

- net migration

- international tourism through receipts

The dataset is in `.csv` format, but the script reads the data similarly to previous projects. The only difference is `d3.csv` is used in place of `d3.json`.

```js
const dataset = await d3.csv("./databank_data.csv");
console.log(dataset);
```

`dataset` described an array with one item for each row. For the project at hand however, the relevant metric is just the population growth.

```js
const metric = "Population growth (annual %)";
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

I decided to use `.reduce()` instead of looping through the data with a `.forEach` loop as in the book, but the logic is the same: loop through the dataset, and include the country code if the item describes the chosen metric.

```js
if (curr["Series Name"] === metric) {
  acc[curr["Country Code"]] = parseFloat(curr["2023 [YR2023]"]) || 0;
}
```

`parseFloat` allows to convert the string to a numerical value, while `|| 0` provides a default value for those countries for which the value value is missing.

### Chart Dimensions

Similarly to previous projects, the chart starts with an object describing the dimensions of the visualization.

Unlike previous projects, however, `dimensions` doesn't initially set the height. The value is computed according to the chosen projection, described in the next section.

### Sphere

An object with a `type` of `'Sphere'` is all that is necessary to eventually draw the outline of the planet.

```js
const sphere = { type: "Sphere" };
```

### Projection

A projection describes how the map is approximated. It is indeed necessary to distort the three dimensional shape of the globe in order to draw the world in two dimensions.

There are several projections, each with its pros and cons, but the book motivates the following guidelines:

- **Mercator** (`d3.geoMercator`) and specifically the _transverse Mercator_ (`d3.geoTransverseMercator`) for maps devoted to countries or smaller geographical units

- **Winkel-Tripel** (`d3.geoWinkel3`) and **Equal Earth** (`d3.geoEqualEarth`) for continents and the entire planet

The documentation for [`d3-geo`](https://github.com/d3/d3-geo) highlights the projections included in the main library, while the [`d3-geo-projection`](https://github.com/d3/d3-geo-projection) module adds more types. Incidentally, `d3.geoWinkel3` is available from this additional module.

In the demo the chosen projection is equal Earth.

```js
const projection = d3.geoEqualEarth();
```

To have the projection consider the bound dimensions, `fitWidth` receives the chosen width and the object of type `'Sphere'` (the object which describes the outline of the planet).

```js
const projection = d3.geoEqualEarth().fitWidth(dimensions.boundedWidth, sphere);
```

### geoPath

`d3.geoPath` provides a generator function similar to `d3.line` as introduced in the first chapter, `01 - Line Chart`. It is initialized with the chosen projection.

```js
const pathGenerator = d3.geoPath(projection);
```

It then receives a GeoJSON object to produce the necessary syntax for the `d` attribute of `<path>` elements. One of these objects, for instance, is the object of type `'Sphere'` introduced earlier.

```js
console.log(pathGenerator(sphere)); // M ....
```

### Chart Dimensions 2

Thanks to the generator function it is possible to compute the vertical dimensions of the chart. `pathGenerator.bounds` returns a two dimensional array with the bounds of the input GeoJSON object. Through the sphere, the function highlights the bounds of the entire visualization: `[[x0, y0], [x1, y1]]`, and finally the height of the bound area.

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
  .range(["indigo", "white", "darkgreen"]);
```

In this instance, `-maxChange` is mapped to indigo, `0` to white and `maxChange` to dark green. Any value in between is interpolated between the chosen colors.

It is important to note that `maxChange` describes the greater between the minimum and maximum population growth, in absolute terms. Using this value instead of the minimum and maximum allows to compare the degree with which countries grow or recede in number.

### Draw Data

The visualization is drawn in a `<svg>` making up the wrapper and a group element `<g>` making up the bounds, exactly like previous projects.

The map itself is drawn with the path generator function, and at least three types of GeoJSON objects:

- the object of type `'Sphere'` for the outline of the planet

  ```js
  bounds
    .append("path")
    .attr("d", pathGenerator(sphere))
    .attr("fill", "#e2f1f1")
    .attr("stroke", "none");
  ```

- the object returned vt `d3.geoGraticule10` for the lines illustrating the longitude and latitude

  ```js
  const graticuleJson = d3.geoGraticule10();

  bounds
    .append("path")
    .attr("d", pathGenerator(graticuleJson))
    .attr("fill", "none")
    .attr("stroke", "#cadddd");
  ```

  The function itself provides a graticule with a set of default options (`10` refers for instance to the degrees separating the longitude and latitude lines). [The documentation](https://github.com/d3/d3-geo#geoGraticule) has more information as to how to customize the grid.

- each object in the `features` array for the countries

  ```js
  bounds
    .append("g")
    .selectAll("path")
    .data(countryShapes.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator);
  ```

  `pathGenerator` works as a shorthand for `d => pathGenerator(d)`, meaning the generating function receives a feature to produce the necessary SVG syntax.

To finally create the choropleth map, the fill of each country considers the color scale and the population growth.

```js
.attr('fill', d => {
  const metricData = metricDataByCountry[countryIdAccessor(d)];
  return metricData ? colorScale(metricData) : 'hsl(206, 14%, 90%)`;
})
```

`hsl(206, 14%, 90%)` is chosen as a default option for those countries not represented in the `metricDataByCountry` object.

### Navigator

`Navigator` is a Web API which provides detailed information regarding the user location, pending consent. In the specific project, it is used to find the longitude and latitude to then draw a circle in the matching location.

```js
navigator.geolocation.getCurrentPosition(position => {
    const { longitude, latitude } = position.coords;
}
```

The projection is here be useful as a function to find the `x` and `y` pixel coordinate for the two input values.

```js
const [x, y] = projection([longitude, latitude]);
```

Knowing the location, it is finally possible to highlight the position of the user.

```js
bounds.append("g").append("circle").attr("cx", x).attr("cy", y).attr("r", 6);
```

### Peripherals

Instead of axis, peripherals are included in the form of a legend, with a label, a byline and a rectangle describing the color scale. Labels are included as in previous projects to describe the metric and a short description. Below these visuals, however, the legend details a rectangle to highlightc color scale. The scale is shown specifically through the fill of the rectangle and a gradient with three colors (the same colors of the range of the color sale).

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

The color is included in the `stop-color` attribute, while the offset is computed on the basis of the element's index so that the `[0, 100]` interval is evenly split in three parts.

```js
linearGradient
  .selectAll("stop")
  .data(colorScale.range())
  .enter()
  .append("stop")
  .attr("stop-color", (d) => d)
  .attr("offset", (d, i, { length }) => `${(i * 100) / (length - 1)}%`);
```

### Interactions

Interactions are included with a tooltip and a couple SVG shapes.

In terms of SVG, a country is shown with a `<circle>`, but also a `<path>` element recreating the selection. The country is rendered first, to eventually show the circle above it.

The `<path>` is recreated with the path generator function.

```js
bounds
  .append("path")
  .attr("id", "tooltipCountry")
  .attr("fill", "cornflowerblue")
  .attr("d", pathGenerator(d));
```

The circle is positioned thanks to the `centroid` method, providing the center of a GeoJSON object and for a specific generator function.

```js
console.log(pathGenerator.centroid(sphere)); // [x, y]
```

For the tooltip, then, the HTML element highglights the selected country and the connected metric. If the metric is not available, the paragraph displays a default message.

```js
tooltip
  .select("p")
  .text(
    metricData
      ? `${formatMetric(metricData)}% population change`
      : "Data not available"
  );
```

The position of the tooltip refers to the same coordinates computed for the circle, but adjusted for the chosen margins.

### Delaunay

As suggested in the book, mouse interaction can be improved with Delaunay's triangulation. The logic is fundamentally the same as in the interactions chapter: include a series of `<path>` elements above the map and attach the mouse event to said shapes.

```js
bounds
  // bind features
  .append("path")
  .attr("d", (d, i) => voronoi.renderCell(i))
  .attr("fill", "transparent")
  .on("mouseenter", onMouseEnter)
  .on("mouseleave", onMouseLeave);
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

  - discrete, when it's not possible to interpret a value intermediate of two measurements (number of cards)

  - continuous, when it's possible to interpolate between two values (degrees)

The type of data influences the type of chart. Picking for instance the temperature, the continuous metric can be highlighted with a bar chart (the height of the bars), a scatterplot (the `y` coordinate) or again color (the fill of circles, the gradient of a rectangle).

### Humidity Timeline

_Please note_: in the folder I created two directories for the project, showcasing the starting visualization and the redesigned version built on top.

The goal is to create a visualization highlighting how humidity changes depending on the time of the year.

Starting from a rudimentary timeline, the book illustrates how to design the line chart to answer the question with more focus and purpose.

The base visualization is updated as follows:

- the line plots the data with a curve

  ```js
  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)))
    .curve(d3.curveBasis);
  ```

- instead of considering every data point, the line generator maps the average value on a weekly basis

  ```js
  lineGroup.append("path").attr("d", lineGenerator(downsampleData));
  ```

  `downsampleData` considers the weekly averages with `d3.timeWeeks`, a function generating the weeks from the start to end date

  ```js
  const weeks = d3.timeWeeks(
    // xAccessor(dataset[0]) possibly skips the days in the first week
    timeWeek.offset(xAccessor(dataset[0]), -1),
    xAccessor(dataset[dataset.length - 1])
  );
  ```

- the data points are preserved through light grey circles

- the `y` axis displays fewer ticks modifying the axis generator function

- the label for the `y` axis is moved above the line chart, next to the topmost value

- the `x` axis is removed

- for the seasons, the line chart includes a semi-transparent rectangle and a line highlighting the mean

  ```js
  seasonGroup.append("rect");

  seasonGroup.append("path");
  ```

  The groups are bound to an object detailing the season.

  ```js
  const seasonsGroups = seasonsGroup
    .append("g")
    .selectAll("g")
    .data(seasonData)
    .enter()
    .append("g");
  ```

  `seasonData` is built to have each data point represented by a season. `d3.timeYears` and `d3.timeMonth` are used to create an array describing one year more than necessary.

  ```js
  const years = d3.timeYears(d3.timeMonth.offset(startDate, -13), endDate);
  ```

  An additional (preceding) year is necessary to contemplate the winter season at the beginning of the dataset.

  `d3.timeYears` produces an array of date objects. A formatting function is then used to have `years` describe the integer value only.

  ```js
  const years = d3
    .timeYears(d3.timeMonth.offset(startDate, -13), endDate)
    .map((yearDate) => parseInt(d3.timeFormat("%Y")(yearDate)));
  ```

- ticks on the `y` axis show the seasons' averages

- custom ticks on the `x` axis label the seasons

### Color Scales

The project illustrates how to include color with the `d3-scale-chromatic` and `d3-interpolate` modules.

It is important to note the following:

- categorical scales are based on an array of distinct colors, like `d3.schemeCategory10`. You access individual colors by index, for instance `d3.schemeCategory10[0]`

- sequential, diverging, cyclical scales work as a scale with a domain of `[0, 1]` and a range describing the colors. Consider `d3.interpolateBlues()`; you obtain a color by calling the function with a specific number, like `d3.interpolateBlues(0.5)`

- when interpolating between two or more colors, D3 supports both the scale and array syntax. `d3.interpolateBlues()`, for instance, creates a proper scale, while `d3.interpolateBlues[n]` creates an array of `n` colors in the color range

- functions from the `d3-interpolate` module allow to interpolate between two colors in a given color space. In this light, it is helpful to have a brief overview of the different formats:

  - keywords like `cornflowerblue` provide a first way to describe color. It is important to also highlight `transparent`, used in a previous project to hide elements like Delaunay's `<path>`s, and `currentColor`, useful to consider the value from the `color` property

  - `rgb[a]` describes a color through its red, green and blue components. `a` describes the optional alpha channel for the opacity of the color. Each component is a number in the `[0, 255]` range, and colors are mixed with additive fashion, meaning `rgb(255, 255, 255)` is completely white

  - `hsl[a]` describes a color with a hue, saturation and lightness. The hue is a number in the `[0, 360]` range going from red, 0, to green, 120, to blue, 240, back to red, 360. Saturation is a percentage going from grey, 0% to fully saturated, 100%. Lightness is a percentage going from black, 0%, to white, 100%

  - `hcl[a]` describes a color with a hue, chroma and lightness. The chroma is a number in the `[0, 230]` range influencing the saturation, while the lightness a number in the `[0, 100]` interval. The difference from the hsl color space is that two values with the same lightness value have the same perceived lightness. In light of this, the format is useful to avoid contrasting levels of saturation

## 08 - Common Charts

The chapter introduces a few types of data visualizations with the goal of laying the foundation for more complex projects.

_Please note:_ in each sub-folder I try to replicate the visualizations described in the book on my own.

### Candlestick

A candlestick chart highlights stock prices in terms of open, close, high and low value.

In terms of the D3 library take notice of the following:

- `d3.csv` considers comma separated values describing hypothetical stock prices

- `d3.schemeSet1` provides an array of colors to distinguish gains and losses

- `d3.timeDay.offset` is used to stretch the horizontal scale one day before and one day after the actual domain. The function is useful in the context of the time scale to provide some padding around the values. A different approach would be to use a band scale, and have each observation positioned at a fraction of the available width

### Timeline

The goal with a timeline is to study the evolution of a metric over time. It is important to focus on the granularity of the time scale, or again the smoothness of the line connecting the individual points. It is essential, finally, to accurately describe which data is included in the line; consider for instance how the redesign in chapter seven used the weekly mean instead of daily observations, and how the visualization preserved the values through small, grey circles.

The project in the folder is fundamentally a copy of previous line charts. The visual is however focused on the points making up the line and the interpolating curve. With a `<input>` element of type `checkbox` it is possible to toggle the visibility of the points. With a `<select>` element and a few `<option>`s, it is possible to change the function used in the line generator function.

The book argues for `curveMonotoneX` as a solid choice for the interpolator function, crossing through all the points. `curveBasis` provides a smoother line, but doesn't guarantee the same type of precision.

### Heatmap

Taking inspiration from the visualization highlighting profile contributions on GitHub, a heatmap displays a series of observations in a grid, and depicts a continuous or discrete metric through color.

Since the visualization relies on the color of individual cells it is useful to show trends over time. It is not as effective to describe small differences between values.

The demo itself includes a button to cycle through different metrics similarly to the bar charts developed in the fifth chapter.

In terms of D3, the project provides a good exercise with the `d3-time` module, specifically `d3.timeWeeks`, `d3.timeMonths` and the directives included in the parsing and formatting functions.

### Radar

A radar chart is useful to compare multiple metrics. While it is possible to include several polygons in the same chart, it is preferable to limit the number of overlapping shapes and differentiate them by color. With a large number of visual consider using a button to cycle through the shapes, or multiple, separate radar chart. In the demo I chose the first approach, leaning on two functions from the `d3-shape` module:

- `d3.lineRadial`. The generator function works similarly to `d3.line`, but computes the `x` and `y` coordinate of the line on the basis of an angle and radius

  ```js
  const lineGenerator = d3
    .lineRadial(..)
    .angle(..)
    .radius(..);
  ```

- `d3.areaRadial`. Similarly to `d3.area` the function specifies two values to describe the area below the curve. The values are those for the radii instead of `y` coordinates

  ```js
  const areaGenerator = d3
    .areaRadial(..)
    .angle(..)
    .innerRadius(..)
    .outerRadius(..);
  ```

### Scatter

A scatterplot is useful to study the relationship between two metric values.

The demo includes a copy of the scatterplot introduced earlier in the repository. Here, however, the focus is on the type of relationship between the two metrics:

- positive, between maximum and minimum temperature

- negative, between wind speed and air pressure

- null, between wind speed and humidity

The demo includes a line of best fit showing the correlation, if any, with a `<path>` element.

_Please note:_ the line of best fit is computed considering the `y` coordinate with two `x` values, those describing the beginning and the end of the visualization. A `<clipPath>` element helps to limit the `<path>` element to the bound dimensions.

### Pie and Donut

A pie or donut chart is useful to focus on the parts of a whole. It is difficult to interpret differences between slices, especially with small differences and numerous variables, but the type can provide a few insights. Focus on a few slices, five at most, sort the values (the pie generator function sorts the values by default), and consider adding more information with labels or accompanying visuals.

The demo introduces two functions from the `d3-shape` module:

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

  - `startAngle` and `endAngle`, already included through the pie genertor function

  The resulting function is useful to fabricate the slices, but also to position the shapes with the ulterior `centroid` method

_Please note:_ `index.html` defines a few icons which are then referenced with `<use>` elements. The `id` attribute of the icons matches the key used to describe the data.

### Histogram

_Please note:_ the folder doesn't include a demo for the histogram, because the third chapter already implements the type for multiple variables.

A histogram is useful to analyze the variation in the values of a metric.

There are generally five types of distributions:

- normal, or gaussian, where the observations are centered around the mean

- skewed to the right, with a greater number of values in the upper half

- skewed to the left, focused in the bottom half

- bimodal, with two peaks

- symmetric, with a homogeneous set of observations

### Box Plot

With a box plot it is possible to study the distribution of a numerical variable. The median is useful to describe the tendency of the metric, while the 25th and 75th percentile, also know as 1st and 3rd quartile, provide a measure of the variability.

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

For the visualization:

- outliers are those points which exceed the mean by the interquartile range, the difference between first and third quartile, multiplied by a measure of one and a half

For the D3 library:

- `d3.scaleBand` provides the horizontal coordinate by mapping a discrete domain (an array describing the months) to a continuous range (the bounded width)

- `d3.timeMonths` works similarly to `d3.timeWeeks` in the redesign of the timeline of the seventh chapter. The function creates an array of date objects for the months between the input dates

- in terms of data binding it is possible to bind two nested layers. Consider how the groups for the boxes are bound to `monthData` and the circles are bound to the array describing the outliers, `d.outliers`

## 09 - Dashboard

A dashboard is loosely discussed as an interface for data, a display for the accurate value of metrics as weel as complex visualizations to provid more insights.

### Weather Metrics

The first demo works to show a rudimentary dashboard for three metrics describing the wind speed, visibility and atmospheric pressure for a given day.

Instead of using `<svg>` elements, I decided to bind the data to HTML elements.

The redesign works to show how the dashboard can be improved by describing the meaning of the metrics and by providing more context around the values themselves.

In practice:

- the values are formatted to consider fewer decimal numbers with a fixed notation

- the metrics are displayed with labels distinct from the value of the connected property. `windSpeed` is displayed as `Wind Speed`, `visibility` as `Visibility` and `pressure` as `Atmospheric pressure`

- each metric is accompanied by a heading displaying the unit of measure

- each metric is accompanied by a small graphic highlighting the value in the context of the dataset, where the value fits in the domain

The project highlights a few methods from the D3 library:

- `d3.scaleQuantize` to create a scale mapping a continuous domain to a discrete range.

  For the label above the gauge component, the idea is to display one of five options, from very low to very high, according to where the value fits in the domain.

  ```js
  d3.scaleQuantize().range(["Very low", "Low", "Average", "High", "Very high"]);
  ```

  `scaleQuantize` divides the domain in intervals of equal size, so that if the value falls in the first 20% of values, it is associated to the `Very low` label. Between 20% and 40% to the `Low` label and so forth.

- `d3.color` is useful to create a color which is then customized with the `.darker()` method.

  ```js
  d3.color(..).darker(1.5)
  ```

  In the project, the function receives a color from the `d3.interpolateBlues` scale.

### Feed Metrics

The demo for the starting point considers a few metrics connected to a news feed with the same visual designed for the weather dashboard. The focus is here on the number of views and articles connected to a hypothetical subject.

The redesign improves the visualization with an additional metric: _demand_. Here the goal is to show how data can be turned into insight, into an actionable metric.

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
d3.json("../../nyc_weather_data.json").then((dataset) => {
  if (dataset.length === 0) {
    handleEmptyState();
  } else {
    handleLoadedState(dataset);
  }
});
```

If not successful, the idea is to then show the error state.

```js
d3.json("../../nyc_weather_data.json").catch((error) => {
  console.error(error);
  handleErrorState();
});
```

_Please note_: in its current design, the promise should always resolve, leading to the loaded state. To highlight the other states try modifying the logic of the promise. To highlight an error, for instance, have the promise look for a non-existing file.

```js
d3.json("../../nyc_weather_data.jso");
```

To highlight the lack of data force the condition to handle the empty state.

```js
if (true) {
  handleEmptyState();
}
```

### Outliers

The projects work to showcase how to handle outliers, values which vary from the mean and are prone to skew the perception of the visualization.

There is not one solution for every visualization, and it is important to consider the influence of outliers case by case. For instance, to visualize the popularity of articles in terms of views, it might be useful to preserve outliers in recent data, as to highlight potential spikes. It might be then more informative to crop the value (with an accompanying label) after an arbitrary amount of time and focus on the overall trend instead. This is exactly what happens in the demo exploring the bar chart: in the first visualization the scale considers the maximum value, while in the second visual the domain is capped at a threshold considering the mean and standard deviation.

It is important to stress that the bar chart shows one way to handle outliers, and defines an outlier with another arbitrary decision. The second demo describing a timeline proves this by plotting the number of views and articles. The number of articles is shown with a series of dots, and the number of dots is limited to a third of the bounded height. An outlier is here any observation with more articles than can fit in the chosen fraction of the height and is highlighted with a small arrow pointing upwards.

### Table

A table provides an effective layout to focus on exact values. In the first demo the data is included as-is, without much consideration in terms of design. The project is still useful to rehearse data binding with HTML elements.

In the second demo the table is redesigned both in style and function. In the stylesheet, the table is updated as follows:

- the table removes the border, included as a rudimentary way to distinguish the data

- whitespace is increased in the form of considerable padding

- the font is updated with the `font-feature-setting` property so that numbers have the same character width. This is a feature available some typefaces which makes it easier to compare numbers in different rows

- the column dedicated to the summary is reduced in importance through the `font-size` property

- the row describing the head of the table is fixed to the top of the table with the `position` property set to `sticky`. The same row uses a dark background and a light color for the text to create a clear disinction with the body of the table

- the rows alternate in background color to stress the distinction between observations

- the rows are highlighted on hover through the color of the background

In the script, the content is updated as follows:

- the columns are aligned left if they include text, right if they show numbers

- the values are formatted with the `d3-format` and the `d3-format-time` modules to provide more readable labels

- the maximum temperature and the wind speed show the value in context with a color scale and the `background` property

- the UV index is represented with a series of icons instead of a numerical values

- the column describing the precipitation type is substituted with one detailing the presence, or lack, of snow. Snow is signalled with an icon instead of a label

- the time describing the maximum temperature is represented through the horizontal position of a line instead of a label describing the hour. Take notice that the field `temperatureMaxTime` details the number of seconds since the UNIX epoch and, as per [d3 own documentation](https://github.com/d3/d3-time-format#locale_format), it is possible to parse a date with the `%s` directive. The table designed in the book seems to use the `apparentTemperatureMaxTime` field, which explains the differences in the position of the line

_Please note:_ considering the entire dataset, the risk is to having the table exceedingly wide. This is mostly due to two fields: summary and UV index. For the first field, the solution is to limit the width of the associated text. For the second field, one solution is to limit the number of icons associated with the index, and highlight a greater value with another visual.

### Layout Design

The folder highlights how a dashboard works best when it focuses a clear message and a few metrics. The first demo shows the minimum and maximum temperature leading up to a selected day with a timeline. The second demo focuses on three metrics side by side.

### Deciding Questions

The folder focuses on two questions essential to the design of a dashboard:

1. how familar are users with the provided data

2. how much time do user spend with the visualization

These issues compel a different visualization. Consider for instance how inexperienced users might benefit from a short explanation (first demo), or again how time-sensitive readers might prefer a single metric instead of an elaborate visualization (second demo).

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

The visualization includes a solid background in the form of a rectangle spanning the entirety of the bound dimensions. The shape is helpful to create a clear distinction between the scatterplot and the surrounding visuals (axis and soon-to-be histograms).

#### Domain

Both dimensions use the same domain to have the sides immediately comparable.

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

The idea is to have the interpolator function receive a date and return a color in a prescribed interval. In the project, the interpolator makes a reference to the `d3.interpolateRainbow` function, which receives a value in the `[0, 1]` range to return a color in the rainbow spectrum.

```js
d3.scaleSequential()
  .domain([
    parseDate(`${colorScaleYear}-01-01`),
    parseDate(`${colorScaleYear}-12-31`),
  ])
  .interpolator((d) => d3.interpolateRainbow(d * -1));
```

By multiplying the value by `-1` it is possible to invert the rainbow, and have the warmer season described by warmer colors (red, orange, yellow).

---

This is helpful for my own understanding, but the interpolator function might also work as follows:

```js
.interpolator(d => `hsl(${d * 360}, 80%, 60%)`);
```

Here the color is picked from the hslcolor wheel in the `[0, 360]` range, with a fixed saturation and lightness. With `d3.color` it could also be possible to lean on the hcl format, obtaining a color wheel with the same perceived lightness.

```js
.interpolator(d => d3.hcl((d * 360 + 220) % 360, 160, 75));
```

---

The scale is used to color the circles in the scatterplot.

```js
.append('circle')
.attr('fill', d => colorScale(colorAccessor(d)));
```

However, the scale is also included in the `<linearGradient>` element to color the legend. Here you include one `<stop>` element for each month, creating a gradient through twelve colors.

```js
.selectAll('stop')
.data(d3.timeMonths(...colorScale.domain()))
```

`d3.timeMonths` creates an array of dates between a start and end date. These dates are handily obtained through the domain of the scale itself.

The scale is useful elsewhere, for instance in the `fill` color of the histograms created for the highlighted circles (soon-to-be).

#### Histograms

The goal is to include two histograms describing the overall distribution of the temperatures across the year.

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

  `x0` and `x1` are two fields included by the bin generator for each array for the start and end value (in this instance in terms of minimum temperature).

  As mentioned, the function is finally included in a `<path>` element above the scatterplot.

  ```js
  topHistogramGroup
    .append("path")
    .attr("d", topHistogramAreaGenerator(topHistogramBins))
    .attr("fill", "currentColor");
  ```

The same logic is repeated for the right side, but the histogram is ultimately flipped and positioned to have the visualization highlight the ranges top to bottom.

#### Scatterplot Interaction

When hovering on the scatterplot, the visualization highlights a specific circle. This is implemented exactly as in the chapter devoted to interactions, with a tooltip and Delaunay's triangulation, so I won't devote much attention to the code. I will note, however, that beside the tooltip and the circle highlighting the selection, the visualization includes two rectangle elements to highlight the color in the context of the histogram.

```js
highlightGroup.append("rect");

highlightGroup.append("rect");
```

One important mention goes to the `mix-blend-mode` property, used to have the rectangles virtually hidden above the white background. This helps focusing the attention on the accompanying histograms.

```js
highlightGroup.style("mix-blend-mode", "color-burn");
```

The highlight group is also included before the scatterplot so that the rectangles are drawn below the circles.

#### Legend Interaction

The idea is to highlight a set of values when hovering on the legend. The implementation is slightly different from that describes in the book, but relies on the same visuals.

Immediately, `legendHighlightGroup` is created to contain two elements: a `<text>` working as a label and a `<rect>` to highlight the selected date, or more precisely the selected range.

```js
legendHighlightGroup.append("text");

legendHighlightGroup.append("rect");
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
  .select("rect")
  .attr("x", legendTickScale(d1))
  .attr("width", legendTickScale(d2) - legendTickScale(d1));
```

The label is also updated in position, similarly to the rectangle, but also and notably in the text, in order to display the dates with the chosen month and date.

```js
const formatLegendDate = d3.timeFormat("%b %d");

legendHighlightGroup.text(`${formatLegendDate(d1)} - ${formatLegendDate(d2)}`);
```

The two dates are however and most importantly used to highlight the dots with the appropriate date. This is achieved by considering every circle and changing the opacity according to the date.

```js
scatterplotGroup
  .selectAll("circle")
  .style("opacity", (d) => (isWithinRange(d, d1, d2) ? 1 : 0));
```

The date of reference is always in the year, to account for data potentially expanding beyond one year.

```js
function isWithinRange(datum, d1, d2) {
  const yearDate = dateAccessor(datum).setYear(colorScaleYear);
  return yearDate >= d1 && yearDate <= d2;
}
```

The function is used to hide/show the data matching the selection, but also and finally to create mini-histogram. This last step showcases the usefulness of d3 and its generator functions. What is necessary is to:

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
  .style("opacity", 1)
  .attr(
    "d",
    topHistogramAreaGenerator(topHistogramGenerator(highlightDataset))
  );
```

_Plese note:_ there are parts I elected not to document, hoping to focus on the most prominent sections of the code. Consider, for instance, how the function called when hovering on the legend includes a few more instructions which work to provide more polish:

- the labels and ticks above the legend are hidden when hovering on the legend, allowing to focus on the highlight

- the mini-histogram are attributed a color based on the selected date

### Radar Weather Chart

The second complex visualization focuses on a radial line chart studying the weather dataset through multiple metrics. The code is well worth a read, and what follows is but a few notes on the structure of the visualization and the D3 library.

#### Peripherals

Before the actual data, the goal is to show the axis with a series of lines radiating from the center and describing the months of the dataset.

`d3.timeMonths` is useful to create an array of date objects, one for each month between the start and end date.

```js
const months = d3.timeMonths(...angleScale.domain());
```

Instead of computing the `x` and `y` coordinate of where the lines should end, the `<path>` element draws a straight line upwards and then rotates the line from the center of the visualization.

```js
.attr('transform', d => `rotate(${(angleScale(d) * 180) / Math.PI})`)
```

The name of the months is included with a `<text>` element, and while it would be possible to position the elements with the `transform` attribute, the cosine and sine function are helpful to find the correct coordinates.

```js
const angle = angleScale(d) - Math.PI / 2;
const x =
  Math.cos(angle) * (dimensions.boundedRadius + dimensions.margin * 0.6);
const y =
  Math.sin(angle) * (dimensions.boundedRadius + dimensions.margin * 0.6);
```

The `text-anchor` attribute is modified to have the text aligned left, center or right according to the horizontal position.

```js
return Math.abs(x) < 5 ? "middle" : x > 0 ? "start" : "end";
```

Past the axis, grid lines are included with a series of `<circle>` element, for a set of arbitrary temperatures. `d3.ticks` creates an array of values based on a scale, and it is here helpful to find the radius of the circles.

```js
const temperatureTicks = radiusScale.ticks(4); // [20, 40, 60, 80, 100]
```

The ticks are represented with circles, but also `<text>` elements, positioned vertically and above a solid rectangle. The rectangle, positioned and sized rather tentatively, provides a background to avoid a visual conflict between labels and grid lines.

#### Data

The radar chart describes multiple metrics, like the temperature, UV index, cloud cover and precipitation registered in the year.

For the temperature, `d3.areaRadial` helps to build an area chart around the center.

```js
const temperatureAreaGenerator = d3
  .areaRadial()
  .innerRadius((d) => radiusScale(temperatureMinAccessor(d)))
  .outerRadius((d) => radiusScale(temperatureMaxAccessor(d)));
```

`innerRadius` and `outerRadius` describe the area below the line so that the visualization highlights the maximum and minimum temperatures.

```js
const temperatureAreaGenerator = d3
  .areaRadial()
  .angle((d) => angleScale(dateAccessor(d)));
```

`angle` refers to the date of each observation to complete the full circle one point at a time.

The generator function already plots the desired shape.

```js
temperatureGroup.append("path").attr("d", temperatureAreaGenerator(dataset));
```

Instead of a solid fill, however, the code introduces a `<radialGradient>` element, similarly to the `<linearGradient>` of previous demos. The most important feature of the gradient is that the colors are picked from a chromatic scale of the `d3-scale-chromatic` module.

```js
const gradientColorScale = d3.interpolateYlOrRd;
```

For the UV index, the visualization focuses on a subset of the dataset, and those observations with an index greater than an arbitrary threshold.

```js
const uvIndexThreshold = 8;
const uvIndexData = dataset.filter(
  (d) => uvIndexAccessor(d) >= uvIndexThreshold
);
```

The index is finally highlighted with `<path>` elements at the very edge of the chart.

```js
.append('path')
.attr('d', `M 0 -${uvIndexY} v -${uvIndexStrokeLength}`)
```

Cloud cover is represented with `<circle>` elements of varying radius. The radius is relative to the value, as per the domain.

```js
.domain(d3.extent(dataset, cloudCoverAccessor))
```

It is important to highlight that the scale is here `scaleSqrt`. This is because the size of a circle is better understood in terms of area, and it is therefore preferable to change the radius with by squaring the metric.

```js
const cloudCoverRadiusScale = d3
  .scaleSqrt()
  .domain(d3.extent(dataset, cloudCoverAccessor))
  .range([1, 10]);
```

pi is a constant, so that it is possible to focus on the squared relationship between area and radius.

```code
A = Math.PI * r ^ 2
```

Precipitation is described with `<circle>` elements, and through two metrics: type and probability. Starting with the probability, the metric is mapped to the size of the circles exactly like cloud cover.

```js
const precipProbabilityRadiusScale = d3
  .scaleSqrt()
  .domain(d3.extent(dataset, precipProbabilityAccessor))
  .range([1, 8]);
```

The type is however included in the color of the circles, in the `fill` attribute, mapping the vlaue of the three known types (rain, sleet and snow).

```js
const precipTypes = ["rain", "sleet", "snow"];

const precipTypeColorScale = d3
  .scaleOrdinal()
  .domain(precipTypes)
  .range(["#54a0ff", "#636e72", "#b2bec3"]);
```

The types are included with an ordinal scale, which maps a discrete domain to a discrete range (for instance `rain` is mapped to `#54a0ff`).

#### Annotations

Annotations are included a `<path>` and `<text>` element. The text is positioned outside of the radar chart, while the path points from a feature of the radar chart to the label itself. `drawAnnotation` is helpful to repeat the instructions for the different metrics.

```js
function drawAnnotation(text, angle, offset) {}
```

`offset` describe where the line should start, while `angle` refers to the position around the radar. Instead of using hard-coded angles, I opted to pick the angle from the dataset. This allows to point to actual values.

```js
drawAnnotation(
  "Cloud Cover",
  angleScale(dateAccessor(dataset[22])),
  dimensions.boundedRadius + dimensions.margin * 0.5
);
```

The label for the UV index tends to exceed the limits of the `<svg>` container, and a quick solution would be the `overflow` property. The option may work for pages entirely devoted to a visualization, but is a liability when the chart is part of a more elaborate layout.

```css
#wrapper svg {
  overflow: visible;
}
```

#### Interaction

The tooltip highlilghts a specific date and its multiple metrics. The solution is different from that of the book, but again starts with a `<circle>` element with a transparent fill is overlaid on the radar chart, so that it is possible to listen to mouse events anywhere in the visualization.

```js
bounds
  .append("circle")
  .attr("r", dimensions.boundedRadius + dimensions.margin)
  .attr("fill", "transparent")
  .on("mousemove", onMouseMove)
  .on("mouseleave", onMouseLeave);
```

In the `event` received by the `mousemove` listener, it is possible to obtain the angle from the given `x` and `y` coordinates.

```js
const [x, y] = d3.pointer(event);
const theta = Math.atan2(y, x);
```

`Math.atan2` provides the angle in radians, but in the `[-Math.PI, Math.PI]` range and starting from the left of the radar chart. For the visualization, it is however helpful for the value to be always positive, and starting from the top of the chart, as to describe an angle in the domain of the angle scale.

```js
let angle = theta + Math.PI / 2;
if (angle < 0) {
  angle += Math.PI * 2;
}
```

A date is finally computed with the angle scale through the `invert` method.

```js
const date = angleScale.invert(angle);
```

The position of the tooltip is made relative to the center of the visualization.

```js
const translateX = `calc(${
  dimensions.boundedRadius + dimensions.margin + tooltipX
}px - 50%)`;

const translateY = `calc(${
  dimensions.boundedRadius + dimensions.margin + tooltipY
}px - 50%)`;
```

The tooltip is then set to describe the metrics with a series of HTML elements:

- a header describes the date through the month and day

- a paragraph details the temperature ranges

- a description list highlights the UV index, cloud cover and precipitation metrics. The `<dl>` element is helpful to nest the set of key-value pairs

_Please note:_ instead of changing the color of the elements in the tooltip, I opted to change the color of a border. This is but a preference as I felt the text is more legible with a fixed, dark hue.

_Please note:_ the angle is also used to generate the syntax for the `<path>` element connecting the tooltip to the center of the visualization. `d3.arc` function is here helpful to create the arc, considering the inner, outer radii and the start and end angles.

```js
const arcGenerator = d3
  .arc()
  .innerRadius(0)
  .outerRadius(tooltipDistance)
  .startAngle(angle - 0.02)
  .endAngle(angle + 0.02);
```

<!--

### Animated Sankey Diagram

The third visualization tries to convey data by animating a series of elements. Starting from [data examining educational attainment as a function of gender and socioeconomic status](https://nces.ed.gov/programs/digest/d14/tables/dt14_104.91.asp), the goal is to have circles and triangles move from one end of the screen to the other following a specific path. The path connects the economic status (one of three possible options) to the education level (one of six options) .

#### Data

The mentioned source provides the data behind `education.json`. For each category describing the starting data; for each combination of gender and socioeconomic status, an object details the level of education achieved. The level is expressed through a percentage, so that all possible categories tally to 100%.

From `education.json`, the goal is to create a person with an object describing the three metrics: sex, socioeconomic status (henceforth ses) and education. The metrics are repurposed to be integers, which helps mapping the value to the visualization.

```js
{
  sex: 0,
  ses: 0,
  education: 0
}
```

The person in the snippet is a female with low economic status who left the education system before high school.

Data accessor functions are accompanied with two arrays, one describing the possible options, in the desired order, and one describing the integer values.

```js
const sexAccessor = (d) => d.sex;
const sexNames = ["female", "male"];
const sexIds = d3.range(sexNames.length);
```

`d3.range` helps creating an array of integer starting from `0` up to, and not including, the input integer.

To create a person, `generatePerson` picks a random value for the sex and ses metrics. For the education then, it considers the cumulative probability of the education for the specific sex-ses combination. `stackedProbabilities` uses a `reduce` function to describe the probabilities of each combination with an object.

```js
{
  ["female--high"]: [
    0,
    0.018000000000000002,
    0.21900000000000003,
    0.281,
    0.34,
    1
  ],
  // ...
}
```

With the computed values, it is enough for `generatePerson` to compute a random value between zero and one, and then find where the value would fit in the array. `d3.bisect` returns this index.

```js
// stacked probabilities for the specific sex-ses combination
const probabilities = stackedProbabilities[key];
// 0-1
const probability = Math.random();
// index
const education = d3.bisect(probabilities, probability);
```

#### Paths

The idea is to draw lines connecting the edges of the visualization, connecting every possible ses to every possible education level. This is achieved with three scales:

- an horizontal scale mapping values in the `[0, 1]` interval to the bounded width

  ```js
  const xScale = d3
    .scaleLinear()
    .domain([0, 1])
    .range([0, dimensions.boundedWidth])
    .clamp(true);
  ```

  The domain is chosen to have the progress of the shapes describe their position. From zero to one, from the left to the right of the bounded dimensions.

  `.clamp` helps to constrain the value to the range. Smaller values than `0` will still be mapped to `0` while greater values than `1` will be mapped to `dimensions.boundedWidth`

- a vertical scale describing the starting coordinate

  ```js
  const startYScale = d3
    .scaleLinear()
    .domain([sesIds.length, -1])
    .range([0, dimensions.boundedHeight]);
  ```

  The scale is based on the ses value.

- a vertical scale describing the ending `y` position

  ```js
  const endYScale = d3
    .scaleLinear()
    .domain([educationIds.length, -1])
    .range([0, dimensions.boundedHeight]);
  ```

  The scale is based on the education level.

Both vertical scales include a domain which exceeds the dimensions of the array, to ultimately provide some padding on either side.

With these scales, the line generator function receives an array of points. The points are created with an arbitrary number of arrays, connecting the values by repeating the ses and education values. For instance, the link connecting the `low` ses to the `Bachelor and Up` education is represented as follows.

```js
const example = [
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 5],
];
```

Receiving these points, `d3.line` uses the index for the horizontal coordinate, while choosing the first or second value for the vertical counterpart.

```js
const linkGenerator = d3
  .line()
  .y((d, i) => (i < linkPoints / 2 ? startYScale(d[0]) : endYScale(d[1])));
```

For the first half the function considers the start scale, while the rest of the points are mapped with the end scale, effectively connecting the desired pair.

```js
bounds
  .append("path")
  .attr("d", linkGenerator(example))
  .attr("fill", "none")
  .attr("stroke", "currentColor")
  .attr("stroke-width", dimensions.pathHeight);
```

`d3.merge` helps to create the necessary combinations, as it is useful to flatten a 2D array considering the ses and education values.

```js
d3.merge(
  sesIds.map((startId) =>
    educationIds.map((endId) => Array(linkPoints).fill([startId, endId]))
  )
);
```

`d3.curveMonotoneX` is finally useful to smoothen the lines, in favor of the default linear interpolation.

```j
d3
  .line()
  .curve(d3.curveMonotoneX);
```

_Please note:_ the following two lines are equivalent.

```js
// .attr('d', d => linkGenerator(d))
.attr('d', linkGenerator)
```

`linkGenerator` receives the array of points to return the desired syntax. The second option is more concise, while the first is more clear as to the argument of the function.

#### Peripherals

Text elements are included at either end of the visualization, describing the ses and education values.

Additional elements are included later as metrics, with a series of bars and text labels highlighting how many reached the specific end.

#### People

People are described through two basic shapes:

- circles with a given radius

  ```html
  <circle r="5" />
  ```

- triangles with a series of points

  ```html
  <polygon points="-6,5,6,5,0,-5" />
  ```

The idea is to create a person in a loop, and map the specific gender to either shape. `d3.timer` is here the essential function; it receives as argument a callback function which is called iteratively until the timer is stopped.

```js
d3.timer(updateMarkers);
```

The function itself receives as argument the number of milliseconds elapsed since the timer is first initiated.

```js
function updateMarkers(elapsed) {}
```

_Please note:_ in the code I've chosen to stop the timer after a fixed number of generations.

```js
const time = 5000;
const generations = 5;
let timer;
function updateMarkers(elapsed) {
  if (elapsed > time * generations) {
    timer.stop();
  }
}

timer = d3.timer(updateMarkers);
```

`time` is used to describe the amount of time it takes for a shape to move from end to end. The horizontal coordinate is increased through the `elapsed` number of milliseconds divided by `5000`, meaning a complete animation last roughly five seconds.

Horizontally, the position is updated through the mentioned `elapsed` argument and the arbitrary `time` value. However, and in order to move shapes independent of each other, it is necessary to attribute each shape a starting time. The value is passed to `generatePerson` so that the difference between `elapsed` and `startTime` provides the time for the specific circle or triangle.

```js
function generatePerson(elapsed) {
  eturn {
    // previous fields
    startTime: elapsed,
  };
}
```

Based on the difference, `xProgressAccessor` computes a value in the `[0, 1]` interval which is then passed to the horizontal scale.

Vertically, the code is slightly more complex, but can be understood as follows: the shapes need to consider first the coordinate of the ses value, then that of the education level. The idea is to:

- use the `y` coordinate of where the shape should start

  ```js
  const yStart = startYScale(sesAccessor(d));
  ```

- compute the difference in height, between the final and starting position

  ```js
  const yEnd = endYScale(educationAccessor(d));
  const yGap = yEnd - yStart;
  ```

- incorporate the gap gradually and in the central portion of the visualization.

  ```js
  const yProgress = yProgressScale(xProgress);
  const y = yStart + yGap * yProgress;
  ```

  This last step contemplates a scale, mapping the horizontal coordinate to `[0, 1]`, between a value of `0.45` and `0.55`

  ```js
  const yProgressScale = d3
    .scaleLinear()
    .domain([0.45, 0.55])
    .range([0, 1])
    .clamp(true);
  ```

  By clamping the value, the function returns `0` up until the horizontal coordinate reaches 45% of the bounded width. The value is then interpolated up to `1`, where it stays from 55% to the end of the visualization.

It is not immediately clear, but it is helpful to compare the scale to the horizontal scale. Just as `xScale` applies the `[0,1]` progress to the bounded width, `yProgressScale` applies the `[0,1]` progress to the vertical gap.

#### Data Binding

`people` is created as an array to consider every possible person. It is updated in the function called by `d3.timer` to include a new person at every iteration.

```js
people = [...people, generatePerson(elapsed)];
```

The collection is also modified to filter out the shapes which have completed the horizontal translation.

```js
people = [
  ...people.filter((d) => xProgressAccessor(elapsed, d) < 1),
  generatePerson(elapsed),
];
```

By filtering out the elements, data binding introduces an enter, update and exit selection. Enter for new shapes, update for existing ones (to-be-moved horizontally) and exit for those no longer represented.

```js
markersGroup.selectAll(".marker-circle").data(people);
```

The selection is actually split in two, so to represent the male and female category with different shapes.

```js
const updateFemales = markersGroup
  .selectAll(".marker-circle")
  .data(people.filter((d) => sexAccessor(d) === 0));
```

For new shapes, the enter selections introduce circles and triangles with a specific class of `.marker`

```js
updateFemales.enter().append("circle").attr("class", "marker marker-circle");

updateMale.enter().append("polygon").attr("class", "marker marker-triangle");
```

The class is helpful to target the shapes, regardless of gender, and udpate their position.

```js
d3.selectAll(".marker").attr("transform", (d) => {
  // compute x and y
  return `translate(${x} ${y})`;
});
```

For old shapes, the exit selections are merged so to remove both circles and triangles which have completed their path.

```js
updateFemales.exit().merge(updateMale.exit()).remove();
```

This is enough to have d3 manage a collection of elements of equal size of `people`. However, it is essential to stress how the data is bound in the update selection. Beside the data, included as an array of either male/female persons, the `.data` function receives a key accessor function, which defaults to the index in the array.

```js
const updateFemales = markersGroup.selectAll(".marker-circle").data(
  people.filter((d) => sexAccessor(d) === 0),
  (d, i) => i
);
```

By using the index, the library essentially recycles old elements instead of creating new ones. For the project, the end result is that the shapes flicker in color, as the circles and triangles are repositioned from the end of the visualization.

To assign elements to a single data point, the code is updated so that the key accessor function refers to a unique id.

```js
const updateFemales = markersGroup.selectAll(".marker-circle").data(
  people.filter((d) => sexAccessor(d) === 0),
  (d) => d.id
);
```

The `id` is included for each person as a unique value.

```js
let currentPersonId = 0;
function generatePerson(elapsed) {
  currentPersonId += 1;
  return {
    // previous fields
    id: currentPersonId,
  };
}
```

#### Metrics

While the movement of the people is already informative, it is helpful to highlight the number of people by highlighting their different status. This is achieved in two ways:

- with `<text>` labels, included below each education level and separated vertically by gender, horizontally and through color by ses

- with `<rect>` elements, stacked above each other in two bar charts. The goal is to have the ses for each gender highlighted with stacked rectangles

Metrics are actually a point where the implementation of this repository differs from that of the book. `highlightMetrics` is the function responsible for creating and updating the different elements. The function is called each time d3 removes the element of the exit selection, taking advantage of the `selection.call` method.

```js
updateFemales
  .exit()
  .merge(updateMale.exit())
  .call(() => {
    highlightMetrics(dataMetrics);
  });
```

For the data, `dataMetrics` is created to describe every possible combination in layers: education, gender, ses.

```js
const dataMetrics = educationIds.map(() =>
  sexIds.map(() => sesIds.map(() => 0))
);
```

The three dimensional array is then updated with the exit selection, but this time through the `selection.each` method. The function is called for every element, and increments the data by index.

```js
updateFemales
  .exit()
  .merge(updateMale.exit())
  .each(({ sex, ses, education }) => {
    dataMetrics[education][sex][ses] += 1;
  });
```

The end result is finally passed `highlightMetrics`, which proceeds to massage the data in a one-dimensional array.

The goal is to here have an array with one object for every possible combination, describing gender, ses, education, but also additional helper values.

```js
/*
{
  sex,
  education,
  ses,
  count,
  total,
  height,
  y,
}
*/
```

I'll refer you to the code for how the values are computed — especially the `height` value and `y` coordinate, using a scale with a variable domain — but in order of usefulness:

- `count` is helpful to describe how many people are registered in the specific object

- `total` considers every person with the same ses, and is useful to change the color of the stacked columns. It is only with people in the same gender/education pair that the rectangles are colored and sectioned according to economic status

- `height`, `y` allow to position the rectangle elements

#### Final remarks

The visualization includes other features I elected not to document in detail:

- shapes are modified in their `y` coordinate to avoid excessive overlap. This is achieved by assigning an arbitrary offset once a person is generated

```js
function generatePerson(elapsed) {
  return {
    // previous fields
    yJitter: getRandomNumberInRange(-15, 15),
  };
}
```

- a color scale maps the ses value to a color between two values

  ```js
  const colorScale = d3
    .scaleLinear()
    .domain(d3.extent(sesIds))
    .range(["hsl(178, 84%, 43%)", "hsl(332, 55%, 46%)"]);
  ```

  An interpolator function is useful to have the color in the hcl color space, which means the choices have the same perceived lightness

  ```js
  const colorScale = d3.scaleLinear().interpolate(d3.interpolateHcl);
  ```

- a legend is included above the rectangles describing the stacked bars. This one highlights the split between male (triangles) and female (circles) category

- the rectangles and text elements responsible for the metrics are included with the `.join` method.

  ```js
  metricsGroup.selectAll("rect").data(data).join("rect");

  metricsGroup.selectAll("text").data(data).join("text");
  ```

  The function works as a conveinence method for the update-enter-exit pattern. `join` allows to append the necessary element, as through the enter selection, and update their position, as through the update selection.

- the rectangles making up the stacked bars are instructed to animate in every property.

  The effect depends on browser support, but helps to transition the size, position and even color of the shapes

  ```js
  .join('rect')
  .style('transition', 'all 0.25s ease-out')
  ```

-->

## 11 - Using D3 with React

_Please note_: the book discusses how to use D3 with several frameworks, but I decided to only consider React and focus on the overarching idea behind the framework. For React the sub-folder includes a [vite application](https://vite.dev/) you can set up with node.

```sh
pnpm i
pnpm dev
```

_Please also note_: the book creates a fairly robust charting library with several components. The dashboard I try to create on my own is far less professional, but should suffice.

---

It is possible to use D3 as a library to handle the entire lifecycle of a data visualization, to use the imperative syntax, the `select` and `append` functions to generate and manipulate the elements making up the document object model (DOM). Modern web development, however, often relies on tools like React. The idea here is to use frameworks to manage the DOM while relying on D3 as a utility library, for the logic and functions easing the challenges to work with data visualizations.

With a framework it is possible to break down a visualization into components and create something akin to a charting library. It is then possible to create multiple visualizations changing the input properties. It also means that it is not necessary to know the code necessary to draw ticks or lines, which simplifies the task for the end user.
