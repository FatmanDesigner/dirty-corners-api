// TODO Setup heartbeat "?heartbeat=10"
var amqplib = require('amqplib');
var util = require('../../service/util');

module.exports = function (config) {
    var url = config.url;
    
    return function middleware (req, res, next) {
        var app = req.app;
        
        if (app.amqpConnection && !app.amqpConnection.closed) {
            next();
            return;
        }

        // Clean up before creating new messes
        if (app.amqpConnection) {
            try {
                app.amqpConnection.disconnect();
            } finally {
                console.log('Cleaned up AMQP connection')
            }
        }
        app.amqpConnection = new AmqpConnection(url);
        app.amqpConnection.connect(next);
    };
};
//===========================
/**
 * @param url String URL to AMQP server
 * @param app ExpessJS Application
 */ 
function AmqpConnection (url) {
    this.url = url;
    this.connection = null;
    
    this.closed = false;
}

AmqpConnection.prototype.connect = function connect (callback) {
    console.log('[messaging:messaging] Connecting to AMQP server at', this.url);
    
    var self = this;
    amqplib.connect(this.url).then(function onConnected (connection) {
        self.connection = connection;

        connection.on('close', function onAmqpConnectionClose () {
            console.log('[messaging:messaging] AMQP connection closed...');
            
            self.closed = true;
        });
        
        connection.on('error', function onAmqpConnectionError (error) {
            console.log('[messaging:messaging] AMQP connection closed...');
            
            if (error && amqplib.isFatal(error)) {
                console.error('[messaging:messaging] Connection shutdown by server');
            }
            
            self.closed = true;
        });
        
        process.on('exit', function () {
            console.log('[messaging:messaging] Process exiting normally...');
            
            connection.close(); 
        });
        
        callback();
    }, callback);
};

AmqpConnection.prototype.disconnect = function disconnect () {
    console.log('[messaging:messaging] Disconnecting AMQP connection...');
    
    this.connection.close();
};
