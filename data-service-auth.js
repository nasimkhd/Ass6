let mongoose = require("mongoose");
let Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

let userSchema = new Schema({
  userName: String,
  password: String,
  email: String,
  loginHistory: [
    {
      dataTime: Date,
      userAgent: String,
    },
  ],
});

let User;

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      "mongodb+srv://nasim_khd:20122012Nasim@senecaass6.6fucw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    );
    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });

    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

// registers the new user passed into the function
module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("passwords do not match...");
    }

    bcrypt
      .genSalt(10) // Generate a "salt" using 10 rounds
      .then((salt) => bcrypt.hash(userData.password, salt))
      .then((hash) => {
        userData.password = hash;
        let newUser = new User(userData);
        newUser.save((error) => {
          if (error) {
            if (error.code == 11000) {
              reject("User name already taken");
            } else {
              resolve("new user registered");
            }
          }
          resolve();
        });
      })
      .catch((err) => {
        reject("Error registering user: ", err);
      });
  });
};

// validate a user's existance
module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    // console.log("userData is ", userData);
    User.find({ userName: userData.userName })
      .exec()
      .then(function (users) {
        // console.log("data returned is ", users);
        // if no data is returned, reject
        if (users.length == 0) {
          reject(`Uable to find user: ${userData.userName}`);
        }

        // console.log("before compare");
        // if password from data found does not match user password, reject
        bcrypt.compare(userData.password, users[0].password).then((same) => {
          // console.log("in compare");
          if (same) {
            try {
              users[0].loginHistory.push({
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
              });
              User.update(
                { userName: users[0].userName },
                { $set: { loginHistory: users[0].loginHistory } }
              );
              resolve(users[0]);
            } catch (e) {
              reject(`There was an error verifying the user: ${e}`);
            }
          } else {
            reject(`Incorrect password for user: ${userData.userName}`);
          }
        });
      })
      .catch(function () {
        reject(`Error locating user: ${userData.userName}`);
      });
  });
};

