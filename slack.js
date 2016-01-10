var https = require('https');
var url = require('url');
var slackHookRequestOptions = getSlackHookRequestOptions();
module.exports.sendToSlack = sendToSlack;

function getSlackHookRequestOptions()
{
    var hookUri = url.parse(process.env.slackhookuri);
    return {
        host: hookUri.hostname,
        port: hookUri.port,
        path: hookUri.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
}

function sendToSlack(parsedRequest, callback)
{
        if (!parsedRequest || (parsedRequest.body||'').trim()=='') {
            callback(true);
            return;
        }

        var error = false;
        var slackMessage = convertToSlackMessage(parsedRequest.body, parsedRequest.channel);
        var req = https.request(slackHookRequestOptions);

        req.on('error', function(e) {
            console.error(e);
            error = true;
        });

        req.on('close', function() { callback(error); } );

        req.write(slackMessage);
        req.end();
}

function convertToSlackMessage(body, channel)
{
    var parsedBody = tryParseBody(body);
    var success = (parsedBody.status == 'success' && parsedBody.complete);
    return JSON.stringify({
        text: getSlackText(parsedBody, success),
        channel: channel || process.env.slackchannel
    });
}

function tryParseBody(body)
{
    try
    {
        return JSON.parse(body) || {
            status: 'failed',
            complete: false
        };
    } catch(err) {
        console.error(err);
        return {
            status: err,
            complete: false
        };
    }
}

function getSlackText(parsedBody, success)
{
    return (
        '*' + (parsedBody.siteName || 'unknown') + ':*\r\n' +
        '>Deployment Finished for ' + (parsedBody.message || 'N/A') + '\r\n' +
        'By: _' + (parsedBody.author || 'unknown') + '_\r\n' +
        'Deployment Status: ' + (success ? ':white_check_mark:': ':red_circle:') + ' *' + (success ? 'Success': 'Failed') + '* ' + (success ? '' : '_who should be killed for this?_') + '\r\n' +
        'Deployment ID: *' + (parsedBody.id || '') + '*\r\n'
    );
}
