Template.signup.events({'submit' : function(event) {
  event.preventDefault();
  handleSignup();
}});
Template.waiting.events({'submit' : function(event) {
  event.preventDefault();
  console.log('submit button clicked');
  startGame();
}});

function createSituationForPlayer(player_id) {
  var activeTasks = Tasks.find({active: true}).fetch();
  var randomID = Math.floor((Math.random()*activeTasks.length));
  var task = activeTasks[randomID];
  var situationId = Situations.insert({taskID: task._id, name: task.name, player_id: player_id});

  Meteor.setTimeout(function() {
    if (Situations.find({_id: situationId}).count()) {
      Situations.remove({_id: situationId});
      Players.update({_id: task.player_id}, {$inc: {score: -1}});
      Players.update({_id: player_id}, {$inc: {score: -1}});

      createSituationForPlayer(player_id);
    }
  }, 8000);
}

function handleSignup() {
  var form = {active: true, score: 0};

  $.each($('#signupForm').serializeArray(), function() {
    form[this.name] = this.value;
  });

  var player_id = Players.insert(form);
  Session.set('player_id', player_id);

  transitionToLobby();
  // loadGameScreen();

  // log player updates
  Deps.autorun(function () {
    var player = Players.findOne({_id:player_id});
    console.log('player updated:');
    console.log(player);
    $('.player__score').text(player.score.toString());
    $('.control__signoff__name').text(player.firstName.charAt(0).toUpperCase() + ' ' + player.lastName);
  });

}

function transitionToLobby() {
  $('.signup__area').addClass('hide');
  $('.lobby__area').removeClass('hide');

  Deps.autorun(function () {
    $('.lobby__area .players').empty();
    Players.find({active: true}).forEach(function(player) {
      var playerFragment = Meteor.render(Template.player(player));
      $('.lobby__area .players').append(playerFragment);
    });

  });

  var haveAlreadyStarted = false;
  Deps.autorun(function (c) {
    var game = Games.findOne();
    if (game.started && !haveAlreadyStarted) {
      loadGameScreen();
      haveAlreadyStarted = true;
    }
  });

}

function startGame() {
  var game = Games.findOne({});
  Games.update(game._id, {started: true});

  Meteor.setTimeout(function() {
    Games.update(game._id, {finished: true});

    Meteor.setTimeout(function() {
      Meteor.call('removeAll');
    }, 5*1000);

  }, 60*1000);
}


function loadGameScreen() {
  $('.lobby__area').addClass('hide');
  $('.play__area').removeClass('hide');

  Meteor.subscribe('tasks', function () {
    for (var i = 0; i < 4; i++) {
      var inactiveTasks = Tasks.find({active: false}).fetch();
      var randomID = Math.floor((Math.random()*inactiveTasks.length));
      var task = inactiveTasks[randomID];

      Tasks.update(task._id, {$set: {active: true, player_id: Session.get('player_id')}});

      var button = Meteor.render(Template.task(task));
      $('.control__buttons').append(button);
    }

    // TODO: make this more reactive
    $('.button').on('click', function() {
      var $this = $(this);
      var taskID = $this.data('id');

      $this.addClass('approved');
      $('.control__signoff').addClass('show');
      Meteor.setTimeout(function() {
        $this.removeClass('approved');
        $('.control__signoff').removeClass('show');
      }, 2000);

      var situationsToResolve = Situations.find({taskID: taskID}).fetch();
      if (situationsToResolve.length) {
        situationsToResolve.forEach(function(situation) {
          Situations.remove(situation._id);
          createSituationForPlayer(situation.player_id);

          Players.update({_id: situation.player_id}, {$inc: {score: 1}});
          Players.update({_id: Session.get('player_id')}, {$inc: {score: 1}});

          $('.play__area').addClass('good');
          Meteor.setTimeout(function() {
            $('.play__area').removeClass('good');
          }, 2000);
        });
      } else {
        Players.update({_id: Session.get('player_id')}, {$inc: {score: -1}});
        $('.play__area').addClass('bad');
        Meteor.setTimeout(function() {
          $('.play__area').removeClass('bad');
        }, 2000);
      }
    });
  });

  Meteor.subscribe('situations', function () {
    query = Situations.find({player_id: Session.get('player_id')});
    var handle = query.observeChanges({
      added: function (id, situation) {
        console.log("New situation");
        console.log(situation);

        var situationFragment = Meteor.render(Template.situation(situation));
        $('.drawer').html(situationFragment);

      }
    });

    var situation = createSituationForPlayer(Session.get('player_id'));
  });

  var haveAlreadyFinished = false;
  Deps.autorun(function (c) {
    var game = Games.findOne();
    console.log('checking for finish')
    
    if (game.finished && !haveAlreadyFinished) {
      transitionToFinishScreen();
      haveAlreadyFinished = true;
    }
  });

  Meteor.setInterval(function() {
    var haveAlreadyFinished = false;
    var game = Games.findOne();
    console.log('checking for finish')
    
    if (game.finished && !haveAlreadyFinished) {
      transitionToFinishScreen();
      haveAlreadyFinished = true;
    }
  },100);
}


function transitionToFinishScreen() {
  console.log('loading finish screen')
  $('.play__area').addClass('hide');
  $('.finish__area').removeClass('hide');

  $('.finish__area .players').empty();
  Players.find({active: true}, {sort: {score: -1}}).forEach(function(player) {
    var playerFragment = Meteor.render(Template.playerWithScore(player));
    $('.finish__area .players').append(playerFragment);
  });
}


Meteor.startup(function () {
  Meteor.subscribe('players', function () {

  });

  Meteor.subscribe('games', function () {

  });
});
