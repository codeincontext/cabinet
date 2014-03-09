Cabinet = {};
Players = new Meteor.Collection('players');
Tasks = new Meteor.Collection('tasks');
Situations = new Meteor.Collection('situations');



function createSituationForPlayer(player_id) {
  var activeTasks = Tasks.find({active: true}).fetch();
  var randomID = Math.floor((Math.random()*activeTasks.length));
  var task = activeTasks[randomID];
  Situations.insert({taskID: task._id, name: task.name, player_id: player_id});
}


function handleSignup() {
  var form = {};

  $.each($('#signupForm').serializeArray(), function() {
    form[this.name] = this.value;
  });

  form.idle = false;
  form.score = 0;

  console.log('FORM', form);

  var player_id = Players.insert(form, function(err) {
    if(!err) {
      $('#signupForm')[0].reset();
    } else {
      console.log(err);
    }
  });

  Session.set('player_id', player_id);

  Deps.autorun(function () {
    var player = Players.findOne({_id:player_id});
    console.log('player updated:');
    console.log(player);
  });

}

if (Meteor.isClient) {

  Template.signup.events({'submit' : function(event) {
    event.preventDefault();
    handleSignup();
  }});


  Meteor.startup(function () {

  });

  Meteor.subscribe('tasks', function () {

    for (var i = 0; i < 4; i++) {
      var inactiveTasks = Tasks.find({active: false}).fetch();
      var randomID = Math.floor((Math.random()*inactiveTasks.length));
      var task = inactiveTasks[randomID];

      Tasks.update(task._id, {$set: {active: true}});

      var button = Meteor.render(Template.task(task));
      $('.control__buttons').append(button);
    }

    // TODO: make this more reactive
    $('.button').on('click', function() {
      var taskID = $(this).data('id');

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

    // console.log(task);
    // console.log(button);
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

  Meteor.subscribe('players', function () {

  });

}

if (Meteor.isServer) {
  Tasks.remove({})

  if (Tasks.find().count() == 0) {
    console.log("Tasks list is empty. Populating from file");
    _.each(Assets.getText("tasks.txt").split("\n"), function (line) {
      if (line.length) Tasks.insert({name: line, active: false});
    });
  }

  Meteor.publish("tasks", function () {
    return Tasks.find({});
  });

  Meteor.publish("situations", function () {
    return Situations.find({});
  });

  Meteor.publish("players", function () {
    return Players.find({});
  });

  Meteor.onConnection(function () {
    console.log("User connected. Should assign cards");
  });

  Meteor.startup(function () {
    // code to run on server at startup
    Meteor.methods({
      removeAll: function() {
        Tasks.remove({});
        Players.remove({});
        Situations.remove({});
      }
    });
  });
}

