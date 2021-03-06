'use strict';

exports.__esModule = true;
exports['default'] = ImmutableListObserver;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _updateDeep = require('./updateDeep');

var _updateDeep2 = _interopRequireDefault(_updateDeep);

function ImmutableListObserver(cursor) {
  var _documents = undefined;
  var dep = new Tracker.Dependency();

  function update(newDocuments) {
    _documents = newDocuments;
    dep.changed();
  }

  var initialDocuments = [];
  var handle = cursor.observe({
    addedAt: function addedAt(document, atIndex, before) {
      if (initialDocuments) {
        initialDocuments.splice(atIndex, 0, _immutable2['default'].fromJS(document));
      } else {
        update(_documents.splice(atIndex, 0, _immutable2['default'].fromJS(document)));
      }
    },
    changedAt: function changedAt(newDocument, oldDocument, atIndex) {
      update(_documents.update(id, function (document) {
        return _updateDeep2['default'](document, _immutable2['default'].fromJS(newDocument));
      }));
    },
    removedAt: function removedAt(oldDocument, atIndex) {
      update(_documents.splice(atIndex, 1));
    },
    movedTo: function movedTo(document, fromIndex, toIndex, before) {
      var movedDocument = _documents.get(fromIndex);
      update(_documents.splice(fromIndex, 1).splice(toIndex, 0, movedDocument));
    }
  });
  _documents = _immutable2['default'].List(initialDocuments);
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