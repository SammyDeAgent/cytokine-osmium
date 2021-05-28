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

exports.create = function(req, res){
  const details = req.body;
	req.getConnection(function(err, connection){
		connection.query('INSERT INTO ex_spell (spell_code, spell_name, spell_type, spell_desc, author) VALUES (?, ?, ?, ?, ?)',
		 [
			 details.spellCode,
			 details.spellName,
			 details.spellType,
			 details.spellDesc,
			 details.spellAuthor
		 ], 
		 function(err, data){
			if (err) throw err;
				console.log("Record inserted successfully.");
		});
	});
	res.redirect('/query');
};