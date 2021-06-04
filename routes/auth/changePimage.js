const Jimp = require('jimp');
const fs = require("fs");

exports.auth = async function(req, res){

	if(!req.files){
		res.send("File not found.");
		return;
	}

    // Uploading image
    var pFile = req.files.new_Pimage;
    
    if(pFile.mimetype == 'image/png'){
        var user_pimage_name = req.session.username+'.png';
    }else if(pFile.mimetype == 'image/jpg'){
        var user_pimage_name = req.session.username+'.jpg';
    }else if(pFile.mimetype == 'image/jpeg'){
        var user_pimage_name = req.session.username+'.jpeg';
    }else{
        res.send("Incorrect file format! Please try again.");
        res.end();
    }

    pFile.mv(__dirname+'../../../public/user_pic/'+user_pimage_name);
    var tempFile = __dirname+'../../../public/user_pic/'+user_pimage_name;

    // File type consistancy
    if(pFile.mimetype == 'image/png' || pFile.mimetype == 'image/jpeg'){
        const image = await Jimp.read(__dirname+'../../../public/user_pic/'+user_pimage_name);
        await image.resize(300, 300); // Change resolution if needed
        user_pimage_name = req.session.username+'.jpg';
        await image.writeAsync(__dirname+'../../../public/user_pic/'+user_pimage_name);
        fs.unlinkSync(tempFile);
    }

    // SQL update
    req.getConnection(function(err, connection){
        if (err) throw err;
        connection.query('UPDATE accounts SET pimage = ? WHERE email = ?',[
            user_pimage_name,
            req.session.email
        ],function(err, data, fields){
            if (err) throw err;
            req.session.pimage = user_pimage_name;
            res.redirect('/profile');
        });
    });

};

exports.reset = async function(req, res){
    // Destory stored profile picture
    fs.unlinkSync(__dirname+'../../../public/user_pic/'+req.session.username+'.jpg');

    var defaultPic = 'default.png';

    req.getConnection(function(err, connection){
        if (err) throw err;
        connection.query('UPDATE accounts SET pimage = ? WHERE email = ?',[
            defaultPic,
            req.session.email
        ],function(err, data, fields){
            if (err) throw err;
            req.session.pimage = defaultPic;
            res.redirect('/profile');
        });
    });
}