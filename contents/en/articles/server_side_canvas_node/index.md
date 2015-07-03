---
title: Server side images and animations generation with node
date: 2015-07-03 18:29
template: article.jade
---

On my spare time, I work on several projects. One of them is a twitter game on which I work with other people.
This is a thinking game consisting in solving a problem with an instruction sequence.
The bug must reach the goal with fewest instructions and displacements possible.

Currently, this is a twitter game.
Every day, a new challenge is sent in a tweet.
People can reply to the tweet with their instructions; then the bot reply to them with their score.
One of the interest of the game is to have a feedback when someone tries to resolve the challenge.

This article explains a simple way to generate an image (png) or an animation (gif or webm) on the server side, with a Node.js server.

<p>
  <div class="row">
    <img class="img-responsive col-xs-4 col-xs-offset-2 col-md-2 col-md-offset-4" src="/en/articles/server_side_canvas_node/images/reply_3.png" alt="Server feedback"/>
    <img class="img-responsive col-xs-4 col-md-2" src="/en/articles/server_side_canvas_node/images/reply_3.gif" alt="Server feedback"/>
  </div>
  <div style="text-align:center;">
    Example of the generation of a png image or a gif animation with a request.
  </div>
</p>

## Node.js web server

We want to build a simple web service in order to send generated medias. T
he server receive a request with the url, and generate the media.

As example, on my project, we want to generate a 2D view of a map. 
We can specify inside the URL the resolution of the map, the squares, a theme, the instructions and other things.

The format of the url is here /api followed of the parameters:

- /res/[x]:[y]
- /theme/[value]
- /cmd/[instructions]
- /map/[squares]
- /type/[png|gif|webm]

<p>
  <img class="img-responsive" style="margin:auto;" src="/en/articles/server_side_canvas_node/images/map_1.png" alt="Map"/>
  <div style="text-align:center;">
    URL example: /res/15x4 /map/o4so4soosoolosooooso5so5so5so3so9s3 /cmd/fo;ri;fo;le;fo /theme/19
  </div>
  <img class="img-responsive" style="margin:auto;" src="/en/articles/server_side_canvas_node/images/map_2.png" alt="Map"/>
  <div style="text-align:center;">
    URL example: /res/15x4 /map/o14slosooooso5so22sg /cmd/fo;ri;fo;ri;fo;le;fo;le;fo /theme/50 /bug/ladybug-chassis
  </div>
  <img class="img-responsive" style="margin:auto;" src="/en/articles/server_side_canvas_node/images/map_3.png" alt="Map"/>
  <div style="text-align:center;">
    URL example: /map/l /cmd/fo /bug/bee /res/15:4 /theme/49
  </div>
  <img class="img-responsive" style="margin:auto;" src="/en/articles/server_side_canvas_node/images/map_4.png" alt="Map"/>
  <div style="text-align:center;">
    URL example: /map/o15l /cmd/fo;ri;fo /res/15:4 /theme/20
  </div>
</p>

Here, I use the express package as the web server to define the route and extract parameters.

```js
var express = require('express'),
              ... ;

var app = express();

// /api/[parameters] route
app.get(/^\/api\/(.*)/, function(req, res) {
  
  // Default configuration
  var config = {
    res: new Point(6, 6),
    theme: 13,
    squares: '',
    command: '',
    type: 'png'
  };
  
  // Parse URL parameters and set right configurtion
  var params = req.params[0].toUpperCase().split('/');
  params = (params === null)? [] : params;
  ...
  
  handleRequest(config, res);
  
});
```


## Node canvas

