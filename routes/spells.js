exports.list = function(req, res){

  req.getConnection(function(err,connection){   
      if (err) throw err;
      connection.query('SELECT * FROM ex_spell;',function(err,rows){
        if(err)
          console.log("Error Selecting : %s ",err );

        res.render('spells',{page_title:"Excalibur Spells",data:rows});
      });

  });

};