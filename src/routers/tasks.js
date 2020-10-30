const express = require("express");
const Task = require("../model/task");
const auth = require("../middleware/auth");

const router = new express.Router();

/** POST /tasks - add new task */
router.post("/tasks", auth, async (req, res) => {
   const task = new Task({
      ...req.body,
      user: req.user._id,
   });
   try {
      await task.save();
      res.status(201).send(task);
   } catch (err) {
      res.status(500).send();
      console.error(err);
   }
});

/** 
GET /tasks?completed={boolean} 
GET /tasks?limit={number}&skip={number} - if Nan sent, it ignored by moongose
GET /tasks?sortBy=createdAt:asc/desc
*/
router.get("/tasks", auth, async (req, res) => {
   const match = {};
   const sort = {};

   if (req.query.completed) {
      match.completed = req.query.completed === "true";
   }

   if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
   }

   try {
      await req.user
         .populate({
            path: "tasks",
            match,
            options: {
               limit: parseInt(req.query.limit),
               skip: parseInt(req.query.skip),
               sort,
            },
         })
         .execPopulate();
      res.send(req.user.tasks);
   } catch (err) {
      res.status(500).send();
      console.error(err);
   }
});

/** GET / tasks/:id - response with specific task data*/
router.get("/tasks/:id", auth, async (req, res) => {
   const _id = req.params.id;
   try {
      //filter task by id and owner
      const task = await Task.findOne({ _id, user: req.user._id });

      if (!task) {
         return res.status(404).send();
      }

      res.send(task);
   } catch (err) {
      res.status(500).send(error);
   }
});

/** PATCH /tasks/:id - response with updated task */
router.patch("/tasks/:id", auth, async (req, res) => {
   const allowedUpdates = ["description", "completed"];
   const updates = Object.keys(req.body);
   const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

   if (!isValidOperation) {
      return res.status(400).send("Error: Invalid updates");
   }

   try {
      const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

      if (!task) {
         return res.status(404).send();
      }

      updates.forEach((update) => (task[update] = req.body[update]));
      await task.save();
      res.send(task);
   } catch (err) {
      res.status(400);
   }
});

/** DELETE /tasks/:id - delete specific task and response with its data */
router.delete("/tasks/:id", auth, async (req, res) => {
   try {
      const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

      if (!task) {
         return res.status(404).send();
      }

      res.send(task);
   } catch (err) {
      res.status(500).send();
   }
});

module.exports = router;
