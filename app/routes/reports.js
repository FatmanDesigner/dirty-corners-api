// =============================================
// IMPLEMENTATION
// =============================================
var Report = require('../models/report');
var SUPPORTED_VERBS = ['confirm', 'deny'];

/**
 * @access PUBLIC
 */
exports.GET = function getReports (req, res) {
  Report.find().sort([['created_at', 'descending']]).lean().then(function (reports) {
    res.send({ reports: reports });
  });
};

/**
 * @access PUBLIC
 */
exports.GET_ID = function getReports (req, res) {
    var reportID = req.params['id'];
    if (!reportID) {
        return res.status(400).end();
    }

    Report.findById(reportID).lean().then(function (report) {
        res.send({ report: report });
    });
};
/**
 * @access AUTHORIZED ONLY
 */
exports.PUT_ID = function postReports (req, res) {
    var data = req.body;
    var user = req.user;
    var verb = req.query.verb;
    var reportID = req.params.id;

    if (!user || !user.sub) {
        return res.status(401).send('Unauthorized access');
    }

    if (!verb) {
        console.error('[controller:reports.PUT_ID] Verb missing');
        return res.status(400).end();
    }
    else if (SUPPORTED_VERBS.indexOf(verb) === -1) {
        console.error('[controller:reports.PUT_ID] Unsupported verb', verb);
        return res.status(400).end();
    }

    var promise;
    if (verb === 'confirm') {
        promise = Report.findById(reportID).lean()
            .then(logicalCheck)
            .then(confirmReport);
    }

    promise.then(function (report) {
        res.send({ report: report });
    }).catch(function (error) {
        var message = error.message || 'Unknown';

        res.status(400).send(message);
    });

    return;
    //======
    /**
     * @return Promise
     */
    function logicalCheck (report) {
        if (!report) {
            return Promise.reject(new Error('Report not found'));
        }
        else if (report.reported_by.indexOf(user.sub) !== -1) {
            return Promise.reject(new Error('Cannot confirm or deny own Report'));
        }
        else if (report.confirmed_by.indexOf(user.sub) !== -1
                || report.denied_by.indexOf(user.sub) !== -1) {
            return Promise.reject(new Error('Cannot confirm or deny mulitple times'));
        }

        return report;
    }
    /**
     * @return Promise
     */
    function confirmReport (report) {
        // Transactional operation
        return Report.findByIdAndUpdate(report._id, {
            $inc: { confirmed_total: 1 },
            $addToSet: { confirmed_by: user.sub }
        }, { new: true }).lean();
    }
};
