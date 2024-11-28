const mongoose = require('mongoose');
const validator = require('validator');
const Task = require('../models/task');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name must be provided!'],
        trim: true
    },
    email: {
        type: String,
        unique: [true, 'Eamil already exists!'],
        required: [true, 'Email must be provided!'],
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid Email']
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number');
            }
        }
    },
    password: {
        type: String,
        minlength: [7, 'Password characters must be greater than 6'],
        trim: true,
        required: [true, 'Password is required!'],
        validate(password) {
            if (this.isModified(password) && 
                (value.toLowerCase().includes(password) || 
                 !validator.isAlphanumeric(password))) {
                throw new Error('Password must not contain the word "password" and must contain only numbers and letters!');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

// Reference between the user and task and it is not stored on the DB. 
// It is virtual mainly for Mongoose to figure out how the models are related
// Virtual populate means calling populate() on a virtual property that has a ref option
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject()

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({ token });

    await user.save();

    return token;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
       throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

// Delete user tasks when user is removed
userSchema.pre('deleteOne', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });

    next();
});

const User = mongoose.model('User', userSchema);

// const courage = new User({
//     name: ' Courage -  ',
//     email: 'COURAGE@GMAIL.COM',
//     password: '123456-'
// });

// courage.save().then(() => {
//     console.log(courage);
// }).catch((error) => {
//     console.log(`Error: \n ${error}`);
// });

module.exports = User;