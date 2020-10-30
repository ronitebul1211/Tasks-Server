const express = require("express");
const User = require("../model/user");
const auth = require("../middleware/auth");

const router = new express.Router();

/** POST / users - add new user */
router.post("/users", async (req, res) => {
   const user = new User(req.body);
   try {
      await user.save();
      const token = await user.generateAuthToken();
      res.status(201).send({ user, token });
   } catch (err) {
      res.status(500).send(err);
   }
});

router.post("/users/login", async (req, res) => {
   try {
      const user = await User.findByCredentials(req.body.email, req.body.password);
      const token = await user.generateAuthToken();
      res.send({ user, token });
   } catch (err) {
      res.status(400).send(err.message);
   }
});

router.post("/users/logout-all", auth, async (req, res) => {
   try {
      req.user.tokens = [];
      await req.user.save();
      res.send();
   } catch (err) {
      res.status(500).send();
   }
});
router.post("/users/logout", auth, async (req, res) => {
   try {
      //Filtering out current token (multiple users)
      req.user.tokens = req.user.tokens.filter((token) => {
         return token.token !== req.token;
      });
      await req.user.save();
      res.send();
   } catch (err) {
      res.status(500).send();
   }
});

/** GET / users - response with users list */
router.get("/users/me", auth, async (req, res) => {
   res.send(req.user);
});

/** PATCH /users/:id - response with updated user */
router.patch("/users/me", auth, async (req, res) => {
   const allowedUpdates = ["name", "email", "password", "age"];
   const updates = Object.keys(req.body);

   const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
   if (!isValidOperation) {
      return res.status(400).send("Error: Invalid updates");
   }

   try {
      updates.forEach((update) => (req.user[update] = req.body[update]));
      await req.user.save();
      res.send(req.user);
   } catch (err) {
      res.status(400);
   }
});

/** DELETE /users/:id - delete specific user and response with his data */
router.delete("/users/me", auth, async (req, res) => {
   try {
      req.user.remove();
      res.send(req.user);
   } catch (err) {
      res.status(500).send();
   }
});

module.exports = router;
