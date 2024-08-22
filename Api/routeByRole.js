const routeByRole = (role) => {
    switch (role) {
      case "user":
        return "http://localhost:4000/user-service";
      case "doctor":
        return "http://localhost:5000/doctor-service";
      case "admin":
        return "http://localhost:6000/admin-service";
      default:
        throw new Error("Invalid role");
    }
  };

module.exports = routeByRole