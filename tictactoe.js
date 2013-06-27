(function() {

  window.app = {};
  app.views = {};
  app.models = {};
  app.collections = {};
  
  var Main = function() {
    app.collections.game = new app.models.Game();
    app.views.game = new app.views.GameView({collection: app.collections.game});
  };
  
  // Defer initialization until jQuery.ready
  $(function() {
    Main();
  });

})();
