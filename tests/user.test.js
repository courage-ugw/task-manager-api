const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOne, userOneId, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Courage Ugwuanyi',
        email: 'courageugwuanyi@gmail.com',
        password: 'computer01'
    }).expect(201);

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull()

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Courage Ugwuanyi',
            email: 'courageugwuanyi@gmail.com',
        },
        token: user.tokens[0].token
    });

    expect(user.password).not.toBe('computer01');
});

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    // Validate a new token is saved when a user is logged in
    const user = await User.findById(response.body.user._id);
    expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'wrongpassword'
    }).expect(400);
});

test('should get profile for user', async () => {
    await request(app).get('/users/me')
        .set('Authorization',` Bearer ${userOne.tokens[0].token}`) // sets header
        .send()
        .expect(200)
});

test('should not get profile for unauthenticated user', async () => {
    await request(app).get('/users/me')
        .send()
        .expect(401)
});

test('should delete account for user', async () => {
    const response = await request(app).delete('/users/me')
        .set('Authorization',` Bearer ${userOne.tokens[0].token}`) // sets header
        .send()
        .expect(200)

    // Validate that the user is removed
    const user = await User.findById(response.body._id);
    expect(user).toBeNull();
    
});

test('should not delete account for unauthenticated user', async () => {
    await request(app).delete('/users/me')
        .send()
        .expect(401)
});

test('should upload avatar image', async () => {
    await request(app).post('/users/me/avatar')
        .set('Authorization',` Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer));
});

test('should upadate valid user fields', async () => {
    await request(app).patch('/users/me')
        .send({
            name: 'Miracle'
        })
        .set('Authorization',` Bearer ${userOne.tokens[0].token}`)
        .expect(200)

    const user = await User.findById(userOneId);
    expect(user.name).toEqual('Miracle');
});

test('should not upadate invalid user fields', async () => {
    await request(app).patch('/users/me')
        .send({
            location: 'Enugu'
        })
        .set('Authorization',` Bearer ${userOne.tokens[0].token}`)
        .expect(400);
});