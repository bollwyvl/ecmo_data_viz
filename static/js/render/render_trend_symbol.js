var data = {
		sp_max:100,
		sp_min:0,
		// current is the last datapaint
		datapoints:_.range(10, 90, 10).concat(_.range(90,10, -10))
	}

var x_scale = null;
var y_scale = null;

// if the absolute value of the slope of the least squares regression is 
// greater than this number, we will consider the trend to be increasing
// or decreasing. Less than this number will be cosidered a flat trend
var slope_tolerance = .5;

function render_trend_symbol(div_id){
	var h = $(document).height()
	var w = $(document).width()
	
	init_dataset()
	
	// square will always be half the available height. if there is a 
	// triangle, it will take up the remaining half
	var half_height = h/2
	// centers the square
	var square_left = (w - half_height) / 2	
	
	var vals_x = _.pluck(data.dataset, 'x');
	var vals_y = _.pluck(data.dataset, 'y');
	var reg_slope = ls_regression_slope(vals_x, vals_y);
	
	var triangle_location = trend_direction(reg_slope)
	var triangle_exists = triangle_location != 0
	
	init_scales(square_left, triangle_location, half_height)
	
	var vis = new pv.Panel()
		.canvas(div_id)
		.strokeStyle('blue')
		.height(function() {
			return h
		})
		.width(function() {
			return w
		})
	
	var triangle = vis.add(pv.Dot)
		.top(function(){
			var ret = 0
			if(triangle_exists){
				ret = triangle_location == 1 ? half_height/2 : h - half_height/2;
			}
			return ret
		})
		.left(function(){
			return w/2
		})
		.fillStyle(function(){
			var last_value = vals_y[vals_y.length-1]
			return (last_value < data.sp_max && last_value > data.sp_min) ? 'blue' : 'red'
		})
		.size(function(){
			return half_height * 115
		})
		.shape("triangle")
		.angle(function(){
			var ret = 0;
			if(triangle_exists){
				ret = triangle_location == 1 ? Math.PI: 0;
			}
			return ret;
		})
		.visible(function(){
			return triangle_exists
		})
	
	var square = vis.add(pv.Panel)
		.left(function(){
			return square_left
		})
		.top(function(){
			return get_square_top(triangle_location, half_height)
		})
		.width(function(){
			return half_height
		})
		.height(function(){
			return half_height
		})
		.fillStyle(function(){
			var last_value = vals_y[vals_y.length-1]
			return triangle_exists ? 
				((last_value < data.sp_max && last_value > data.sp_min) ? 'blue' : 'red') : 
				'black'
		})
	
	var graph_line = vis.add(pv.Line)
		.data(function(){
			return data.dataset
		})
		.interpolate('step-after')
		.left(function(d){
			return x_scale(d.x)
		})
		.top(function(d){
			return y_scale(d.y)
		})
		.lineWidth(3)
		.strokeStyle('white')
		
	vis.render()
}

function init_dataset(){
	var i = 0;
	data['dataset'] = _.map(data.datapoints, function(d){
		return {x:i++, y:d}
	})
	
}

function init_scales(sq_left, tri_loc, half_height){
	x_scale = pv.Scale.linear(data.dataset, function(d){return d.x}).range(sq_left, sq_left+half_height)
	
	var sq_top = get_square_top(tri_loc, half_height)
			
	y_scale = pv.Scale.linear(data.dataset, function(d){return d.y}).range(sq_top, sq_top+half_height)
}

function get_square_top(tri_loc, half_height){
	var ret = half_height - (half_height/2)
	if(tri_loc != 0){
		ret = tri_loc == 1 ? half_height : 0;
	}
	return ret
}

// if the data set is generally trending up, return 1. if generally unchanging
// return 0, else (generally trending down), return -1
function trend_direction(regression_slope){
	var ret = Math.abs(regression_slope) > slope_tolerance ? (regression_slope > 0 ? 1 : -1) : 0;
	return ret
}

// modified (to only return the slope) from here:
// http://dracoblue.net/dev/linear-least-squares-in-javascript/159/
function ls_regression_slope(values_x, values_y) {
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_xx = 0;
	var count = 0;
	
	/*
	 * We'll use those variables for faster read/write access.
	 */
	var x = 0;
	var y = 0;
	var values_length = values_x.length;
	
	if (values_length != values_y.length) {
		throw new Error('The parameters values_x and values_y need to have same size!');
	}
	
	/*
	 * Nothing to do.
	 * LDP mod - Return 0. Consider an error state in the future.
	 */
	if (values_length === 0) {
		// use this if you're interested in returning the line itself
		// return [[], []]
		return 0;
	}
	
	/*
	* Calculate the sum for each of the parts necessary.
	*/
	for (var v = 0; v < values_length; v++) {
		x = values_x[v];
		y = values_y[v];
		sum_x += x;
		sum_y += y;
		sum_xx += x*x;
		sum_xy += x*y;
		count++;
	}
	
	/*
	 * Calculate m and b for the formular:
	 * y = x * m + b
	 */
	var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
	return m;
	
	// use the following if you're interested in returning the line itself
	//var b = (sum_y/count) - (m*sum_x)/count;
		
	/*
	 * We will make the x and y result line now
	 */
	//var result_values_x = [];
	//var result_values_y = [];
	
	//for (var v = 0; v < values_length; v++) {
	//	x = values_x[v];
	//	y = x * m + b;
	//	result_values_x.push(x);
	//	result_values_y.push(y);
	//}
	
	//return [result_values_x, result_values_y];
}