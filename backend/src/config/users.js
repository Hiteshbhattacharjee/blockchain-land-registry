'use strict';

const bcrypt = require('bcryptjs');

const users = [
    {
        id: 1,
        username: 'registrar',
        password: bcrypt.hashSync('registrar123', 10),
        role: 'registrar',
        name: 'District Registrar',
    },
    {
        id: 2,
        username: 'public',
        password: bcrypt.hashSync('public123', 10),
        role: 'public',
        name: 'Public User',
    },
];

function findUser(username) {
    return users.find(u => u.username === username);
}

module.exports = { findUser };
