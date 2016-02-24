/**
 * Create a serialized event object with
 * - type: String
 * - args: Object
 */ 
exports.createEvent = function createEvent (eventType, eventArgs) {
    if (arguments.length < 2) {
        throw new Error('Invalid arguments');
    }
    
    if (arguments.length === 2) {
        eventArgs = [eventArgs];
    }
    else {
        eventArgs = Array.prototype.slice.call(arguments, 1);
    }
    
    var event = {
        type: eventType,
        args: eventArgs
    };
    
    var serialized = serialize(event);

    return serialized;
};

/**
 * @param serialized Buffer
 */
exports.deserialize = function deserialize (serialized) {
    var string = serialized.toString();
    var json = JSON.parse(string);
    
    return json;
};

function serialize (obj) {
    var string = JSON.stringify(obj);

    return new Buffer(string);
}