const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
    description: {
        type: String,
        trim: true,
        required: [true, 'Description is required']
    },
    completed: {
        type: Boolean,
        trim: true,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

// const newTask = Task({
//     description: 'Eat launch '
// });
// newTask.save().then(() => {
//     console.log(newTask);
// }).then( (error) => {
//     console.log(`Error: ${error}`);
// });

module.exports = Task;