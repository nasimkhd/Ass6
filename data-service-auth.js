var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
var userSchema = new Schema({
  "userName":  {"type": String, "unique": true},
  "password": String,
  "email": String,
  "loginHistory": [{
    "dateTime": Date,
    "userAgent": String
  }]
});

let User;

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
      let db = mongoose.createConnection(
        "mongodb+srv://nasim_khd:20122012Nasim@senecaass6.6fucw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
      );

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};




module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
		if(userData.password != userData.password2){
			reject("password do not match");
		} else{
		bcrypt.genSalt(10)  // Generate a "salt" using 10 rounds
		.then(salt=>bcrypt.hash(userData.password,salt)) // encrypt the password: "myPassword123"
		.then(hash=>{
			userData.password = hash;
			let newUser = new User(userData);
			newUser.save((err)=>{
				if(err){
					if(err.code == 11000){
						reject("User Name already taken");
					} else{
						reject("There was an error creating the user: " + err);
					}
				} else{
					resolve();
					
				}
			})
		})
		.catch(err=>{
			console.log("There was an error encrypting the password"); // Show any errors that occurred during the process
		});
		}
    });
};


// bcrypt.genSalt(10)  // Generate a "salt" using 10 rounds
// .then(salt=>bcrypt.hash("myPassword123",salt)) // encrypt the password: "myPassword123"
// .then(hash=>{
//     // TODO: Store the resulting "hash" value in the DB
// })
// .catch(err=>{
//     console.log(err); // Show any errors that occurred during the process
// });





module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({userName : userData.userName})
		.exec()
		.then((users)=>{
			if(!users){
				reject("Unable to find user: " + userData.userName);
			//} else if(users[0].password != userData.password){
			} else{
			bcrypt.compare(userData.password, users[0].password).then((result) => {
				if(result === true){
				users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent})
				try{
					User.update({userName : users[0].userName}, {$set: users[0].loginHistory})
					.exec()
					.then(()=>{resolve(users[0])})
				} catch(err){
					reject("There was an error verifying the user: "+err);
				}
				}else{
					reject("Incorrect Password for user : " + userData.userName)
				}
			})
			.catch("Incorrect Password for user: " + userData.userName);
			}
		})
		.catch(()=>{
			reject("Unable to find user: " + userData.userName);
		})

    });
};



//	var User = mongoose.model("web322_employee", userSchema);
