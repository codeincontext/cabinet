  Template.signup.events({'submit' : function(event) {
    event.preventDefault();
    handleSignup();
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
    var form = {};

    $.each($('#signupForm').serializeArray(), function() {
      form[this.name] = this.value;
    });

    form.idle = false;
    form.score = 0;

    console.log('FORM', form);

    var player_id = Players.insert(form);
    Session.set('player_id', player_id);

    loadGameScreen();

    // log player updates
    Deps.autorun(function () {
      var player = Players.findOne({_id:player_id});
      console.log('player updated:');
      console.log(player);
      $('.control__signoff__name').text(player.firstName.charAt(0).toUpperCase() + player.lastName);
      $('.player__score').text(player.score.toString());
    });

  }

  function loadGameScreen() {
    $('.signup__area').addClass('hide');
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
          });
        } else {
          Players.update({_id: Session.get('player_id')}, {$inc: {score: -1}});
        }
      });

    //   // console.log(task);
    //   // console.log(button);
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
  }


  Meteor.startup(function () {
    Meteor.subscribe('players', function () {

    });
  });


