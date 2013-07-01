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
        // A collection of 9 squares that make up this board
        squares: new models.Squares(),
        
        // Once the game has won, which token won the board.
        winnerToken: "",
        
        // The last index of where this board was clicked.
        lastClickIndex: -1,
        
        // Whether or not this board can currently be clicked.
        active: false
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
    
    // Returns a list of all square indices that are available to be clicked.
    available_squares: function() {
      var available = [];
      for (var i=0; i<9; i++) {
        if (!(this.get('squares').at(i).isTaken())) {
          available.push(i);
        }
      }
      return available;
    },
    
    // One of our squares has been updated.  Check the status of the board.
    refresh: function(square) {
      if (!(this.isWon()) && this.checkForWin()) {
        this.set('winnerToken', square.get('token'));
        console.log("New winner!");
      }
      this.set('lastClickIndex', this.get('squares').indexOf(square));
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
        currentToken: "X",  // X gets to go first.
        opponent: "player",
        ai: new models.Opponent({game: this})
      }
    },
  
    initialize: function() {
      this.get('boards').on('change:winnerToken', this.checkEndState, this);
      this.get('boards').on('change:lastClickIndex', this.prepForNextMove, this);
    },
    
    // When a turn is over, switch which player is the currentToken and switch
    // which board is currently active
    prepForNextMove: function(last_board, index) {
      for (var i=0; i<9; i++) {
        this.get('boards').at(i).set('active', i == index);
      }
      
      if (this.get("currentToken") == "X") {
        this.set("currentToken", "O");
        if (this.get("opponent") != "player") {
          // Have our AI make the next move.
          this.get("ai").move();
        }
      } else {
        this.set("currentToken", "X");
      }
    },
    
    // Create nine empty Boards.
    fill: function() {
      for (var i=0; i<9; i++) {
        this.get('boards').add(new models.Board());
      }
      this.get('boards').at(4).set('active', true);
    },
    
    // Returns the current board.
    getCurrentBoard: function() {
      for (var i=0; i<9; i++) {
        if (this.get('boards').at(i).get('active')) {
          return this.get('boards').at(i);
        }
      }
      return null;  // Should never get here except on game state errors.
    },
    
    // When one of our boards has been won, check if the game is over.
    checkEndState: function() {
      // Lazy man's winner algorithm.  Check three Square indices for equality
      // excluding the empty string.
      var checkThree = function(x, y, z) {
        var sq = this.get('boards');
        if (!(sq.at(x).isWon())) {
          return false;
        }
        var first = sq.at(x).get('winnerToken');
        return first == sq.at(y).get('winnerToken') && first == sq.at(z).get('winnerToken');
      };
      
      checkThree = _.bind(checkThree, this);
      var row = checkThree(0,1,2) || checkThree(3,4,5) || checkThree(6,7,8);
      var col = checkThree(0,3,6) || checkThree(1,4,7) || checkThree(2,5,8);
      var diag = checkThree(0,4,8) || checkThree(2,4,6);
      
      if (row || col || diag) {
        alert("Game over.");
      }
    }

  });
  
  
  models.Opponent = Backbone.Model.extend({
    defaults: {
      game: null,
      difficulty: "easy",
      token: "O",
    },

    initialize: function() {
      this.get("game").on('change:opponent', this.changeDifficulty, this);
    },
    
    move: function() {
      var board = this.get("game").getCurrentBoard();
      var choices = board.available_squares();
      var randomIndex = Math.floor(Math.random()*choices.length);
      
      console.log("I choose square " + choices[randomIndex]);
      board.get("squares").at(choices[randomIndex]).place(this.get("token"));
    },
    
    changeDifficulty: function() {
      this.set("difficulty", this.get("game").get("opponent"));
      console.log("Changed difficulty to: " + this.get("game").get("opponent"));
    }
    
  });
  
})( app.models );