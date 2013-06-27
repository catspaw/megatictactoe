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
      this.$('.token').text(this.model.get('token'));
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
    
    initialize: function() {
      var squares = this.model.get('squares');
      squares.on('add', this.addOne, this);
      this.model.on('change', this.refresh, this);
      
      this.model.fill();
    },
    
    addOne: function(item) {
      var view = new views.SquareView({model: item});
      $('#boards').append(view.render().el);
    },
    
    refresh: function() {
      if (this.model.isWon()) {
        console.log("Big X on the board.");
      }
    },
    
    render: function() {
      return; // pass
    }
  });
  
  
  views.GameView = Backbone.View.extend({
    tagName: 'div',
    
    initialize: function() {
      var game = this.collection;
      game.get('boards').on('add', this.addOne, this);
      
      game.fill();
    },
    
    addOne: function(item) {
      var view = new views.BoardView({model: item});
      //$('#boards').append(view.render().el);
    }
  });

})( app.views);