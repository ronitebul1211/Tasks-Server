const jwt = require("jsonwebtoken");
const User = require("../model/user");

const auth = async (req, res, next) => {
   try {
      const token = req.header("Authorization").replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      //Find user with decoded id that has that auth token steel store
      const user = await User.findOne({ _id: decoded._id, "tokens.token": token });

      if (!user) {
         throw new Error();
      }

      req.token = token;
      req.user = user;
      next();
   } catch (err) {
      res.status(401).send({ error: "Please Authenticate" });
   }
};
module.exports = auth;

/**
 Without middleware: new request -> run route handler
 With middleware: new request -> do something -> run route handler
 
 */
