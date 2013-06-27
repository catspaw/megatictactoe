(function ( models ) {
  // A Square represents a single square of a single tictactoe board.
  models.Square = Backbone.Model.extend({

  defaults: function() {
    return {
      token: "",  // Empty string means unclaimed
    }
  },

  isTaken: function() {
    return this.get("token") != "";
  },

  // Set the token onto this square.  If this square is already taken,
  // return false.
  place: function(token) {
    if (this.isTaken()) {
      return false;
    }
    
    this.set('token', token);
    return true;
  }
  
  });


  // A Collection of multiple Squares
  models.Squares = Backbone.Collection.extend({
    model: models.Square, 
  });


  // Board is a collection of Squares and some single-board metadata
  models.Board = Backbone.Model.extend({

    defaults: function() {
      return {
        squares: new models.Squares(),
        winnerToken: ""
      }
    },
  
    initialize: function() {
      this.get('squares').bind('change', this.refresh, this);
    },
    
    // Fill our Squares collection with nine empty squares
    fill: function() {
      for (var i=0; i<9; i++) {
        this.get('squares').add(new models.Square());
      }
    },
    
    // One of our squares has been updated.  Check the status of the board.
    refresh: function(token, index) {
      if (!(this.isWon()) && this.checkForWin()) {
        this.set('winnerToken', token);
        console.log("New winner!");
      }
    },
    
    isWon: function() {
      return this.get('winnerToken') != "";
    },
    
    // Returns whether or not the Squares on this board are in a win state.
    // Note: this checks the hard way (each individual square).  Use
    // Board.isWon() if you just want to verify whether or not the Board 
    // believes it is currently won.
    checkForWin: function() {
      // Lazy man's winner algorithm.  Check three Square indices for equality
      // excluding the empty string.
      var checkThree = function(x, y, z) {
        var sq = this.get('squares');
        if (!(sq.at(x).isTaken())) {
          return false;
        }
        var first = sq.at(x).get('token');
        return first == sq.at(y).get('token') && first == sq.at(z).get('token');
      };
      
      checkThree = _.bind(checkThree, this);
      var row = checkThree(0,1,2) || checkThree(3,4,5) || checkThree(6,7,8);
      var col = checkThree(0,3,6) || checkThree(1,4,7) || checkThree(2,5,8);
      var diag = checkThree(0,4,8) || checkThree(2,4,6);
      
      return row || col || diag;
    }
  
  });
  
  
  models.Boards = Backbone.Collection.extend({
    model: models.Board
  });
  
  
  // A Game is a Collection of exactly nine Boards and some game metadata.
  models.Game = Backbone.Model.extend({

    model: models.Board,
  
    defaults: function() {
      return {
        boards: new models.Boards(),
        currentToken: "X"  // X gets to go first.
      }
    },
  
    initialize: function() {
    },
    
    // When a turn is over, switch which player is the currentToken.
    swapTurns: function() {
      if (this.get("currentToken") == "X") {
        this.set("currentToken", "O");
      } else {
        this.set("currentToken", "X");
      }
    },
    
    // Create nine empty Boards.
    fill: function() {
      for (var i=0; i<9; i++) {
        this.get('boards').add(new models.Board());
      }      
    },

  });
  
})( app.models );