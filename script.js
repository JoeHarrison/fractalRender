
var capturer = new CCapture( { format: 'webm' } );

const gpu = new GPU({
    mode: 'webgl2',
    canvas: document.getElementById('ctx')
});

const render = gpu.createKernel(function(max_iter, colors, zoom, x_offset, y_offset, x_pan, y_pan, image, y_image, x_image, julia_mode, julia_c1, julia_c2){
    var x = 0.0;
    var y = 0.0;
    var xx = 0.0;
    var yy = 0.0;
    var xy = 0.0;

    var c1 = (1/zoom)*(float(this.thread.x) + x_offset + x_pan);
    var c2 = (1/zoom)*(float(this.thread.y) + y_offset - y_pan);

    if(julia_mode>0){
        x = c1;
        y = c2;
        c1 = julia_c1;
        c2 = julia_c2;
    }

    var i = 0;
    this.color(colors[max_iter][0],colors[max_iter][1],colors[max_iter][2]);
    var flag = 0;
    while(i<max_iter){
        xx = x*x;
        yy = y*y;
        if((xx + yy) > 4.0){
            if(flag<1){
                this.color(colors[i][0], colors[i][1], colors[i][2],1);
            }
            break;
        }
        xy = x*y;

        x = xx - yy + c1;
        y = xy+xy + c2;
        if(x> 0. && x <= 1 && y>0.0 && y<=1){
            var ypos = Math.floor(y*y_image);
            var xpos = Math.floor(x*x_image);
            // Check for opacity
            if(image[ypos][xpos][3]>0){
                this.color(image[ypos][xpos][0],image[ypos][xpos][1],image[ypos][xpos][2],0)

                flag = 1;
            }
        }
        i++;
    }
}).setGraphical(true).setOutput([1920, 1080]);

let max_iter = 50;


var colors = [];

for(var i = 0; i<max_iter; i++){
    color = d3.color(d3.interpolateMagma(i/max_iter));
    // color = d3.color(d3.interpolateWarm(i/max_iter));
    colors.push([color.r/255.0, color.g/255.0, color.b/255.0]);
}

var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");

canvas.addEventListener("mousedown", onMouseDown);

// Width and height of the image
var imagew = 1920.0;
var imageh = 1080.0;

// Pan and zoom parameters
var offsetx = -imagew/2.0;
var offsety = -imageh/2.0;
var panx = -100.0;
var pany = 0.0;
var zoom = 150.0;

function zoomFractal(x, y, factor, zoomin) {
    if (zoomin) {
        // Zoom in
        zoom *= factor;
        panx = factor * (x + offsetx + panx);
        pany = factor * (y + offsety + pany);
    } else {
        // Zoom out
        zoom /= factor;
        panx = (x + offsetx + panx) / factor;
        pany = (y + offsety + pany) / factor;
    }
}

function onMouseDown(e) {
    if(e.button==0){
        var pos = getMousePos(canvas, e);

        // Zoom out with Control
        var zoomin = true;
        if (e.ctrlKey) {
            zoomin = false;
        }

        // Pan with Shift
        var zoomfactor = 2.0;
        if (e.shiftKey) {
            zoomfactor = 1.0;
        }

        // Zoom the fractal at the mouse position
        zoomFractal(pos.x, pos.y, zoomfactor, zoomin);

        // Generate a new image
        console.log('zoom events')
        requestAnimationFrame(draw);
    }
}

// function demo(w, h){
//     var tmpcanvas = document.createElement('canvas');
//
//     // Get rid of this
//     tmpcanvas.width = w;
//     tmpcanvas.height = h;
//
//     var tmpcontext = tmpcanvas.getContext('2d');
//     tmpcontext.drawImage(image, 0, 0);
//
//     var input = tmpcontext.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);
//
//     var inputData = input.data;
//
//     im = [];
//
//     for (var y = 0; y < input.height; y++) {
//         im.push([]);
//         for (var x = 0; x < input.width; x++) {
//             var i = (y*input.width + x)*4;
//             im[y].push([inputData[i]/255.0, inputData[i+1]/255.0, inputData[i+2]/255.0, inputData[i+3]/255.0]);
//        }
//    }
//
//    requestAnimationFrame(draw);
// }

// var im;
// var image = new Image();
// image.onload = function(){
//         demo( this.width, this.height);
//     };
// // image.onload = demo(this.height, this.width);
// image.src = "benoit2.png";

function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
        y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
    };
}

var col = [0,0,0];
var itercol = max_iter - 1;

