const bcrypt = require('bcrypt');
const saltRounds = 10;
const {v4 : uuidv4} = require('uuid');
const nodemailer = require('nodemailer');
require('dotenv').config();

exports.auth = async function(req, res){

    //Nodemailer testing
    let testMail = await nodemailer.createTestAccount();

    //SMTP Transport
    let transporter = nodemailer.createTransport({
        service:    'gmail',
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    var accid = uuidv4();
    var username = req.body.r_username;
    var sitename = username;
    var pimage = 'default.png';
    var email = req.body.r_email;
    var password = req.body.r_password;

    var mailOptions = {
        from:       '"Isaac" <cytokine.osmium.mailer@gmail.com>',
        to:         email,
        subject:    'Hello there friend.',
        text:       'Thank you for registrating for Osmium Alpha!'
    };

    //Insert phase 2 verification here

    var defaultStext = "Hello there Osmium.";
    var defaultSiteP = "USER";

    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let stamp = date+"/"+month+"/"+year;

    const encryptedPassword = await bcrypt.hash(password, saltRounds);

    if(username && email && password){
        req.getConnection(function(err, connection){
            if (err) throw err;
            connection.query('SELECT * FROM accounts;', function(err, data, fields){
                if (err) throw err;
                connection.query("INSERT INTO accounts (id, username, sitename, pimage, email, password, register_stamp) VALUES (?,?,?,?,?,?,(STR_TO_DATE(?, '%d/%m/%Y')));",
                [
                    accid,
                    username,
                    sitename,
                    pimage,
                    email,
                    encryptedPassword,
                    stamp
                ], function(err, data, fields){
                    if(err) throw err;
                    connection.query("INSERT INTO account_status (id, status_text) VALUES (?,?)",
                    [
                        accid,
                        defaultStext
                    ], function(err, data, fields){
                        if (err) throw err;
                        connection.query("INSERT INTO account_special (id, site_privilege) VALUES (?,?)",
                        [
                            accid,
                            defaultSiteP
                        ], function(err, data, fields){
                            if (err) throw err;
                            connection.query("INSERT INTO account_verify (id, verify_status, verify_code) VALUES (?,?,?)",
                            [
                                accid,
                                "PENDING",
                                "ABCD1234"
                            ], async function(err, data, fields){
                                if(err) throw err;
                                
                                //Email verifier sender
                                await transporter.sendMail(mailOptions);

                                //Redirection to login menu or main menu
                                res.redirect("/");
                            })
                        })
                    })
                });
            });
        });
    }else{
        res.send('Please enter the correct credentials!');
		res.end();
    }
};