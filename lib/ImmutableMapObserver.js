'use strict';

exports.__esModule = true;
exports['default'] = ImmutableMapObserver;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _updateDeep = require('./updateDeep');

var _updateDeep2 = _interopRequireDefault(_updateDeep);

function mergeChanges(document, fields) {
  return document.withMutations(function (document) {
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) {
        var newValue = fields[key];
        if (newValue === undefined) {
          document['delete'](key);
        } else {
          document.update(key, function (oldValue) {
            return _updateDeep2['default'](oldValue, _immutable2['default'].fromJS(newValue));
          });
        }
      }
    }
  });
}

function ImmutableMapObserver(cursor, callback) {
  var _documents = undefined;
  var dep = new Tracker.Dependency();

  function update(newDocuments) {
    _documents = newDocuments;
    dep.changed();
  }

  var initialDocuments = {};
  var handle = cursor.observeChanges({
    added: function added(id, fields) {
      fields._id = id._str || id;
      if (initialDocuments) {
        initialDocuments[fields._id] = _immutable2['default'].fromJS(fields);
      } else {
        update(_documents.set(fields._id, _immutable2['default'].fromJS(fields)));
      }

      if (callback) {
        typeof callback === 'object' ? callback.added() : callback();
      }
    },
    changed: function changed(id, fields) {
      var _id = id._str || id;
      update(_documents.update(_id, function (doc) {
        return mergeChanges(doc, fields);
      }));

      if (callback) {
        typeof callback === 'object' ? callback.changed() : callback();
      }
    },
    removed: function removed(id) {
      var _id = id._str || id;
      update(_documents['delete'](_id));

      if (callback) {
        typeof callback === 'object' ? callback.removed() : callback();
      }
    }
  });
  _documents = _immutable2['default'].Map(initialDocuments);
  initialDocuments = undefined;

  if (Tracker.active) {
    Tracker.onInvalidate(function () {
      handle.stop();
    });
  }

  return {
    documents: function documents() {
      dep.depend();
      return _documents;
    },
    stop: function stop() {
      handle.stop();
    }
  };
}

module.exports = exports['default'];