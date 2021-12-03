let multer = require("multer");
let data_service = require("./data-service");
let fs = require("fs");
let handle_bars = require("express-handlebars");
let auth = require("./data-service-auth.js");
let sessions = require("client-sessions");
let express = require("express");
let path = require("path");

let app = express();

let HTTP_PORT = process.env.PORT || 30001;

const storage = multer.diskStorage({
  destination: "./public/images/uploaded/",
  filename: function (request, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

app.use(function (request, response, next) {
  let route = request.baseUrl + request.path;
  app.locals.activeRoute = route == "/" ? "/" : route.replace(/\/$/, "");
  next();
});

//enable midware to parse plain text
app.use(express.urlencoded({ extended: true }));

// set up client sessions
app.use(
  sessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "assignment6", // this should be a long un-guessable string.
    duration: 10 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 50000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.engine(
  ".hbs",
  handle_bars({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },

      // increment number passed in by 1
      inc: function (value) {
        return parseInt(value + 1);
      },
    },
  })
);
app.set("view engine", ".hbs");
app.use(express.static("public"));
const upload = multer({ storage: storage });

// called when web server gets initalized
function onStart() {
  data_service
    .initialize()
    .then(auth.initialize)
    .then(function (message) {
      console.log("Express http server listening on " + HTTP_PORT);
    })
    .catch(function (message) {
      console.log(message);
    });
}

// ensure user is logged in
function ensureLogin(req, res, next) {
  if (!req.session.user) res.redirect("/login");
  else next();
}

// render home page
app.get("/", function (request, response) {
  response.render("home");
});

// render about page
app.get("/about", function (request, response) {
  response.render("about");
});

// login route
app.get("/login", function (request, response) {
  response.render("login", {
    defaultLayout: false,
  });
});

app.post("/login", function (request, response) {
  request.body.userAgent = request.get("User-Agent");
  auth
    .checkUser(request.body)
    .then(function (user) {
      request.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };

      response.redirect("/employees");
    })
    .catch(function (err) {
      response.render("login", {
        errorMessage: err,
        userName: request.body.userName,
      });
    });
});

// register route
app.get("/register", function (request, response) {
  response.render("register", {
    defaultLayout: false,
  });
});

app.post("/register", function (request, response) {
  // console.log(request.body);
  auth
    .registerUser(request.body)
    .then(function () {
      response.render("register", {
        successMessage: "User created",
      });
    })
    .catch(function (error) {
      response.render("register", {
        errorMessage: error,
        userName: request.body.userName,
      });
    });
});

// logout route
app.get("/logout", function (request, response) {
  request.session.reset();
  response.redirect("/login");
});

// user history route
app.get("/userHistory", ensureLogin, function (request, response) {
  response.render("userHistory");
});
// Sends all names of employees
app.get("/employees", ensureLogin, function (request, response) {
  // console.log(request.query);

  data_service
    .getAllEmployees()
    .then(function (data) {
      // get employee by status
      const element = request.query;
      // check if status exists
      if (element.status) {
        data_service
          .getEmployeesByStatus(element.status)
          .then(function (data) {
            if (data.length > 0) {
              response.render("employees", {
                employee: data,
                defaultLayout: false,
              });
            } else {
              response.render("employees", {
                employee: false,
                message: "no employees found",
              });
            }
          })
          .catch(function () {
            response.render("employees", {
              message: "No results",
            });
          });
      }
      // get employees by department
      else if (element.department) {
        data_service
          .getEmployeesByDepartment(element.department)
          .then(function (data) {
            response.render("employees", {
              employee: data,
              defaultLayout: false,
            });
          })
          .catch(function () {
            response.render("employees", {
              employee: false,
              message: "No Employees",
            });
          });
      }
      // get employee by manager
      else if (element.manager) {
        data_service
          .getEmployeesByManager(element.manager)
          .then(function (data) {
            response.render("employees", {
              employee: data,
              defaultLayout: false,
            });
          })
          .catch(function (message) {
            response.render("employees", {
              message: "No results",
            });
          });
      }
      // return all employee
      else {
        // console.log(data);
        response.render("employees", {
          employee: data,
          defaultLayout: false,
        });
      }
    })
    .catch(function (message) {
      response.send(message);
    });
});

app.get("/employee/:empnum", ensureLogin, function (request, response) {
  // initialize an empty object to store the values
  let viewData = {};
  // console.log(request.params);
  data_service
    .getEmployeeByNum(request.params.empnum)
    .then((data) => {
      if (data) {
        viewData.employee = data; //store employee data in the "viewData" object as "employee"
      } else {
        viewData.employee = null; // set employee to null if none were returned
      }
    })
    .catch(() => {
      viewData.employee = null; // set employee to null if there was an error
    })
    .then(data_service.getAllDepartments)
    .then((data) => {
      viewData.departments = data; // store department data in the "viewData" object as "departments"
      // loop through viewData.departments and once we have found the departmentId that matches
      // the employee's "department" value, add a "selected" property to the matching
      // viewData.departments object
      for (let i = 0; i < viewData.departments.length; i++) {
        if (
          viewData.departments[i].departmentId == viewData.employee.department
        ) {
          viewData.departments[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.departments = []; // set departments to empty if there was an error
    })
    .then(() => {
      if (viewData.employee == null) {
        // if no employee - return an error
        response.status(404).send("Employee Not Found");
      } else {
        // console.log(viewData);
        response.render("single_employee", { viewData: viewData }); // render the "employee" view
      }
    });
});

app.get("employee/value", ensureLogin, function (request, response) {
  response.json(getAllEmployeeByNum(request.params.employee));
});

// add an employee
app.get("/employees/add", function (request, response) {
  data_service
    .getAllDepartments()
    .then(function (data) {
      response.render("addEmployee", {
        departments: data,
      });
    })
    .catch(function () {
      response.render("addEmployee", {
        departments: [],
      });
    });
});

// add an employee
app.post("/employees/add", ensureLogin, function (request, response) {
  // console.log("body", request.body);
  data_service
    .addEmployee(request.body)
    .then(function () {
      response.redirect("/employees");
    })
    .catch(function (message) {
      response.send(message);
    });
});

// update employee
app.post("/employee/update", ensureLogin, (request, response) => {
  // console.log(request.params);
  // console.log(request.body);
  data_service
    .updateEmployee(request.body)
    .then(function () {
      response.redirect("/employees");
    })
    .catch(function (message) {
      console.log("rejected");
      response.send(message);
    });
});

app.get("/employees/delete/:empnum", ensureLogin, function (request, response) {
  let empNum = request.params.empnum;
  data_service
    .deleteEmployeeByNumber(empNum)
    .then(function () {
      response.redirect("/employees");
    })
    .catch(function (message) {
      response.status(500).send(message);
    });
});

// sends name of all departments
app.get("/departments", ensureLogin, function (request, response) {
  data_service
    .getAllDepartments()
    .then(function (data) {
      // console.log(data);
      if (data.length > 0) {
        response.render("departments", {
          departments: data,
          defaultLayout: false,
        });
      } else {
        response.render("departments", {
          departments: false,
          message: "no departments found",
        });
      }
    })
    .catch(function (message) {
      response.send(message);
    });
});

// renders add department page
app.get("/departments/add", ensureLogin, function (request, response) {
  response.render("addDepartment");
});

// processes newly added department
app.post("/departments/add", ensureLogin, function (request, response) {
  let form_data = request.body;
  data_service
    .addDepartment(form_data)
    .then(function () {
      response.redirect("/departments");
    })
    .catch(function (message) {
      response.send(message);
    });
});

app.post("/department/update", ensureLogin, function (request, response) {
  let forum_data = request.body;
  data_service
    .updateDepartment(forum_data)
    .then(function () {
      response.redirect("/departments");
    })
    .catch(function (message) {
      response.send(message);
    });
});

app.get("/department/:departmentId", ensureLogin, function (request, response) {
  let id = Number(request.params.departmentId);
  data_service
    .getDepartmentById(id)
    .then(function (data) {
      response.render("single_department", {
        department: data,
      });
    })
    .catch(function (message) {
      response.status(404).send(message);
    });
});

app.get(
  "/departments/delete/:departmentId",
  ensureLogin,
  function (request, response) {
    let id = Number(request.params.departmentId);
    // console.log("deleting department", id, "...");
    data_service
      .deleteDepartmentById(id)
      .then(function () {
        response.redirect("/departments");
      })
      .catch(function (message) {
        response.status(500).send(message);
      });
  }
);

// renders forum for uploading images
app.get("/images/add", ensureLogin, (request, response) => {
  response.render("addImage");
});

app.get("/images", ensureLogin, function (request, response) {
  let path = "./public/images/uploaded";
  fs.readdir(path, function (error, items) {
    // console.log(items);

    response.render("images", {
      data: items,
      defaultLayout: false,
    });
    // response.json(items);
  });
});

// gets image from user and sends it to where ever
app.post(
  "/images/add",
  upload.single("imageFile"),
  ensureLogin,
  (request, response) => {
    response.redirect("/images");
  }
);

// page not found
app.get("*", function (request, response) {
  response.status(404).send("404 PAGE NOT FOUND");
});

// setup http server to listen on HTTP_PORT
data_service
  .initialize()
  .then((message) => {
    console.log("starting server");
    app.listen(HTTP_PORT, onStart);
  })
  .catch((message) => {
    console.log(message, ", server not starting");
  });
