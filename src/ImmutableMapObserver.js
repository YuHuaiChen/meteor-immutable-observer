import Immutable from 'immutable';

import updateDeep from './updateDeep';

function mergeChanges(document, fields) {
  return document.withMutations(document => {
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) {
        var newValue = fields[key];
        if (newValue === undefined) {
          document.delete(key);
        }
        else {
          document.update(key, oldValue => updateDeep(oldValue, Immutable.fromJS(newValue)));
        }
      }
    }
  });
}

export default function ImmutableMapObserver(cursor, callback) {
  let documents;
  let dep = new Tracker.Dependency();

  function update(newDocuments) {
    documents = newDocuments;
    dep.changed();
  }

  let initialDocuments = {};
  let handle = cursor.observeChanges({
    added: (id, fields) => {
      fields._id = id._str || id;
      if (initialDocuments) {
        initialDocuments[fields._id] = Immutable.fromJS(fields);
      }
      else {
        update(documents.set(fields._id, Immutable.fromJS(fields)));
      }

      if (callback) {
        typeof callback === 'object' ? callback.added() : callback()
      }
    },
    changed: (id, fields) => {
      let _id = id._str || id
      update(documents.update(_id, doc => mergeChanges(doc, fields)));

      if (callback) {
        typeof callback === 'object' ? callback.changed() : callback()
      }
    },
    removed: (id) => {
      let _id = id._str || id
      update(documents.delete(_id));

      if (callback) {
        typeof callback === 'object' ? callback.removed() : callback()
      }
    },
  });
  documents = Immutable.Map(initialDocuments);
  initialDocuments = undefined;

  if (Tracker.active) {
    Tracker.onInvalidate(() => {
      handle.stop();
    });
  }

  return {
    documents() {
      dep.depend();
      return documents;
    },
    stop() {
      handle.stop();
    }
  };
}
