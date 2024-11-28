const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const { RESOURCE, PATCH_OPTIONS, validateRequestOperation } = require('./utility');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    if (!validateRequestOperation(req.body, RESOURCE.tasks)) {
        return res.status(400).send({ error: 'Invalid POST Request!'});
    }
    try {
        // const tasks = await Task.create(req.body);
        const task = await Task.create({
            ...req.body,
            owner: req.user._id
        });
        res.status(201).send(task);
        
    } catch (error) {
        res.status(400).send(`Error saving task: ${error}`);
    }
});

// GET /tasks/?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        //const tasks = await Task.find({ owner: req.user._id }); // This will also work.
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    if (!validateRequestOperation(req.body, RESOURCE.tasks)) {
        return res.status(400).send({ error: 'Invalid Request!'});
    }
    try {
        //const task = await Task.findById(req.params.id);
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        task ? res.send(task) : res.status(404).send();
    } catch (error) {
        res.status(500).send();
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    if (!validateRequestOperation(req.body, RESOURCE.tasks)) {
        return res.status(400).send({ error: 'Invalid Update!'});
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        const fieldsToUpdate = Object.keys(req.body);
        fieldsToUpdate.forEach((fieldToUpdate) => task[fieldToUpdate] = req.body[fieldToUpdate]);
        task.save();
        res.send(task);
    
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
         const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }
        res.send(task);

    } catch (error) {
        res.status(500).send()
    }
});

module.exports = router;