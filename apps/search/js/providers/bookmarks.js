/* globals DataGridProvider, GaiaGrid, Search,
 Promise, SyncDataStore, InMemoryStore */

(function(exports) {

  'use strict';

  var STORE_NAME = 'bookmarks_store';

  function formatBookmark(bookmark) {
    return {
      data: new GaiaGrid.Bookmark({
        id: bookmark.url,
        name: bookmark.name || bookmark.url,
        url: bookmark.url,
        icon: bookmark.icon
      })
    };
  }

  function Bookmarks() {}

  Bookmarks.prototype = {

    __proto__: DataGridProvider.prototype,

    name: 'Bookmarks',

    init: function() {
      DataGridProvider.prototype.init.apply(this, arguments);
      this.persistStore = new InMemoryStore();
      this.syncStore = new SyncDataStore(STORE_NAME, this.persistStore, 'url');
      return this.syncStore.sync();
    },

    get: function(url) {
      var results = this.persistStore.results;

      for (var idx in results) {
        var item = results[idx];
        if (item.url === url) {
          return formatBookmark(item);
        }
      }

      return null;
    },

    search: function(filter) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var renderResults = [];
        for(var elem in self.persistStore.results) {
          var bookmark = self.persistStore.results[elem];
          if ((!bookmark.url || bookmark.url.indexOf(filter) == -1) &&
              (!bookmark.name || bookmark.name.indexOf(filter) == -1)) {
            continue;
          }
          renderResults.push(formatBookmark(bookmark));
        }
        resolve(renderResults);
      });
    }

  };

  exports.Bookmarks = new Bookmarks();
  Search.provider(exports.Bookmarks);

}(window));
