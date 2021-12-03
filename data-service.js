const Sequelize = require("sequelize");

// var sequelize = new Sequelize('database', 'user', 'password', {
var sequelize = new Sequelize(
  "d44sfuaka2rugg",
  "yoxquzhrzkvgvb",
  "846cb486b45b0fea84ef461a5b852c5c8d91b8802dbb867ce65af64eb071ee69",
  {
    host: "ec2-3-213-41-172.compute-1.amazonaws.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
    logging: false,
  }
);


let Employee = sequelize.define("Employee", {
  employeeNum: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
  SSN: Sequelize.STRING,
  addressStreet: Sequelize.STRING,
  addressCity: Sequelize.STRING,
  addressState: Sequelize.STRING,
  addressPostal: Sequelize.STRING,
  maritalStatus: Sequelize.STRING,
  isManager: Sequelize.BOOLEAN,
  employeeManagerNum: Sequelize.INTEGER,
  status: Sequelize.STRING,
  hireDate: Sequelize.STRING,
});

let Department = sequelize.define("Department", {
  departmentId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  departmentName: Sequelize.STRING,
});
Department.hasMany(Employee, { foreignKey: "department" }); // sets the foreign key for department table

// change all empty values to null
function empty_to_null(obj) {
  for (key in obj) {
    if (obj[key] == "") {
      obj[key] = null;
    }
  }
  return obj;
}

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
      resolve();
    });
  });
};

// return employees array if it's not empty
module.exports.getAllEmployees = function () {
  return new Promise(function (resolve, reject) {
    Employee.findAll()
      .then(function (data) {
        // console.log("data", data);
        // should return an array
        resolve(data);
      })
      .catch(function () {
        reject("Unable to retrieve all employees");
      });
  });
};

// adds an employee
module.exports.addEmployee = function (employeeData) {
  return new Promise(function (resolve, reject) {
    // console.log("this is add employee");
    // if isManager exists, set to true, else set of false
    if ("isManager" in employeeData) {
      employeeData.isManager = true;
    } else {
      employeeData.isManager = false;
    }

    employeeData = empty_to_null(employeeData);
    // console.log(employeeData);

    Employee.create({
      employeeNum: employeeData.employeeNum,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: employeeData.email,
      SSN: employeeData.SSN,
      addressStreet: employeeData.addressStreet,
      addressCity: employeeData.addressCity,
      addressState: employeeData.addressState,
      addressPostal: employeeData.addressPostal,
      maritalStatus: employeeData.maritalStatus,
      isManager: employeeData.isManager,
      employeeManagerNum: employeeData.employeeManagerNum,
      status: employeeData.status,
      hireDate: employeeData.hireDate,
    })
      .then(function () {
        // console.log("employee added");
        resolve();
      })
      .catch(function () {
        reject("Unable to add new employee");
      });
  });
};

// returns all employees with a status
module.exports.getEmployeesByStatus = function (emp_status) {
  return new Promise(function (resolve, reject) {
    Employee.findAll({
      where: { status: emp_status },
    })
      .then(function (data) {
        // return a single employee
        resolve(data[0]);
      })
      .catch(function () {
        reject(`No employee with ${emp_status}`);
      });
  });
};

module.exports.getEmployeesByDepartment = function (emp_department) {
  return new Promise(function (resolve, reject) {
    Employee.findAll({
      where: { department: emp_department },
    })
      .then(function (data) {
        // return an single employee
        resolve(data);
      })
      .catch(function () {
        reject(`No employee in department ${emp_department}`);
      });
  });
};

module.exports.getEmployeesByManager = function (emp_manager) {
  return new Promise(function (resolve, reject) {
    Employee.findAll({
      where: { employeeManagerNum: emp_manager },
    })
      .then(function (data) {
        resolve(data);
      })
      .catch(function () {
        reject(`No employee with ${emp_manager} found`);
      });
  });
};

