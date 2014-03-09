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

if (Meteor.isClient) {
  Meteor.startup(function () {
    var player_id = Players.insert({name: 'Bob', idle: false, score: 0});
    Session.set('player_id', player_id);

    Deps.autorun(function () {
      var player = Players.findOne({_id:player_id});
      console.log('player updated:');
      console.log(player);
    });
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
      console.log('resolved task: ' + taskID);

      var situationsToResolve = Situations.find({taskID: taskID}).fetch();
      if (situationsToResolve.length) {
        situationsToResolve.forEach(function(situation) {
          Situations.remove(situation._id);
          createSituationForPlayer(situation.player_id);

          Players.update({_id: situation.player_id}, {$inc: {score: 1}});
          Players.update({_id: Session.get('player_id')}, {$inc: {score: 1}});
        });
        console.log('yay!');
      } else {
        Players.update({_id: Session.get('player_id')}, {$inc: {score: -1}});
        console.log('boo!');
      }
    });

    // console.log(task);
    // console.log(button);
  });

  Meteor.subscribe('situations', function () {
    var situation = createSituationForPlayer(Session.get('player_id'));

    var situationFragment = Meteor.render(Template.situation(situation));
    $('.drawer').append(situation);

    query = Situations.find({player_id: Session.get('player_id')});
    var handle = query.observeChanges({
      added: function (id, situation) {
        console.log("New situation");
      }
    });
  });

}

if (Meteor.isServer) {
  Tasks.remove({})

  if (Tasks.find().count() == 0) {
    console.log("Tasks list is empty. Populating from file");
    _.each(Assets.getText("tasks.txt").split("\n"), function (line) {
      Tasks.insert({name: line, active: false});
    });
  }

  Meteor.publish("tasks", function () {
    return Tasks.find({});
  });

  Meteor.publish("situations", function () {
    return Situations.find({});
  });

  Meteor.publish("player", function (player_id) {
    return Players.findOne({_id: player_id});
  });

  Meteor.onConnection(function () {
    console.log("User connected. Should assign cards");
  });

  Meteor.startup(function () {
    // code to run on server at startup

  });
}
