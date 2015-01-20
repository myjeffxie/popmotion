/*
    Process actions
*/
"use strict";

var Rubix = require('./rubix.js'),
	calc = require('../utils/calc.js'),
    utils = require('../utils/utils.js'),
    Process = function () {},
    process;
    
Process.prototype = {
    
    /*
        Process an action
        
        @param [Action]: Action to process
        @param [number]: Timestamp of executing frame
        @param [number]: Duration, in ms, since last frame
    */
    action: function (action, framestamp, frameDuration) {
        var output = {},
            props = action.props,
            rubix = props.rubix,
            data = action.data(),
            values = action.values.getAll(),
            hasChanged = false;

        // Fire onStart if firstFrame
        if (action.firstFrame) {
            if (props.onStart) {
                props.onStart.call(props.scope, data);
            }

            action.firstFrame = false;
        }
        
        // Update associated Input
        if (props.input) {
	        output.input = props.input.onFrame(framestamp);
        }
        
        // Update progress
        action.progress = rubix.calcProgress(action, props, values, framestamp, frameDuration);

        // Calculate new values
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                // Ease value
                output[key] = rubix.easeValue(key, values[key], action);
                
                // Round
                if (values[key].round) {
                    output[key] = Math.round(output[key]);
                }

                // Add velocity
                values[key].velocity = calc.xps(calc.difference(values[key].current, output[key]), frameDuration);
                
                // Check if has changed
                if (values[key].current != output[key]) {
                    hasChanged = true;
                    values[key].current = output[key];
                }
            }
        } // end value calculations
        
        // Calculate new x and y if angle and distance present
        output = this.angleAndDistance(action.origin, output);
        
        // Fire onFrame callback
        if (props.onFrame) {
            props.onFrame.call(props.scope, output, data);
        }

        // Fire onChange callback
        if (hasChanged && props.onChange) {
            props.onChange.call(props.scope, output, data);
        }
        
        // Fire onEnd and deactivate if at end
        if (rubix.hasEnded(action)) {
            if (props.onEnd) {
                props.onEnd.call(props.scope, output, data);
            }

            action.next();
        }
        
        // Update Action framestamp
        action.framestamp = framestamp;
    },
    
    /*
        Update associated input
        
        @param [Input]: Bound input
        @param [number]: Framestamp of latest frame
    */
    updateInput: function (input, framestamp) {
        if (input) {
            input.updateInput(framestamp);
        }
    },
    
    /*
	    Process angle and distance
	    
	    @param [object]: Action origin point
	    @param [object]: Current output
	    @return [object]: Output with updated x and y
    */
    angleAndDistance: function (origin, output) {
	    var point = {};

	    if (output.angle && output.distance) {
		    point = calc.pointFromAngleAndDistance(origin, output.angle, output.distance);
		    output.x = point.x;
		    output.y = point.y;
	    }

	    return output;
    }
};

module.exports = new Process();