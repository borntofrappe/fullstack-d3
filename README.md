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
