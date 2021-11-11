const express = require('express');
const router = express.Router();
const Task = require('../models/task');

router.get('/tasks', (req, res, next) => {
    Task.find({}, 'action')
        .then((data) => res.json(data))
        .catch(next);
});

router.post('/tasks', (req, res, next) => {
    if (!req.body) {
        res.json({
            error: 'body is empty',
        });
    }else{    
        if (req.body.action) {
            Task.create(req.body)
                .then((data) => res.json(data))
                .catch(next);
        } else {
            res.json({
                error: 'The input field is empty',
            });
        }
    }
});

router.delete('/tasks/:id', (req, res, next) => {
    Task.findOneAndDelete({ _id: req.params.id })
        .then((data) => res.json(data))
        .catch(next);
});
  
module.exports = router;