const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');
const { RESOURCE, PATCH_OPTIONS, validateRequestOperation } = require('./utility');

const router = new express.Router();

router.post('/users', async (req, res) => {
    if (!validateRequestOperation(req.body, RESOURCE.users)) {
        return res.status(400).send({ error: 'Invalid POST Request!'});
    }
    try {
        const user = await User.create(req.body);
        
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(`Error saving the user: ${error}`);
    }
});

const uplaoad = multer({ 
    limits: { fileSize: 1000000 }, // 1 million bytes = 1MB
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image!'))
        }
        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, uplaoad.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save()
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token});

    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token );
        await req.user.save();
        res.send();

    } catch (error) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();

    } catch (error) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    if (!validateRequestOperation(req.body, RESOURCE.users)) {
        return res.status(400).send({ error: 'Invalid Request!'});
    }
    res.send(req.user);
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);

    } catch (error) {
        res.status(404).send();
    }
} );

router.patch('/users/me', auth, async (req, res) => {
    if (!validateRequestOperation(req.body, RESOURCE.users)) {
        return res.status(400).send({ error: 'Invalid Update!'});
    }

    try {
        const fieldsToUpdate = Object.keys(req.body);
        fieldsToUpdate.forEach((fieldToUpdate) =>  req.user[fieldToUpdate] = req.body[fieldToUpdate]);
        await req.user.save();
        res.send(req.user);

    } catch (error) {
        res.status(401).send(error);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.deleteOne();
        sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user); 
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

module.exports = router;