// return an employee object by employee number
module.exports.getEmployeeByNum = function (emp_num) {
  return new Promise(function (resolve, reject) {
    Employee.findAll({
      where: { employeeNum: emp_num },
    })
      .then(function (data) {
        // console.log(data);
        resolve(data[0]);
      })
      .catch(function () {
        reject(`No employee with ${emp_num} employee number found`);
      });
  });
};

// Updates an employee
module.exports.updateEmployee = function (employeeData) {
  return new Promise(function (resolve, reject) {
    // if isManager exists, set to true, else set of false
    if ("isManager" in employeeData) {
      employeeData.isManager = true;
    } else {
      employeeData.isManager = false;
    }

    employeeData = empty_to_null(employeeData);
    Employee.update(
      {
        employeeNum: employeeData.employeeNum,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        email: employeeData.email,
        SSN: employeeData.SSN,
        addressStreet: employeeData.addressStreet,
        addressCity: employeeData.addressCity,
        addressState: employeeData.addressState,
        addressPostal: employeeData.addressPostal,
        maritalStatus: employeeData.maritalStatus,
        isManager: employeeData.isManager,
        employeeManagerNum: employeeData.employeeManagerNum,
        status: employeeData.status,
        hireDate: employeeData.hireDate,
      },
      {
        where: { employeeNum: employeeData.employeeNum },
      }
    )
      .then(function () {
        resolve();
      })
      .catch(function () {
        console.log("catch");
        reject("Unable to update employee");
      });
  });
};

// delete an employee by number
module.exports.deleteEmployeeByNumber = function (id) {
  return new Promise(function (resolve, reject) {
    Employee.destroy({
      where: { employeeNum: id },
    })
      .then(function () {
        resolve("employee deleted");
      })
      .catch(function () {
        reject("unable to delete employee");
      });
  });
};

// add an department
module.exports.addDepartment = function (departmentData) {
  return new Promise(function (resolve, reject) {
    departmentData = empty_to_null(departmentData);
    Department.create({
      departmentId: departmentData.departmentId,
      departmentName: departmentData.departmentName,
    })
      .then(function () {
        resolve();
      })
      .catch(function () {
        reject("unable to add new department");
      });
  });
};

// return all departments
module.exports.getAllDepartments = function () {
  return new Promise(function (resolve, reject) {
    Department.findAll()
      .then(function (data) {
        // should return an array
        resolve(data);
      })
      .catch(function () {
        reject("Unable to return all departments");
      });
  });
};

// returns an department by ID
module.exports.getDepartmentById = function (id) {
  return new Promise(function (resolve, reject) {
    Department.findAll({
      where: { departmentId: id },
    })
      .then(function (data) {
        // should return an array
        resolve(data);
      })
      .catch(function () {
        reject(`unable to find department with id ${id}`);
      });
  });
};

// update department by ID
module.exports.updateDepartment = function (departmentData) {
  return new Promise(function (resolve, reject) {
    departmentData = empty_to_null(departmentData);
    Department.update(
      {
        departmentId: departmentData.departmentId,
        departmentName: departmentData.departmentName,
      },
      {
        where: { departmentId: departmentData.departmentId },
      }
    )
      .then(function () {
        resolve("department updated");
      })
      .catch(function () {
        reject("Unable to update department");
      });
  });
};

// getDepartmentById(id)
// return an department by ID
module.exports.getDepartmentById = function (id) {
  return new Promise(function (resolve, reject) {
    Department.findAll({
      where: { departmentId: id },
    })
      .then(function (data) {
        resolve(data[0]);
      })
      .catch(function () {
        reject(`No department with ID ${id}`);
      });
  });
};

// delete an department by ID
module.exports.deleteDepartmentById = function (id) {
  return new Promise(function (resolve, reject) {
    Department.destroy({
      where: { departmentId: id },
    })
      .then(function () {
        resolve("department deleted");
      })
      .catch(function () {
        reject("unable to delete department");
      });
  });
};