function draw(){
    console.log(sequence.length, iter, iter % sequence.length)
    im = sequence[iter % sequence.length];

    if(iter==total_steps){
        iter = 0;
        c1 = c1target;
        c2 = c2target;
        c1target = Math.random()*4 - 2;
        c2target = Math.random()*4 - 2;
        dist = Math.sqrt((c1-c1target)**2 + (c2-c2target)**2);
        total_steps = Math.floor(48*dist)
    }
    var currentc1 = c1target*(iter/total_steps) + c1*(total_steps-iter)/total_steps;
    var currentc2 = c2target*(iter/total_steps) + c2*(total_steps-iter)/total_steps;

    var tempcol1 = colors[itercol];

    if(iter%2==0){
        var color = colors.shift();
        colors.push(color);
    }
    colors[itercol] = col;

    var y_image = im.length;
    var x_image = im[0].length;
    render(max_iter, colors, zoom, offsetx, offsety, panx, pany, im, y_image, x_image, 0, currentc1, currentc2);

    colors[itercol] = tempcol1;
    // if(iter%2==0){
    //     itercol = itercol + 1;
    // }
    if(iter%2==0){
        itercol = itercol - 1;
    }

    // if(itercol == max_iter - 1){
    //     itercol = 0;
    // }

    if(itercol == 1){
        itercol = 49;
    }

    iter = iter + 1;
    requestAnimationFrame(draw);
    if(capturer){
         capturer.capture(canvas);
    }
}

var c1 = Math.random()*4 -2;
var c2 = Math.random()*4 -2;
var c1target = Math.random()*4 -2;
var c2target = Math.random()*4 -2;

var iter = 0;
var total_steps = 24;

var sequence = [];
document.getElementById('video_selector').addEventListener('change', extractFrames, false);
document.getElementById('photo_selector').addEventListener('change', extractPhoto, false);

function extractPhoto(){
    var image = new Image();

    function demo(w, h){
        console.log(w)
        var tmpcanvas = document.createElement('canvas');

        // Get rid of this
        tmpcanvas.width = w;
        tmpcanvas.height = h;

        var tmpcontext = tmpcanvas.getContext('2d');
        tmpcontext.drawImage(image, 0, 0);

        var input = tmpcontext.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);

        var inputData = input.data;

        im = [];

        for (var y = 0; y < input.height; y++) {
            im.push([]);
            for (var x = 0; x < input.width; x++) {
                var i = (y*input.width + x)*4;
                im[y].push([inputData[i]/255.0, inputData[i+1]/255.0, inputData[i+2]/255.0, inputData[i+3]/255.0]);
           }
       }

       requestAnimationFrame(draw);
    }
    image.addEventListener('loadedmetadata', demo(this.width, this.height), false);

    image.src = URL.createObjectURL(this.files[0]);
}

function extractFrames() {
  var video = document.createElement('video');
  var array = [];

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var pro = document.querySelector('#progress');

  function initCanvas(e) {
    canvas.width = this.videoWidth;
    canvas.height = this.videoHeight;
  }

  function drawFrame(e) {
    this.pause();
    ctx.drawImage(this, 0, 0);
    /*
    this will save as a Blob, less memory consumptive than toDataURL
    a polyfill can be found at
    https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Polyfill
    */
    canvas.toBlob(saveFrame, 'image/jpeg');

    pro.innerHTML = ((this.currentTime / this.duration) * 100).toFixed(2) + ' %';
    if (this.currentTime < this.duration) {
      this.play();
    }
  }

  function saveFrame(blob) {
    array.push(blob);
  }

  function revokeURL(e) {
    var tmpcanvas = document.createElement('canvas');
    tmpcanvas.width = this.width;
    tmpcanvas.height = this.height;

    var tmpcontext = tmpcanvas.getContext('2d');
    tmpcontext.drawImage(this, 0, 0);

    var input = tmpcontext.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);
    var inputData = input.data;

    var im = [];

    for (var y = 0; y < input.height; y++) {
        im.push([]);
        for (var x = 0; x < input.width; x++) {
            var i = (y*input.width + x)*4;
            im[y].push([inputData[i]/255.0, inputData[i+1]/255.0, inputData[i+2]/255.0, inputData[i+3]/255.0]);
       }
   }

    sequence.push(im);
    URL.revokeObjectURL(this.src);
    console.log('req')
    requestAnimationFrame(draw);
  }

  function onend(e) {
      console.log('poep')
     console.log(array.length)
    var img;

    for (var i = 0; i < array.length; i++) {
      img = new Image();
      img.onload = revokeURL;
      img.src = URL.createObjectURL(array[i]);
    }

    URL.revokeObjectURL(this.src);
  }

  video.muted = true;
  video.addEventListener('loadedmetadata', initCanvas, false);
  video.addEventListener('timeupdate', drawFrame, false);
  video.addEventListener('ended', onend, false);

  video.src = URL.createObjectURL(this.files[0]);
  video.play();
}
