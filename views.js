(function ( views ) {

  views.SquareView = Backbone.View.extend({
    tagName: 'span',
    className: 'square',
    
    template: _.template($('#squareTemplate').html()),
    
    events: {
      'click': 'handleSquareClick',
    },
    
    initialize: function() {
      this.model.bind('change', this.render, this);
    },
    
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      if (this.model.get('token') == "X") {
        this.$('img').attr("src", "img/X.jpg");
      } else if (this.model.get('token') == "O") {
        this.$('img').attr("src", "img/O.jpg");
      }
      return this;
    },
    
    handleSquareClick: function(e) {
      if (this.model.place(app.collections.game.get("currentToken"))) {
        app.collections.game.swapTurns();
      }
    }
  });


  views.BoardView = Backbone.View.extend({
    tagName: 'div',
    className: 'squares',
    
    template: _.template($('#boardTemplate').html()),
    
    initialize: function() {
      var squares = this.model.get('squares');
      squares.on('add', this.addOne, this);
      this.model.on('change', this.refresh, this);

      this.$el.html(this.template(this.model.toJSON()));      
      this.model.fill();
    },
    
    addOne: function(item) {
      var view = new views.SquareView({model: item});
      // this.$('div').append(view.render().el);
      this.$el.append(view.render().el);
    },
    
    refresh: function() {
      if (this.model.isWon()) {
        // TODO: make a transparent 'you won here' graphic.
        this.$el.css('background', '#EEE');
      }
    },
    
    // Purposefully blank.  Let init and addOne handle all the rendering.
    render: function() {
      return this;
    }  
    
   });
  
  
  views.GameView = Backbone.View.extend({
    el: '#game',
    
    initialize: function() {
      var game = this.collection;
      game.get('boards').on('add', this.addOne, this);
      
      game.fill();
    },
    
    addOne: function(item) {
      var view = new views.BoardView({model: item});
      $('#game').append(view.render().el);
    },
    
    render: function() {}
  });

})( app.views);