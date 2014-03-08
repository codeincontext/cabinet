Cabinet = {};
Players = new Meteor.Collection('players');
Tasks = new Meteor.Collection('tasks');
Situations = new Meteor.Collection('situations');


if (Meteor.isClient) {
  Template.task.events({
    'click': function () {
      // template data, if any, is available in 'this'
      console.log(this);
      console.log("You pressed the button");
      // Situations.remove(this._id);
    }
  });

  Meteor.startup(function () {

  });

  Meteor.subscribe('tasks', function () {

    for (var i = 0; i < 4; i++) {
      var taskCount = Tasks.find().count();
      var randomID = Math.floor((Math.random()*taskCount));
      var task = Tasks.findOne({}, {skip: randomID});
      Tasks.update(task._id, {$set: {active: true}});

      var button = Meteor.render(Template.task(task));
      $('body').append(button);
    }

    // TODO: make this more reactive
    $('.task-button').on('click', function() {
      var taskID = $(this).data('id');
      console.log('resolved task: ' + taskID);

      var situationsToResolve = Situations.find({taskID: taskID}).fetch();
      if (situationsToResolve.length) {
        situationsToResolve.forEach(function(situation) {
          Situations.remove(situation._id);
        });
        console.log('yay!');
      } else {
        console.log('boo!');
      }
    });

    // console.log(task);
    // console.log(button);
  });

}

if (Meteor.isServer) {
  if (Tasks.find().count() == 0) {
    console.log("Tasks list is empty. Populating from file");
    _.each(Assets.getText("tasks.txt").split("\n"), function (line) {
      Tasks.insert({name: line});
    });
  }

  Meteor.publish("tasks", function () {
    return Tasks.find({});
  });

  Meteor.onConnection(function () {
    console.log("User connected. Should assign cards");
  });

  Meteor.startup(function () {
    // code to run on server at startup
    Meteor.setInterval(function () {
      createSituation();
    }, 8000);
  });

  function createSituation() {
    var activeTasks = Tasks.find({active: true}).fetch();
    var randomID = Math.floor((Math.random()*activeTasks.length));
    var task = activeTasks[randomID];
    Situations.insert({taskID: task._id, name: task.name});
  }
}
