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
      this.model.place(app.collections.game.get("currentToken"));
    }
  });


  views.BoardView = Backbone.View.extend({
    tagName: 'div',
    className: 'squares',
    
    template: _.template($('#boardTemplate').html()),
    
    initialize: function() {
      var squares = this.model.get('squares');
      squares.on('add', this.addOne, this);      
      this.model.on('change:active', this.setActive, this);
      this.model.on('change:winnerToken', this.captureBoard, this);
      
      this.$el.html(this.template(this.model.toJSON()));      
      this.model.fill();
    },
    
    addOne: function(item) {
      var view = new views.SquareView({model: item});
      // this.$('div').append(view.render().el);
      this.$el.append(view.render().el);
    },
    
    setActive: function() {
      if (this.model.get('active')) {
        this.$('.overlay').css('background', 'white');
        this.$('.overlay').css('pointer-events', 'none');
      } else {
        this.$('.overlay').css('background', 'grey');
        this.$('.overlay').css('pointer-events', 'auto');
      }
    },
    
    captureBoard: function() {
      var winnerImg = 'url(img/' + this.model.get('winnerToken') + '.jpg)';
      this.$('.capturedoverlay').css('background-image', winnerImg);
    },
    
    // Purposefully blank.  Let init and addOne handle all the rendering.
    render: function() {
      return this;
    }
    
   });
  
  
  views.GameView = Backbone.View.extend({
    el: 'body',
    
    events: {
      'click input[type=radio]': "changePlayerType"
    },
    
    initialize: function() {
      var game = this.collection;
      game.get('boards').on('add', this.addOne, this);
      game.on('change:currentToken', this.render, this);
      
      game.fill();
    },
    
    addOne: function(item) {
      var view = new views.BoardView({model: item});
      $('#game').append(view.render().el);
    },
    
    changePlayerType: function(e) {
      this.collection.set('opponent', $(e.currentTarget).val());
    },
    
    render: function() {
      $('#currentToken').html(this.collection.get('currentToken'));
      return this;
    }
    
  });

})( app.views);