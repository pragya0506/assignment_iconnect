const config = require('config.json');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Q = require('q');
var db;
const mongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId; 

    mongoClient.connect(config.connectionString,{ useUnifiedTopology: true })
    .then((mClient) =>
    {
        const client = mClient;
        db = client.db('assignment');
    })
    .catch((err)=>{
        console.log(err);
    });



const service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function authenticate(username, password) {
    const deferred = Q.defer();

    db.collection('users').findOne({ username: username }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            deferred.resolve(jwt.sign({ sub: user._id }, config.secret));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getById(id) {
    const deferred = Q.defer();

    db.collection('users').findOne({_id:ObjectId(id)}, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(userParam) {
    const deferred = Q.defer();

    db.collection('users').findOne(
        { username: userParam.username },
        function (err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (user) {
                deferred.reject('Username "' + userParam.username + '" is already taken');
            } else {
                createUser();
            }
        });

    function createUser() {
        const user = _.omit(userParam, 'password');
        user.hash = bcrypt.hashSync(userParam.password, 10);

        db.collection('users').insert(
            user,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, userParam) {
    const deferred = Q.defer();

    db.collection('users').findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user.username !== userParam.username) {
            db.collection('users').findOne(
                { username: userParam.username },
                function (err, user) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (user) {
                        deferred.reject('Username "' + req.body.username + '" is already taken')
                    } else {
                        updateUser();
                    }
                });
        } else {
            updateUser();
        }
    });

    function updateUser() {
        const set = {
            firstName: userParam.firstName,
            lastName: userParam.lastName,
            username: userParam.username,
        };

        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }

        db.collection('users').update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    const deferred = Q.defer();

    db.collection('users').remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}