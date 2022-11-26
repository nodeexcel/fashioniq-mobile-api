module.exports = function () {
    var nodemailer = require('nodemailer');
    var hbs = require('nodemailer-express-handlebars');
    var options = {
        viewEngine: {
            extname: '.hbs',
            layoutsDir: 'views/email/',
            defaultLayout: 'template',
            partialsDir: 'views/partials/'
        },
        viewPath: 'views/email/',
        extName: '.hbs'
    };
    var smtpTransport = require('nodemailer-smtp-transport');
    var mailerObj = {
        send: function (to, subject, template, context) {
            //---added by arun on 1st may 2015
            var mandrill = require('mandrill-api/mandrill');
            // var mandrill_client = new mandrill.Mandrill(''); 
            // var message = {
            //     "html": context.body,
            //     "subject": subject,
            //     "from_email": "noreply@fashioniq.in",
            //     "from_name": "Fashioniq.in",
            //     "to": [{
            //             "email": to,
            //             "name": to
            //         }],
            // };
            // mandrill_client.messages.send({"message": message}, function(result) {
            //     console.log(result);
            // }, function(e) {
            //     console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            // });
            
            var mailer = nodemailer.createTransport(smtpTransport({
                host: 'smtp.sendgrid.net',
                port: 25,
                auth: {
                    user: process.env.SENDGRID_API_USER,
                    pass: process.env.SENDGRID_API_KEY
                }

            }));
            mailer.use('compile', hbs(options));
            mailer.sendMail({
                from: 'noreply@fashioniq.in',
                to: to,
                subject: subject,
                template: template,
                context: context
            }, function (error, response) {
                if( error ){
                    console.log(error);
                }
                console.log('mail sent to ' + to);
                mailer.close();
            });
            
        }
    };
    return function (req, res, next) {
        req.mailer = mailerObj;
        next();
    }
}