const gpu = new GPU({
    mode: 'webgl2',
    canvas: document.getElementById('ctx')
});



const renderMandelbrot = gpu.createKernel(function(max_iter, colors, zoom, x_offset, y_offset, x_pan, y_pan, image){
    var x = 0;
    var y = 0;
    var xx = 0;
    var yy = 0;
    var xy = 0;

    var c1 = (1/zoom)*(float(this.thread.x) + x_offset + x_pan);
    var c2 = (1/zoom)*(float(this.thread.y) + y_offset - y_pan);

    var i = 0;
    this.color(0, 0, 0, 0);
    while(i<max_iter){
        xy = x*y;
        xx = x*x;
        yy = y*y;
        if((xx + yy) >= 4.0){
            this.color(colors[i][0], colors[i][1], colors[i][2], 0);
            break;
        }
        x = xx - yy + c1;
        y = 2*xy + c2;
        i++;
    }
}).setGraphical(true).setOutput([512, 512]);

const renderPointOrbitTrap = gpu.createKernel(function(max_iter, colors, zoom, x_offset, y_offset, x_pan, y_pan, image, s){
    var x = 0;
    var y = 0;
    var xx = 0;
    var yy = 0;
    var xy = 0;

    var c1 = (1/zoom)*(float(this.thread.x) + x_offset + x_pan);
    var c2 = (1/zoom)*(float(this.thread.y) + y_offset - y_pan);

    var i = 0;
    this.color(0, 0, 0, 0);

    while(i<max_iter){
        xy = x*y;
        xx = x*x;
        yy = y*y;
        if((xx + yy) >= 4.0){
            this.color(colors[i][0], colors[i][1], colors[i][2],1);
            break;
        }
        x = xx - yy + c1;
        y = 2*xy + c2;
        if(x> 0. && x <= 1 && y>0.0 && y<=1){
            var ypos = Math.floor((y-0.)*s);
            var xpos = Math.floor((x-0.)*s);
            this.color(image[ypos][xpos][0],image[ypos][xpos][1],image[ypos][xpos][2],0)

            break;
        }
        i++;
    }
}).setGraphical(true).setOutput([512, 512]);

const renderPointOrbitTrapJulia = gpu.createKernel(function(max_iter, colors, zoom, x_offset, y_offset, x_pan, y_pan, image, s){
    var x = (1/zoom)*(float(this.thread.x) + x_offset + x_pan);
    var y = (1/zoom)*(float(this.thread.y) + y_offset - y_pan);
    var xx = 0;
    var yy = 0;
    var xy = 0;

    var c1 = -0.8;
    var c2 = 0.156;

    var i = 0;
    this.color(0, 0, 0);

    while(i<max_iter){
        xy = x*y;
        xx = x*x;
        yy = y*y;
        if((xx + yy) >= 4.0){
            this.color(colors[i][0], colors[i][1], colors[i][2],0);
            break;
        }
        x = xx - yy + c1;
        y = 2*xy + c2;
        if(x> 0. && x <= 1 && y>0. && y<=1){
            var ypos = Math.floor((y-0.)*s);
            var xpos = Math.floor((x-0.)*s);
            this.color(image[ypos][xpos][0],image[ypos][xpos][1],image[ypos][xpos][2],0)
            break;
        }
        i++;
    }
}).setGraphical(true).setOutput([512, 512]);

let max_iter = 500;

var colors = [];

for(var i = 0; i<max_iter; i++){
    color = d3.color(d3.interpolateSinebow(i/max_iter));
    // color = d3.color(d3.interpolateWarm(i/max_iter));
    colors.push([color.r/255.0, color.g/255.0, color.b/255.0]);
}

var canvas = document.getElementById("ctx");
var ctx = canvas.getContext("2d");

canvas.addEventListener("mousedown", onMouseDown);

// Width and height of the image
var imagew = 512.0;
var imageh = 512.0;

// Pan and zoom parameters
var offsetx = -imagew/2;
var offsety = -imageh/2;
var panx = -100;
var pany = 0;
var zoom = 150;

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
        var zoomfactor = 2;
        if (e.shiftKey) {
            zoomfactor = 1;
        }

        // Zoom the fractal at the mouse position
        zoomFractal(pos.x, pos.y, zoomfactor, zoomin);

        // Generate a new image
        requestAnimationFrame(draw);
    }
}

function demo(){
    var tmpcanvas = document.createElement('canvas');

    tmpcanvas.width = 540;
    tmpcanvas.height = 540;

    var tmpcontext = tmpcanvas.getContext('2d');
    tmpcontext.drawImage(image, 0, 0);

    var input = tmpcontext.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);
    console.log(input)

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

function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
        y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
    };
}

function draw(){
    console.log(im);
    //renderPointOrbitTrap(max_iter, colors, zoom, offsetx, offsety, panx, pany, image);
    renderPointOrbitTrapJulia(max_iter, colors, zoom, offsetx, offsety, panx, pany, im, 540);
}

var im;
var image = new Image();
image.onload = demo;
image.src = "color.jpg";
