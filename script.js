const gpu = new GPU({
    mode: 'webgl2',
    canvas: document.getElementById('ctx')
});


const gpuDrawRandom = gpu.createKernel(function(max_iter, colors, k, x_offset, y_offset){
    var x = 0;
    var y = 0;
    var xx = 0;
    var yy = 0;
    var xy = 0;

    var c1 = -1 + (2*k)/512.0*(float(this.thread.x) - x_offset);
    var c2 = -1 + (2*k)/512.0*(float(this.thread.y) + y_offset);

    var i = 0;
    while(i<max_iter){
        xy = x*y;
        xx = x*x;
        yy = y*y;
        x = xx - yy + c1;
        y = 2*xy + c2;
        if((xx + yy) >= 4.0){
            break;
        }
        i++;
    }

    this.color(colors[i][0], colors[i][1], colors[i][2]);
}).setGraphical(true).setOutput([512, 512]);

let max_iter = 32;

var colors = [];

for(var i = 0; i<max_iter; i++){
    color = d3.color(d3.interpolateSinebow(i/max_iter));
    // color = d3.color(d3.interpolateWarm(i/max_iter));
    colors.push([color.r/255.0, color.g/255.0, color.b/255.0]);
}


let zoom = d3.zoom()
.on('zoom', zoomed)

previous_k = 1;

function zoomed(){
    console.log(d3.event.transform.k, previous_k)
    if((d3.event.transform.k - previous_k)**2 > 0){
        gpuDrawRandom(max_iter, colors, d3.event.transform.k, d3.event.transform.x, d3.event.transform.y);
    }
    else{
        gpuDrawRandom(max_iter, colors, d3.event.transform.k, d3.event.transform.x, d3.event.transform.y);
    }
}

function draw(){
    gpuDrawRandom(max_iter, colors, 1, 0, 0);
    // requestAnimationFrame(draw);
}

d3.select("#ctx").call(zoom)

requestAnimationFrame(draw);