[Node canvas](https://github.com/Automattic/node-canvas) is a Canvas implementation for Node.js: https://github.com/Automattic/node-canvas.

It has dependencies on native libraries. 
A wiki explains how to install everything on each OS: https://github.com/Automattic/node-canvas/wiki.

This package adds some useful features as loading image from the disk or handle streams.

### Usage

We use this implementation almost the same way we could use a HTML5 canvas on a browser.
This is so the best choice to generate an image in javascript if you already know how to draw on a canvas.

```js
var Canvas = require('canvas');

var canvas = new Canvas(200, 150);
var context = canvas.getContext("2d");
context.beginPath();
context.arc(100, 75, 50, 0, 2 * Math.PI);
context.stroke();
```

### .toBuffer() and .toDataURL()

One of the main features is the possibility to get the canvas image as a raw buffer or as an image format.
The .toDataUrl() method is only able to return the image representation as a PNG file.

These methods can be used to manipulate pixels in order to render images or animations.

## Send as a PNG file

It is really easy to send the result as a PNG file because it is native in the node-canvas package.

```js
function sendAsPNG(response, canvas) {

  var stream = canvas.createPNGStream();
  response.type("png");
  stream.pipe(response);
  
};
```

<p>
  <img class="img-responsive" style="margin:auto;" src="/en/articles/server_side_canvas_node/images/reply_3.png" alt="PNG image" />
  <div style="text-align:center;">
    PNG image.
  </div>
</p>

### Performances

On a standard server, it takes around 10ms to generate a standard PNG image on my application.

## Send as a GIF file

Here, we need to use a package. But it remains relatively easy to generate a GIF.

We only need to use the [gifencoder](https://github.com/eugeneware/gifencoder) package: https://github.com/eugeneware/gifencoder.

```js
var GIFEncoder = require('gifencoder');

function createGifEncoder(resolution, response) {

  var encoder = new GIFEncoder(resolution.x * 32, resolution.y * 32);
  
  var stream = encoder.createReadStream();
  response.type("gif");
  stream.pipe(response);
  
  encoder.start();
  encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
  encoder.setDelay(150);  // frame delay in ms
  encoder.setQuality(15); // image quality. 10 is default.
  
  return encoder;

}

function sendAsGIF(response, canvas) {

  var encoder = createGifEncoder({x: canvas.width, y: canvas.height}, response);
  
  var context = canvas.getContext("2d");
  
  // Add 3 frames
  encoder.addFrame(context);
  encoder.addFrame(context);
  encoder.addFrame(context);

  encoder.finish();
  
};
```

<p>
  <img class="img-responsive" style="margin:auto;" src="/en/articles/server_side_canvas_node/images/reply_3.gif" alt="GIF animation" />
  <div style="text-align:center;">
    GIF animation.
  </div>
</p>

### Performances

On a standard server, it takes around 500ms to generate a standard GIF of 10 frames and 500ko on my application.

## Send as a WebM file

A GIF is great, but it is really heavy. 
[WebM](http://www.webmproject.org/) is a format supported by Google.
It is an open video format which encapsulate WebP compressed images.

### Handle WebP picture

On some browsers (as Chrome), you can ask toDataUrl() in a WebP format. 
It is then really easy to embed these pictures inside a WebM video.
But in the node-canvas implementation, we can't use it. 
We need an other way.

[Sharp](https://github.com/lovell/sharp) is a node package allowing to handle JPEG, PNG, and TIFF pictures, but also WebP: https://github.com/lovell/sharp.

It has a dependency on libvips.
[Here](http://www.vips.ecs.soton.ac.uk/index.php?title=Supported) is a wiki on how to install vips: http://www.vips.ecs.soton.ac.uk/index.php?title=Supported.

```js
var sharp = require('sharp');

function canvasToWebp(canvas, callback) {

  sharp(canvas.toBuffer()).toFormat(sharp.format.webp).toBuffer(function(e, webpbuffer) {
    var webpDataURL = 'data:image/webp;base64,' + webpbuffer.toString('base64');
    callback(webpDataURL);
  });
  
}
```

### Handle WebM video

[Whammy](https://github.com/jbouny/whammy) is a real time javascript webm encoder: https://github.com/jbouny/whammy.

To have the latest versio working on node.js, you need to add the git repo inside your package.json (if npm used).

```
"dependencies": {
    "node-whammy": "git://github.com/jbouny/whammy.git",
},
```

The problem with sharp is that the callback is asynchronous. 
We need to control that frames are added is the right order.

```js
var Whammy = require('node-whammy');

function sendAsWEBP(response, canvas) {
  
  var encoder = new Whammy.Video(7);
  
  var currentId = 0,
      time = 0,
      timeout = 20000,
      delay = 20
      addedFrame = -1,
      totalFrames = 3,
      tmpFrames = Array.apply(null, Array(totalFrames));
  
  var addFrame = function addFrame(context) {
    var id = currentId++;
    canvasToWebp(context.canvas, function(webmData) {
      tmpFrames[id] = webmData;
      for(var i = addedFrame + 1; i < totalFrames; ++i) {
        if(tmpFrames[i] !== undefined) {
          encoder.add(tmpFrames[i]);
          addedFrame = i;
        }
        else {
          break;
        }
      }
    });
  };
  
  var checkReady = function checkReady() {
    if(totalFrames <= addedFrame + 1) {
      try {
        var output = encoder.compile(true);
        response.type('webm');
        response.send(new Buffer(output));
        console.log('Webm compilation: ' + time + 'ms');
      }
      catch(err) {
        response.send(err.toString());
      }
    }
    else if((time += delay) < timeout) {
      setTimeout(checkReady, delay);
    }
    else {
      response.send('Timeout of ' + timeout + 'ms exceed');
    }
  };
  
  var context = canvas.getContext("2d");
  
  // Add 3 frames
  addFrame(context);
  addFrame(context);
  addFrame(context);
  
  setTimeout(checkReady, delay);
  
};
```


<p>
  <video class="img-responsive" style="margin:auto;" controls>
    <source src="/en/articles/server_side_canvas_node/images/reply_3.webm" type="video/webm">
  </video>
  <div style="text-align:center;">
    WebM animation.
  </div>
</p>

### Performances

On a standard server, it takes around 500ms to generate a standard WebM of 10 frames and 150ko on my application.