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
      }
    },
  
    initialize: function() {
      this.set("ai", new models.Opponent({game: this}));
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
          var game = this;
          window.setTimeout( function() {
            game.get("ai").move();
          }, 1);
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
      this.get("game").get("boards").on('change:lastClickIndex',
                                        this.updateGameState, this);
                                        
      this.one_away_from_x_win = {0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false};
      this.one_away_from_o_win = {0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false};
    },
    
    move: function() {      
      if (this.get("difficulty") == "easy") {
        this.easy_move();
      } else if (this.get("difficulty") == "medium") {
        this.medium_move();
      }
    },
    
    // Select a move at random from the list of available moves.
    easy_move: function() {
      var board = this.get("game").getCurrentBoard();
      var choices = board.available_squares();
      var randomIndex = Math.floor(Math.random()*choices.length);
      
      console.log("I randomly choose square " + choices[randomIndex]);
      board.get("squares").at(choices[randomIndex]).place(this.get("token"));
    },
    
    // For each board we store:
    //   * Is the human player one-move-away from winning the board?
    //   * Am I one-move-away from winning the board?  (And if so, what is it?)
    updateGameState: function(board, clickIndex) {
      var board_index = board.collection.indexOf(board);
      var choices = board.available_squares();

      this.one_away_from_o_win[board_index] = false;
      this.one_away_from_x_win[board_index] = false;
      
      if (board.isWon()) {     
        return;  // This board has already been won.
      }
      
      for (var i=0; i<choices.length; i++) {
        var o_move = this.simulate_board_move(board, choices[i], "O");
        if (o_move.isWon()) {
          this.one_away_from_o_win[board_index] = choices[i];
        }
        var x_move = this.simulate_board_move(board, choices[i], "X");
        if (x_move.isWon()) {
          this.one_away_from_x_win[board_index] = choices[i];
        }
      }
      
    },
    
    // medium_move uses the following algorithm:
    //    If any of the moves allow me to win immediately, take it.
    //    If any of the moves block an opponent win, take it.
    //   Otherwise, randomly pick a spot on the board.
    //
    medium_move: function() {
      var board = this.get("game").getCurrentBoard();
      var board_index = board.collection.indexOf(board);
      var choices = board.available_squares();
      
      var instant_win = this.one_away_from_o_win[board_index];
      if (instant_win != false) {
        console.log("Moved to " + instant_win + " to win the board.");
        return board.get("squares").at(instant_win).place(this.get("token"));
      }
      
      var block_lose = this.one_away_from_x_win[board_index];
      if (block_lose != false) {
        console.log("Moved to " + block_lose + " to block a row.");
        return board.get("squares").at(block_lose).place(this.get("token"));
      }
      
      this.easy_move();
    },
 
    // hard_move uses the following algorithm:
    //    If any of the moves allow me to win immediately, take it.
    //    If any of the moves block an opponent win, take it.
    //    If the move results in a jump to a board where the opposite player
    //      would win the board, skip that move.  (If possible.)
    //    If the move results in a jump to a board where the opposite player
    //      blocks a 3-in-a-row we would otherwise have, skip that move.
    //      (If possible.)
    //   Otherwise, randomly pick a spot on the board.
    //
    hard_move: function() {
    },
    
    // Returns a new Board object, cloning the original board but placing
    // the given token at the given move location.
    simulate_board_move: function(board, move, token) {
      // Clone the given board
      var squares = board.get("squares");
      var clone = new models.Board();
      clone.fill();
      for (var j=0; j<9; j++) {
        clone.get("squares").at(j).set("token", squares.at(j).get("token"));
      }
      // Make the new move
      clone.get("squares").at(move).place(token);
      return clone;
    },
    
    changeDifficulty: function() {
      this.set("difficulty", this.get("game").get("opponent"));
      console.log("Changed difficulty to: " + this.get("game").get("opponent"));
    }
    
  });
  
})( app.models );